import { Queue, QueueEvents } from "bullmq";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export const REVIEW_QUEUE_NAME = "code-review";
export const DEAD_LETTER_QUEUE_NAME = "code-review-dlq";

// ─── Redis Connection ─────────────────────────────────────────────────────────
export const redisConnection = { url: env.REDIS_URL };

// ─── Queues ───────────────────────────────────────────────────────────────────

export const reviewQueue = new Queue(REVIEW_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export const deadLetterQueue = new Queue(DEAD_LETTER_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: false,
    removeOnFail: false,
  },
});

// ─── Queue Events (for monitoring) ────────────────────────────────────────────

const reviewQueueEvents = new QueueEvents(REVIEW_QUEUE_NAME, {
  connection: redisConnection,
});

reviewQueueEvents.on("waiting", ({ jobId }) => {
  logger.debug("Job waiting in queue", { jobId });
});

reviewQueueEvents.on("delayed", ({ jobId, delay }) => {
  logger.debug("Job delayed for retry", { jobId, delayMs: delay });
});

// ─── Job Types ────────────────────────────────────────────────────────────────

export interface ReviewJobData {
  reviewId: number;
  repoId: number;
  installationId: number;
  owner: string;
  repo: string;
  prNumber: number;
  prTitle: string;
  commitSha: string;
  isDraft?: boolean; // For incremental draft PR reviews
}

export interface DeadLetterJobData {
  reviewId: number;
  repoId: number;
  installationId: number;
  owner: string;
  repo: string;
  prNumber: number;
  prTitle: string;
  commitSha: string;
  error: string;
  failedAt: string;
  attemptsMade: number;
}

/**
 * Enqueues a new code review job.
 */
export async function enqueueReview(data: ReviewJobData): Promise<void> {
  await reviewQueue.add("review", data, {
    jobId: `review-${data.repoId}-${data.prNumber}-${data.commitSha.slice(0, 8)}`,
  });
  logger.info("📥 Review job enqueued", {
    prNumber: data.prNumber,
    repo: `${data.owner}/${data.repo}`,
    isDraft: data.isDraft ?? false,
  });
}

/**
 * Moves a permanently failed job to the dead letter queue for inspection.
 */
export async function enqueueDeadLetter(data: DeadLetterJobData): Promise<void> {
  await deadLetterQueue.add("dead-letter", data, {
    jobId: `dlq-${data.reviewId}-${Date.now()}`,
  });
  logger.error("💀 Job moved to dead letter queue", {
    reviewId: data.reviewId,
    prNumber: data.prNumber,
    error: data.error,
  });
}