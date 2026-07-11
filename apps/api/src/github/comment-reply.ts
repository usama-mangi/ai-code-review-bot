import OpenAI from "openai";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { getInstallationOctokit } from "./commenter.js";
import {
  EXPLAIN_SYSTEM_PROMPT,
  buildExplainPrompt,
} from "../ai/prompts.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OriginalReviewComment {
  id: number;
  body: string;
  path: string;
  line?: number;
  diff_hunk: string;
  commit_id: string;
  user: { login: string };
  pull_request_review_id: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Creates an OpenAI client from the current env config.
 * Reuses the same provider settings as the main review pipeline.
 */
function createOpenAIClient(): OpenAI {
  return new OpenAI({
    baseURL: env.OPENAI_BASE_URL,
    apiKey: env.OPENAI_API_KEY,
  });
}

/**
 * Extracts a suggestion from a review comment body.
 * Looks for ```suggestion blocks.
 */
function extractSuggestion(commentBody: string): string | null {
  const match = commentBody.match(/```suggestion\n([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

/**
 * Parses the owner and repo from a full_name string.
 */
function parseRepo(fullName: string): { owner: string; repo: string } {
  const [owner, repo] = fullName.split("/");
  return { owner, repo };
}

// ─── /explain Handler ─────────────────────────────────────────────────────────

/**
 * Handles the /explain command.
 * Fetches the original review comment, gets the diff context,
 * calls the AI for a detailed explanation, and replies.
 */
export async function handleExplainCommand(params: {
  installationId: number;
  owner: string;
  repo: string;
  prNumber: number;
  prTitle: string;
  parentCommentId: number;
  replyCommentId: number;
}): Promise<void> {
  const { installationId, owner, repo, prNumber, prTitle, parentCommentId, replyCommentId } = params;

  try {
    const octokit = await getInstallationOctokit(installationId);

    // 1. Fetch the original review comment
    const parentComment = await fetchReviewComment(octokit, owner, repo, parentCommentId);

    // 2. Build the explain prompt with context
    const issueContext = `${parentComment.body}`;
    const diffHunk = parentComment.diff_hunk;
    const userPrompt = buildExplainPrompt(issueContext, diffHunk, prTitle);

    // 3. Call the AI
    const client = createOpenAIClient();
    const response = await client.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: "system", content: EXPLAIN_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    });

    const explanation = response.choices[0]?.message?.content;
    if (!explanation) {
      throw new Error("Empty response from AI provider");
    }

    // 4. Reply to the comment with the explanation
    const replyBody = `## 🤖 Detailed Explanation\n\n${explanation}\n\n---\n*Powered by AI*`;
    await replyToComment(octokit, owner, repo, prNumber, parentCommentId, replyBody);

    logger.info("✅ /explain reply posted", {
      prNumber,
      repo: `${owner}/${repo}`,
      parentCommentId,
    });
  } catch (err) {
    logger.error("❌ /explain handler failed", { error: err });
    // Notify the user that the command failed
    try {
      const octokit = await getInstallationOctokit(installationId);
      await replyToComment(
        octokit,
        owner,
        repo,
        prNumber,
        parentCommentId,
        "❌ Sorry, I couldn't generate an explanation. Please try again later."
      );
    } catch {
      // Ignore reply errors
    }
  }
}

// ─── /accept Handler ──────────────────────────────────────────────────────────

/**
 * Handles the /accept command.
 * Extracts the suggestion from the original review comment,
 * applies it to the PR branch using the Git Data API, and confirms.
 */
