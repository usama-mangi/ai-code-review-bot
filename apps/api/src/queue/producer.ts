import { Queue } from "bullmq";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export const REVIEW_QUEUE_NAME = "code-review";

// ─── Redis Connection ─────────────────────────────────────────────────────────
// Pass URL string directly — BullMQ uses its own bundled ioredis internally,
// avoiding version mismatch type errors with an external IORedis instance.
export const redisConnection = { url: env.REDIS_URL };

// ─── Queue ────────────────────────────────────────────────────────────────────

export const reviewQueue = new Queue(REVIEW_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
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
  });
}
