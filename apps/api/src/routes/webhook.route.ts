import { Router, type Request, type Response, type RequestHandler, type IRouter } from "express";
import { reviewService } from "../services/review.service.js";
import { enqueueReview } from "../queue/producer.js";
import {
  verifyWebhookSignature,
  type PullRequestEvent,
  type IssueCommentEvent,
  type PullRequestReviewCommentEvent,
} from "../github/webhook.js";
import { handleCommentCommand } from "../github/comment-reply.js";
import { logger } from "../config/logger.js";

export const webhookRouter: IRouter = Router();

// Raw body is needed for HMAC signature verification
const webhookHandler: RequestHandler = async (req: Request, res: Response) => {
  const signature = req.headers["x-hub-signature-256"] as string | undefined;
  const event = req.headers["x-github-event"] as string | undefined;

  // Verify signature first
  const rawBody = (req as any).rawBody as string;
  if (!verifyWebhookSignature(rawBody, signature)) {
    logger.warn("Invalid webhook signature", { ip: req.ip });
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  // Respond immediately — GitHub expects a fast 200
  res.status(200).json({ received: true });

  // ── Route to the correct handler based on event type ──────────────────────

  if (event === "pull_request") {
    await handlePullRequestEvent(req.body);
  } else if (event === "issue_comment") {
    await handleIssueCommentEvent(req.body);
  } else if (event === "pull_request_review_comment") {
    await handleReviewCommentEvent(req.body);
  }
};

// ─── Pull Request Event Handler ───────────────────────────────────────────────

async function handlePullRequestEvent(payload: PullRequestEvent): Promise<void> {
  const { action, pull_request: pr, repository, installation } = payload;

  const reviewableActions = ["opened", "synchronize", "reopened", "ready_for_review"];
  if (!reviewableActions.includes(action)) return;

  const isDraft = pr.draft ?? false;

  logger.info("📬 PR webhook received", {
    action,
    repo: repository.full_name,
    prNumber: pr.number,
    sha: pr.head.sha.slice(0, 8),
  });

  try {
    const repoInfo = await reviewService.upsertRepository(
      repository.id,
      repository.full_name,
      installation.id
    );

    if (!repoInfo.enabled) {
      logger.info("Skipping review because AI bot is disabled for this repository", {
        prNumber: pr.number,
        repo: repository.full_name,
      });
      return;
    }

    const repoId = repoInfo.id;

    const reviewId = await reviewService.createReview({
      repoId,
      prNumber: pr.number,
      prTitle: pr.title,
      prAuthor: pr.user.login,
      prUrl: pr.html_url,
      commitSha: pr.head.sha,
    });

    if (!reviewId) {
      logger.info("Skipping duplicate review", { prNumber: pr.number });
      return;
    }

    await enqueueReview({
      reviewId,
      repoId,
      installationId: installation.id,
      owner: repository.full_name.split("/")[0],
      repo: repository.full_name.split("/")[1],
      prNumber: pr.number,
      prTitle: pr.title,
      commitSha: pr.head.sha,
      isDraft,
    });
  } catch (err) {
    logger.error("Failed to handle pull_request webhook", { error: err });
  }
}

// ─── Issue Comment Event Handler ──────────────────────────────────────────────
// Handles /explain and /accept commands on PR conversation comments

async function handleIssueCommentEvent(payload: IssueCommentEvent): Promise<void> {
  // Only process "created" actions on PR comments
  if (payload.action !== "created") return;
  if (!payload.issue.pull_request) return; // Not a PR comment

  const { comment, issue, repository, installation } = payload;
  const normalizedBody = comment.body?.trim().toLowerCase() ?? "";

  // Check for /explain or /accept commands
  if (!normalizedBody.startsWith("/explain") && !normalizedBody.startsWith("/accept")) return;

  // Must be a reply to an existing comment
  if (!comment.in_reply_to_id) {
    logger.warn("Command received without in_reply_to_id", {
      command: comment.body?.trim(),
      commentId: comment.id,
    });
    return;
  }

  const { owner, repo } = parseRepo(repository.full_name);

  logger.info("💬 Comment command received", {
    command: comment.body?.trim(),
    prNumber: issue.number,
    repo: repository.full_name,
    parentCommentId: comment.in_reply_to_id,
  });

  await handleCommentCommand({
    installationId: installation.id,
    owner,
    repo,
    prNumber: issue.number,
    prTitle: `PR #${issue.number}`,
    commentBody: comment.body?.trim() ?? "",
    parentCommentId: comment.in_reply_to_id,
    replyCommentId: comment.id,
  });
}

// ─── Pull Request Review Comment Event Handler ────────────────────────────────
// Handles /explain and /accept commands on inline review comments

async function handleReviewCommentEvent(payload: PullRequestReviewCommentEvent): Promise<void> {
  if (payload.action !== "created") return;

  const { comment, pull_request: pr, repository, installation } = payload;
  const normalizedBody = comment.body?.trim().toLowerCase() ?? "";

  if (!normalizedBody.startsWith("/explain") && !normalizedBody.startsWith("/accept")) return;

  if (!comment.in_reply_to_id) {
    logger.warn("Command received without in_reply_to_id", {
      command: comment.body?.trim(),
      commentId: comment.id,
    });
    return;
  }

  const { owner, repo } = parseRepo(repository.full_name);

  logger.info("💬 Review comment command received", {
    command: comment.body?.trim(),
    prNumber: pr.number,
    repo: repository.full_name,
    parentCommentId: comment.in_reply_to_id,
  });

  await handleCommentCommand({
    installationId: installation.id,
    owner,
    repo,
    prNumber: pr.number,
    prTitle: pr.title,
    commentBody: comment.body?.trim() ?? "",
    parentCommentId: comment.in_reply_to_id,
    replyCommentId: comment.id,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseRepo(fullName: string): { owner: string; repo: string } {
  const [owner, repo] = fullName.split("/");
  return { owner, repo };
}

webhookRouter.post("/", webhookHandler);
