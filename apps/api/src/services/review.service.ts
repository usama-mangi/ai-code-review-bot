import { db } from "../db/index.js";
import { reviews, comments, repositories } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { parseDiff, formatDiffForAI } from "../github/diff-parser.js";
import { fetchPullRequestDiff, postPullRequestReview } from "../github/commenter.js";
import { reviewDiff, type ReviewComment } from "../ai/reviewer.js";
import { logger } from "../config/logger.js";
import type { ReviewJobData } from "../queue/producer.js";

class ReviewService {
  /**
   * Main orchestration: fetch diff → parse → AI review → post comments → save to DB.
   */
  async processReview(data: ReviewJobData): Promise<void> {
    const { reviewId, installationId, owner, repo, prNumber, prTitle, commitSha } = data;

    // Mark as processing
    await db
      .update(reviews)
      .set({ status: "processing" })
      .where(eq(reviews.id, reviewId));

    try {
      // 1. Fetch the PR diff from GitHub
      logger.info("📄 Fetching PR diff", { prNumber, repo: `${owner}/${repo}` });
      const rawDiff = await fetchPullRequestDiff(installationId, owner, repo, prNumber);

      // 2. Parse the diff
      const diffChunks = parseDiff(rawDiff);
      const formattedDiff = formatDiffForAI(diffChunks);
      const filesChanged = diffChunks.length;

      if (!formattedDiff.trim()) {
        logger.info("No reviewable changes found", { prNumber });
        await db
          .update(reviews)
          .set({
            status: "completed",
            summary: "No reviewable code changes found in this PR.",
            filesChanged: 0,
            completedAt: new Date(),
          })
          .where(eq(reviews.id, reviewId));
        return;
      }

      // 3. Get AI review
      logger.info("🤖 Sending diff to GPT-4", { prNumber, filesChanged });
      const reviewResult = await reviewDiff(formattedDiff, prTitle, diffChunks);

      // 4. Post comments to GitHub
      await postPullRequestReview(
        installationId,
        owner,
        repo,
        prNumber,
        commitSha,
        reviewResult.summary,
        reviewResult.comments
      );

      // 5. Save comments to DB
      if (reviewResult.comments.length > 0) {
        await db.insert(comments).values(
          reviewResult.comments.map((c: ReviewComment) => ({
            reviewId,
            filePath: c.file,
            lineNumber: c.line,
            diffPosition: c.diffPosition,
            severity: c.severity,
            body: c.comment,
          }))
        );
      }

      // 6. Mark review as completed
      await db
        .update(reviews)
        .set({
          status: "completed",
          summary: reviewResult.summary,
          filesChanged,
          completedAt: new Date(),
        })
        .where(eq(reviews.id, reviewId));

      logger.info("✅ Review complete", {
        reviewId,
        prNumber,
        commentCount: reviewResult.comments.length,
      });
    } catch (err) {
      logger.error("❌ Review processing failed", { reviewId, error: err });

      await db
        .update(reviews)
        .set({
          status: "failed",
          errorMessage: (err as Error).message,
          completedAt: new Date(),
        })
        .where(eq(reviews.id, reviewId));

      throw err; // Re-throw so BullMQ can retry
    }
  }

  /**
   * Ensures a repository record exists, creates it if not.
   */
  async upsertRepository(
    githubId: number,
    fullName: string,
    installationId: number
  ): Promise<number> {
    const existing = await db
      .select({ id: repositories.id })
      .from(repositories)
      .where(eq(repositories.githubId, githubId))
      .limit(1);

    if (existing.length > 0) return existing[0].id;

    const [inserted] = await db
      .insert(repositories)
      .values({ githubId, fullName, installationId })
      .returning({ id: repositories.id });

    return inserted.id;
  }

  /**
   * Creates a new review record in pending state.
   * Returns null if this commit was already reviewed (deduplication).
   */
  async createReview(params: {
    repoId: number;
    prNumber: number;
    prTitle: string;
    prAuthor: string;
    prUrl: string;
    commitSha: string;
  }): Promise<number | null> {
    try {
      const [review] = await db
        .insert(reviews)
        .values({ ...params, status: "pending" })
        .returning({ id: reviews.id });
      return review.id;
    } catch (err: any) {
      // Unique constraint violation = already reviewed this commit
      if (err.code === "23505") {
        logger.info("Skipping duplicate review", {
          prNumber: params.prNumber,
          commitSha: params.commitSha,
        });
        return null;
      }
      throw err;
    }
  }
}

export const reviewService = new ReviewService();