export async function handleAcceptCommand(params: {
  installationId: number;
  owner: string;
  repo: string;
  prNumber: number;
  prTitle: string;
  parentCommentId: number;
  replyCommentId: number;
}): Promise<void> {
  const { installationId, owner, repo, prNumber, prTitle, parentCommentId, replyCommentId } = params;

  try {
    const octokit = await getInstallationOctokit(installationId);

    // 1. Fetch the original review comment
    const parentComment = await fetchReviewComment(octokit, owner, repo, parentCommentId);

    // 2. Extract the suggestion from the comment body
    const suggestion = extractSuggestion(parentComment.body);
    if (!suggestion) {
      await replyToComment(
        octokit,
        owner,
        repo,
        prNumber,
        parentCommentId,
        "❌ No suggestion block found in this comment. The `/accept` command only works on comments with a `\\`\\`\\`suggestion` block."
      );
      return;
    }

    // 3. Apply the suggestion by creating a commit on the PR branch
    await applySuggestionAsCommit(
      octokit,
      owner,
      repo,
      prNumber,
      parentComment,
      suggestion
    );

    // 4. Reply with confirmation
    const confirmBody = `## ✅ Suggestion Applied\n\nThe suggested change has been committed to the branch.\n\n\`\`\`suggestion\n${suggestion}\n\`\`\`\n\n---\n*Applied by AI Code Review Bot*`;
    await replyToComment(octokit, owner, repo, prNumber, parentCommentId, confirmBody);

    logger.info("✅ /accept suggestion applied", {
      prNumber,
      repo: `${owner}/${repo}`,
      file: parentComment.path,
      parentCommentId,
    });
  } catch (err) {
    logger.error("❌ /accept handler failed", { error: err });
    try {
      const octokit = await getInstallationOctokit(installationId);
      await replyToComment(
        octokit,
        owner,
        repo,
        prNumber,
        parentCommentId,
        `❌ Sorry, I couldn't apply the suggestion: ${(err as Error).message}`
      );
    } catch {
      // Ignore reply errors
    }
  }
}

// ─── Git Data API: Apply Suggestion as Commit ─────────────────────────────────

/**
 * Applies a suggested code change by creating a commit on the PR branch
 * using the GitHub Git Data API.
 */
async function applySuggestionAsCommit(
  octokit: any,
  owner: string,
  repo: string,
  prNumber: number,
  parentComment: OriginalReviewComment,
  replacementCode: string
): Promise<void> {
  const filePath = parentComment.path;
  const lineNumber = parentComment.line ?? 0;
  const diffHunk = parentComment.diff_hunk;

  // 1. Get the PR details to find the branch
  const { data: pr } = await octokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}", {
    owner,
    repo,
    pull_number: prNumber,
  });

  const branch = pr.head.ref;

  // 2. Get the current head commit's ref
  const { data: ref } = await octokit.request("GET /repos/{owner}/{repo}/git/refs/heads/{branch}", {
    owner,
    repo,
    branch,
  });

  const headCommitSha = ref.object.sha;

  // 3. Get the current commit tree
  const { data: headCommit } = await octokit.request("GET /repos/{owner}/{repo}/git/commits/{commit_sha}", {
    owner,
    repo,
    commit_sha: headCommitSha,
  });

  // 4. Get the current file content
  let currentContent: string;
  try {
    const { data: fileData } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner,
      repo,
      path: filePath,
      ref: branch,
    });
    currentContent = Buffer.from(fileData.content, "base64").toString("utf-8");
  } catch {
    // File might not exist yet (new file in PR)
    currentContent = "";
  }

  // 5. Apply the replacement to the correct lines
  // Parse the diff hunk to find the target line range
  const hunkHeaderMatch = diffHunk.match(/@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/);
  if (!hunkHeaderMatch) {
    throw new Error("Could not parse diff hunk header");
  }

  const startLine = parseInt(hunkHeaderMatch[1], 10);
  const hunkLineCount = hunkHeaderMatch[2] ? parseInt(hunkHeaderMatch[2], 10) : 1;

  // Count the actual added/modified lines in the hunk to determine replacement range
  const hunkLines = diffHunk.split("\n");
  const addedLines: number[] = [];
  let currentLineNum = startLine;

  for (const line of hunkLines) {
    if (line.startsWith("+") && !line.startsWith("+++")) {
      addedLines.push(currentLineNum);
      currentLineNum++;
    } else if (line.startsWith(" ") && !line.startsWith("@@")) {
      currentLineNum++;
    } else if (line.startsWith("-")) {
      // Context lines removed — they affect the mapping
      continue;
    }
  }

  if (addedLines.length === 0) {
    // Fallback: use the whole hunk span
    const fileLines = currentContent.split("\n");
    const replacementLines = replacementCode.split("\n");
    fileLines.splice(startLine - 1, hunkLineCount, ...replacementLines);
    currentContent = fileLines.join("\n");
  } else {
    const fileLines = currentContent.split("\n");
    const replacementLines = replacementCode.split("\n");
    const firstLine = addedLines[0];
    const lastLine = addedLines[addedLines.length - 1];
    const replaceCount = lastLine - firstLine + 1;
    fileLines.splice(firstLine - 1, replaceCount, ...replacementLines);
    currentContent = fileLines.join("\n");
  }

  // 6. Create a new blob with the updated content
  const { data: blob } = await octokit.request("POST /repos/{owner}/{repo}/git/blobs", {
    owner,
    repo,
    content: currentContent,
    encoding: "utf-8",
  });

  // 7. Find the tree entry for the file and update it
  const { data: currentTree } = await octokit.request("GET /repos/{owner}/{repo}/git/trees/{tree_sha}", {
    owner,
    repo,
    tree_sha: headCommit.tree.sha,
  });

  // Keep all existing tree entries, replace the target file
  const updatedTree = currentTree.tree.map((entry: any) => {
    if (entry.path === filePath) {
      return { ...entry, sha: blob.sha, mode: "100644" as const, type: "blob" as const };
    }
    return entry;
  });

  // If the file doesn't exist in the tree (new file), add it
  if (!currentTree.tree.some((entry: any) => entry.path === filePath)) {
    updatedTree.push({
      path: filePath,
      mode: "100644" as const,
      type: "blob" as const,
      sha: blob.sha,
    });
  }

  // 8. Create a new tree
  const { data: newTree } = await octokit.request("POST /repos/{owner}/{repo}/git/trees", {
    owner,
    repo,
    base_tree: headCommit.tree.sha,
    tree: updatedTree,
  });

  // 9. Create a commit
  const commitMessage = `🤖 Apply code review suggestion for ${filePath}\n\nAutomatically applied via AI Code Review Bot /accept command.`;
  const { data: newCommit } = await octokit.request("POST /repos/{owner}/{repo}/git/commits", {
    owner,
    repo,
    message: commitMessage,
    tree: newTree.sha,
    parents: [headCommitSha],
  });

  // 10. Update the branch reference to point to the new commit
  await octokit.request("PATCH /repos/{owner}/{repo}/git/refs/heads/{branch}", {
    owner,
    repo,
    branch,
    sha: newCommit.sha,
    force: false,
  });
}

