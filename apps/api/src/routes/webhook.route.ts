import { Router, type Request, type Response, type RequestHandler, type IRouter } from "express";
import { reviewService } from "../services/review.service.js";
import { enqueueReview } from "../queue/producer.js";
import { verifyWebhookSignature, type PullRequestEvent } from "../github/webhook.js";
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

  // Only process pull_request events
  if (event !== "pull_request") return;

  const payload = req.body as PullRequestEvent;
  const { action, pull_request: pr, repository, installation } = payload;

  // Only process when PR is opened, updated, or reopened
  if (!["opened", "synchronize", "reopened"].includes(action)) return;

  logger.info("📬 PR webhook received", {
    action,
    repo: repository.full_name,
    prNumber: pr.number,
    sha: pr.head.sha.slice(0, 8),
  });

  try {
    // Upsert repository record
    const repoInfo = await reviewService.upsertRepository(
      repository.id,
      repository.full_name,
      installation.id
    );

    if (!repoInfo.enabled) {
      logger.info("Skipping review because AI bot is disabled for this repository", { 
        prNumber: pr.number, 
        repo: repository.full_name 
      });
      return;
    }

    const repoId = repoInfo.id;

    // Create review record (returns null if duplicate)
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

    // Enqueue async review job
    await enqueueReview({
      reviewId,
      repoId,
      installationId: installation.id,
      owner: repository.full_name.split("/")[0],
      repo: repository.full_name.split("/")[1],
      prNumber: pr.number,
      prTitle: pr.title,
      commitSha: pr.head.sha,
    });
  } catch (err) {
    logger.error("Failed to handle webhook", { error: err });
  }
};

webhookRouter.post("/", webhookHandler);
