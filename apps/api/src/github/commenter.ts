import { App } from "octokit";
import type { Octokit } from "octokit";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import type { ReviewComment } from "../ai/reviewer.js";

// Decode base64-encoded private key from env
const privateKey = Buffer.from(env.GITHUB_APP_PRIVATE_KEY, "base64").toString(
  "utf-8"
);

const githubApp: App = new App({
  appId: env.GITHUB_APP_ID,
  privateKey,
  webhooks: { secret: env.GITHUB_WEBHOOK_SECRET },
});



/**
 * Gets an authenticated Octokit instance for a specific installation.
 */
export async function getInstallationOctokit(installationId: number): Promise<Octokit> {
  return githubApp.getInstallationOctokit(installationId);
}

/**
 * Fetches the raw unified diff for a pull request.
 */
export async function fetchPullRequestDiff(
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number
): Promise<string> {
  const octokit = await getInstallationOctokit(installationId);

  const response = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}",
    {
      owner,
      repo,
      pull_number: pullNumber,
      headers: {
        accept: "application/vnd.github.v3.diff",
      },
    }
  );

  return response.data as unknown as string;
}

/**
 * Posts a pull request review with inline comments via the GitHub API.
 */
export async function postPullRequestReview(
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number,
  commitSha: string,
  summary: string,
  reviewComments: ReviewComment[]
): Promise<void> {
  const octokit = await getInstallationOctokit(installationId);

  // Filter out comments without a valid diff position
  const inlineComments = reviewComments
    .filter((c) => c.diffPosition !== undefined && c.diffPosition > 0)
    .map((c) => ({
      path: c.file,
      position: c.diffPosition!,
      body: formatCommentBody(c),
    }));

  try {
    await octokit.request(
      "POST /repos/{owner}/{repo}/pulls/{pull_number}/reviews",
      {
        owner,
        repo,
        pull_number: pullNumber,
        commit_id: commitSha,
        body: formatSummaryBody(summary, reviewComments),
        event: "COMMENT",
        comments: inlineComments,
      }
    );

    logger.info("✅ Posted PR review", {
      owner,
      repo,
      pullNumber,
      inlineCommentCount: inlineComments.length,
    });
  } catch (err) {
    logger.error("Failed to post PR review", { error: err });
    throw err;
  }
}

function formatCommentBody(comment: ReviewComment): string {
  const severityEmoji: Record<string, string> = {
    bug: "🐛",
    security: "🔒",
    improvement: "💡",
    style: "🎨",
    info: "ℹ️",
  };
  const emoji = severityEmoji[comment.severity] ?? "💬";
  return `${emoji} **[${comment.severity.toUpperCase()}]** ${comment.comment}`;
}

function formatSummaryBody(
  summary: string,
  comments: ReviewComment[]
): string {
  const counts: Record<string, number> = {};
  for (const c of comments) {
    counts[c.severity] = (counts[c.severity] ?? 0) + 1;
  }

  const breakdown = Object.entries(counts)
    .map(([sev, count]) => `- **${sev}**: ${count}`)
    .join("\n");

  return `## 🤖 AI Code Review

${summary}

### Comment Summary
${breakdown || "No issues found."}

---
*Reviewed by [AI Code Review Bot](https://github.com) powered by GPT-4o*`;
}