// ─── GitHub API Helpers ───────────────────────────────────────────────────────

/**
 * Fetches a pull request review comment by ID.
 * Review comments are fetched via the pulls/comments endpoint.
 */
async function fetchReviewComment(
  octokit: any,
  owner: string,
  repo: string,
  commentId: number
): Promise<OriginalReviewComment> {
  const { data } = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/comments/{comment_id}",
    { owner, repo, comment_id: commentId }
  );
  return data;
}

/**
 * Fetches an issue comment by ID.
 * Issue comments are fetched via the issues/comments endpoint.
 */
async function fetchIssueComment(
  octokit: any,
  owner: string,
  repo: string,
  commentId: number
): Promise<{ body: string; user: { login: string } }> {
  const { data } = await octokit.request(
    "GET /repos/{owner}/{repo}/issues/comments/{comment_id}",
    { owner, repo, comment_id: commentId }
  );
  return data;
}

/**
 * Replies to a pull request review comment.
 */
async function replyToComment(
  octokit: any,
  owner: string,
  repo: string,
  pullNumber: number,
  commentId: number,
  body: string
): Promise<void> {
  await octokit.request(
    "POST /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies",
    { owner, repo, pull_number: pullNumber, comment_id: commentId, body }
  );
}

/**
 * Posts a new issue comment on a pull request.
 */
async function postIssueComment(
  octokit: any,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string
): Promise<void> {
  await octokit.request("POST /repos/{owner}/{repo}/issues/{issue_number}/comments", {
    owner,
    repo,
    issue_number: issueNumber,
    body,
  });
}

// ─── Unified Entry Point ──────────────────────────────────────────────────────

/**
 * Processes a comment reply with a command (/explain or /accept).
 * This is the main entry point called from the webhook route.
 */
export async function handleCommentCommand(params: {
  installationId: number;
  owner: string;
  repo: string;
  prNumber: number;
  prTitle: string;
  commentBody: string;
  parentCommentId: number;
  replyCommentId: number;
}): Promise<void> {
  const { commentBody } = params;
  const normalizedBody = commentBody.trim().toLowerCase();

  if (normalizedBody.startsWith("/explain")) {
    logger.info("📖 Processing /explain command", {
      prNumber: params.prNumber,
      parentCommentId: params.parentCommentId,
    });
    await handleExplainCommand(params);
  } else if (normalizedBody.startsWith("/accept")) {
    logger.info("✅ Processing /accept command", {
      prNumber: params.prNumber,
      parentCommentId: params.parentCommentId,
    });
    await handleAcceptCommand(params);
  }
}