import { Worker, type Job } from "bullmq";
import { redisConnection, REVIEW_QUEUE_NAME, type ReviewJobData } from "./producer.js";
import { reviewService } from "../services/review.service.js";
import { logger } from "../config/logger.js";

/**
 * BullMQ worker that processes code review jobs.
 * Concurrency of 2 to respect OpenAI and GitHub rate limits.
 */
export const reviewWorker = new Worker<ReviewJobData>(
  REVIEW_QUEUE_NAME,
  async (job: Job<ReviewJobData>) => {
    logger.info(`🔄 Processing review job`, {
      jobId: job.id,
      prNumber: job.data.prNumber,
      repo: `${job.data.owner}/${job.data.repo}`,
    });

    await reviewService.processReview(job.data);
  },
  {
    connection: redisConnection,
    concurrency: 2,
  }
);

reviewWorker.on("completed", (job) => {
  logger.info(`✅ Review job completed`, { jobId: job.id });
});

reviewWorker.on("failed", (job, err) => {
  logger.error(`❌ Review job failed`, {
    jobId: job?.id,
    error: err.message,
    attempts: job?.attemptsMade,
  });
});

reviewWorker.on("error", (err) => {
  logger.error("Worker error", { error: err });
});

export function startWorker(): void {
  logger.info("🚀 Review worker started");
}
