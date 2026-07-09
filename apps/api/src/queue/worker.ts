import { Worker, type Job } from "bullmq";
import {
  redisConnection,
  REVIEW_QUEUE_NAME,
  DEAD_LETTER_QUEUE_NAME,
  type ReviewJobData,
  enqueueDeadLetter,
} from "./producer.js";
import { reviewService } from "../services/review.service.js";
import { logger } from "../config/logger.js";

/**
 * BullMQ worker that processes code review jobs.
 * Concurrency of 2 to respect AI provider and GitHub rate limits.
 */
export const reviewWorker = new Worker<ReviewJobData>(
  REVIEW_QUEUE_NAME,
  async (job: Job<ReviewJobData>) => {
    logger.info(`🔄 Processing review job`, {
      jobId: job.id,
      prNumber: job.data.prNumber,
      repo: `${job.data.owner}/${job.data.repo}`,
      isDraft: job.data.isDraft ?? false,
      attempt: job.attemptsMade + 1,
    });

    await reviewService.processReview(job.data);
  },
  {
    connection: redisConnection,
    concurrency: 2,
    limiter: {
      max: 10,
      duration: 60_000, // Max 10 jobs per minute to respect rate limits
    },
  }
);

// ─── Dead Letter Queue Worker ─────────────────────────────────────────────────
// Processes jobs that have permanently failed after all retries.
// Logs them for manual inspection and can trigger alerts.

const deadLetterWorker = new Worker(
  DEAD_LETTER_QUEUE_NAME,
  async (job) => {
    logger.error("💀 Dead letter job — requires manual intervention", {
      jobId: job.id,
      reviewId: job.data.reviewId,
      prNumber: job.data.prNumber,
      repo: `${job.data.owner}/${job.data.repo}`,
      error: job.data.error,
      attemptsMade: job.data.attemptsMade,
      failedAt: job.data.failedAt,
    });
  },
  {
    connection: redisConnection,
    removeOnComplete: { count: -1 },
    removeOnFail: { count: -1 },
  }
);

// ─── Event Handlers ───────────────────────────────────────────────────────────

reviewWorker.on("completed", (job) => {
  logger.info(`✅ Review job completed`, { jobId: job.id });
});

reviewWorker.on("failed", async (job, err) => {
  const attemptsMade = job?.attemptsMade ?? 0;
  const maxAttempts = job?.opts?.attempts ?? 5;

  logger.error(`❌ Review job failed`, {
    jobId: job?.id,
    error: err.message,
    attempts: attemptsMade,
    maxAttempts,
  });

  // If this was the last attempt, move to dead letter queue
  if (job && attemptsMade >= maxAttempts) {
    await enqueueDeadLetter({
      reviewId: job.data.reviewId,
      repoId: job.data.repoId,
      installationId: job.data.installationId,
      owner: job.data.owner,
      repo: job.data.repo,
      prNumber: job.data.prNumber,
      prTitle: job.data.prTitle,
      commitSha: job.data.commitSha,
      error: err.message,
      failedAt: new Date().toISOString(),
      attemptsMade,
    }).catch((dlqErr) => {
      logger.error("Failed to enqueue dead letter", { error: dlqErr });
    });
  }
});

reviewWorker.on("error", (err) => {
  logger.error("Worker error", { error: err });
});

deadLetterWorker.on("completed", (job) => {
  logger.info("Dead letter job logged", { jobId: job.id });
});

deadLetterWorker.on("failed", (job, err) => {
  logger.error("Dead letter worker failed", { jobId: job?.id, error: err });
});

export function startWorker(): void {
  logger.info("🚀 Review worker started (with DLQ)");
}