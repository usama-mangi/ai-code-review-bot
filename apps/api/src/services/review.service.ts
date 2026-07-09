import { db } from "../db/index.js";
import { reviews, comments, repositories, repoConfigs } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { parseDiff, formatDiffForAI, type DiffChunk } from "../github/diff-parser.js";
import { fetchPullRequestDiff, postPullRequestReview } from "../github/commenter.js";
import { reviewDiff, type ReviewComment } from "../ai/reviewer.js";
import { scanForSecurityIssues, formatSecurityFindings } from "../ai/security-scanner.js";
import { notificationService } from "./notification.service.js";
import { logger } from "../config/logger.js";
import type { ReviewJobData } from "../queue/producer.js";

// Maximum number of files to process in parallel
const PARALLEL_FILE_BATCH_SIZE = 5;

class ReviewService {
  /**
   * Main orchestration: fetch diff → security scan → AI review → summarize → post comments → save to DB.
   * Supports parallel multi-file review and draft PR incremental feedback.
   */
  async processReview(data: ReviewJobData): Promise<void> {
    const { reviewId, installationId, owner, repo, prNumber, prTitle, commitSha, isDraft } = data;

    // Mark as processing
    await db
      .update(reviews)
      .set({ status: "processing" })
      .where(eq(reviews.id, reviewId));

    try {
      // 1. Fetch the PR diff from GitHub
      logger.info("📄 Fetching PR diff", { prNumber, repo: `${owner}/${repo}`, isDraft });
      const rawDiff = await fetchPullRequestDiff(installationId, owner, repo, prNumber);

      // 2. Parse the diff
      const diffChunks = parseDiff(rawDiff);
      const filesChanged = diffChunks.filter((c) => c.fileStatus !== "deleted").length;

      if (filesChanged === 0) {
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

      // 3. Run static security scan on the raw diff
      const securityFindings = scanForSecurityIssues(rawDiff, "all", 0);
      if (securityFindings.length > 0) {
        logger.info("🔒 Security scan found potential issues", {
          prNumber,
          findingCount: securityFindings.length,
        });
      }

      // 4. Get AI review — process files in parallel batches for speed
      const draftPrefix = isDraft ? "[DRAFT] " : "";
      logger.info(`🤖 Starting AI review`, { prNumber, filesChanged, isDraft });
      const reviewResult = await this.reviewInParallel(
        diffChunks,
        `${draftPrefix}${prTitle}`,
        filesChanged,
        securityFindings
      );

      // 5. Build a concise summary from the findings (no extra AI call)
      const conciseSummary = buildConciseSummary(reviewResult.summary, reviewResult.comments);

      // 6. Post comments to GitHub
      await postPullRequestReview(
        installationId,
        owner,
        repo,
        prNumber,
        commitSha,
        conciseSummary,
        reviewResult.comments
      );

      // 7. Save comments to DB
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

      // 8. Mark review as completed
      await db
        .update(reviews)
        .set({
          status: "completed",
          summary: conciseSummary,
          filesChanged,
          completedAt: new Date(),
        })
        .where(eq(reviews.id, reviewId));

      logger.info("✅ Review complete", {
        reviewId,
        prNumber,
        commentCount: reviewResult.comments.length,
        isDraft,
      });

      // 9. Send notifications if configured for this repo
      await this.sendNotificationsIfConfigured(data, conciseSummary, reviewResult.comments);
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
   * Reviews files in parallel batches for faster feedback.
   * Splits diff chunks into batches, reviews each batch concurrently,
   * then aggregates the results. Security findings are prepended to the first batch.
   */
  private async reviewInParallel(
    diffChunks: DiffChunk[],
    prTitle: string,
    filesChanged: number,
    securityFindings: Array<{ pattern: string; severity: string; file: string; line: number; description: string }> = []
  ): Promise<{ summary: string; comments: ReviewComment[] }> {
    const reviewableChunks = diffChunks.filter(
      (c) => c.fileStatus !== "deleted"
    );

    const securityContext = formatSecurityFindings(securityFindings as any);

    // If only a few files, review them all together
    if (reviewableChunks.length <= PARALLEL_FILE_BATCH_SIZE) {
      let formattedDiff = formatDiffForAI(reviewableChunks);
      if (securityContext) {
        formattedDiff = securityContext + "\n" + formattedDiff;
      }
      return reviewDiff(formattedDiff, prTitle, reviewableChunks);
    }

    // Split into batches and review in parallel
    const batches: DiffChunk[][] = [];
    for (let i = 0; i < reviewableChunks.length; i += PARALLEL_FILE_BATCH_SIZE) {
      batches.push(reviewableChunks.slice(i, i + PARALLEL_FILE_BATCH_SIZE));
    }

    logger.info("⚡ Reviewing files in parallel batches", {
      totalFiles: reviewableChunks.length,
      batchCount: batches.length,
      batchSize: PARALLEL_FILE_BATCH_SIZE,
    });

    const batchResults = await Promise.all(
      batches.map(async (batch, index) => {
        let formattedDiff = formatDiffForAI(batch);
        // Only prepend security context to the first batch
        if (index === 0 && securityContext) {
          formattedDiff = securityContext + "\n" + formattedDiff;
        }
        const batchTitle = `${prTitle} (batch ${index + 1}/${batches.length})`;
        return reviewDiff(formattedDiff, batchTitle, batch);
      })
    );

    // Aggregate results
    const allComments: ReviewComment[] = [];
    const summaries: string[] = [];

    for (const result of batchResults) {
      summaries.push(result.summary);
      allComments.push(...result.comments);
    }

    // Limit to 15 comments max as per the schema
    const limitedComments = allComments.slice(0, 15);

    const combinedSummary = summaries.length === 1
      ? summaries[0]
      : `Review of ${filesChanged} files across ${batches.length} batches.\n\n${summaries.map((s, i) => `**Batch ${i + 1}:** ${s}`).join("\n\n")}`;

    return { summary: combinedSummary, comments: limitedComments };
  }

  /**
   * Sends Slack/Email notifications if configured for the repository.
   */
  private async sendNotificationsIfConfigured(
    data: ReviewJobData,
    summary: string,
    reviewComments: ReviewComment[]
  ): Promise<void> {
    try {
      const [config] = await db
        .select()
        .from(repoConfigs)
        .where(eq(repoConfigs.repoId, data.repoId))
        .limit(1);

      if (!config || !config.notifyOnCompletion) return;

      const severityBreakdown: Record<string, number> = {};
      for (const c of reviewComments) {
        severityBreakdown[c.severity] = (severityBreakdown[c.severity] ?? 0) + 1;
      }

      await notificationService.notifyReviewComplete(
        config.notifySlackWebhook,
        config.notifyEmails,
        {
          reviewId: data.reviewId,
          repoFullName: `${data.owner}/${data.repo}`,
          prNumber: data.prNumber,
          prTitle: data.prTitle,
          prUrl: `https://github.com/${data.owner}/${data.repo}/pull/${data.prNumber}`,
          summary,
          commentCount: reviewComments.length,
          severityBreakdown,
          isDraft: data.isDraft,
        }
      );
    } catch (err) {
      logger.warn("Failed to send notifications", { error: err });
    }
  }

  /**
   * Ensures a repository record exists, creates it if not.
   */
  async upsertRepository(
    githubId: number,
    fullName: string,
    installationId: number
  ): Promise<{ id: number; enabled: boolean }> {
    const existing = await db
      .select({ id: repositories.id, enabled: repositories.enabled })
      .from(repositories)
      .where(eq(repositories.githubId, githubId))
      .limit(1);

    if (existing.length > 0) return existing[0];

    const [inserted] = await db
      .insert(repositories)
      .values({ githubId, fullName, installationId, enabled: true })
      .returning({ id: repositories.id, enabled: repositories.enabled });

    return inserted;
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

/**
 * Builds a concise, human-readable summary from the review results.
 * Programmatic — no extra AI token cost.
 */
function buildConciseSummary(
  originalSummary: string,
  reviewComments: ReviewComment[]
): string {
  if (reviewComments.length === 0) return originalSummary;

  const severityOrder = ["bug", "security", "improvement", "style", "info"];
  const counts: Record<string, number> = {};
  for (const c of reviewComments) {
    counts[c.severity] = (counts[c.severity] ?? 0) + 1;
  }

  const breakdown = severityOrder
    .filter((s) => counts[s])
    .map((s) => `${counts[s]} ${s}`)
    .join(", ");

  return `${originalSummary}\n\nFindings: ${breakdown}.`;
}

export const reviewService = new ReviewService();