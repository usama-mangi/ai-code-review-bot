import { z } from "zod";
import { logger } from "../config/logger.js";
import { getProvider } from "./providers/index.js";
import {
  ReviewCommentSchema,
  ReviewResultSchema,
  type ReviewComment,
  type ReviewResult,
} from "./providers/types.js";
import type { DiffChunk } from "../github/diff-parser.js";

// Re-export types for backward compatibility
export { ReviewCommentSchema, ReviewResultSchema };
export type { ReviewComment, ReviewResult };

// ─── Main Reviewer ────────────────────────────────────────────────────────────

/**
 * Sends the diff to the configured AI provider and returns structured review feedback.
 * Retries up to 3 times on failure with exponential backoff.
 */
export async function reviewDiff(
  diffContent: string,
  prTitle: string,
  diffChunks: DiffChunk[]
): Promise<ReviewResult> {
  const provider = getProvider();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      logger.debug(`AI review attempt ${attempt}`, { provider: provider.name });

      const result = await provider.review(diffContent, prTitle);

      // Enrich comments with diff positions for GitHub inline comments
      const enrichedComments = enrichWithDiffPositions(
        result.comments,
        diffChunks
      );

      logger.info("✅ AI review completed", {
        commentCount: enrichedComments.length,
        provider: provider.name,
      });

      return { ...result, comments: enrichedComments };
    } catch (err) {
      lastError = err as Error;
      logger.warn(`AI review attempt ${attempt} failed`, { error: err });

      if (attempt < 3) {
        // Exponential backoff: 1s, 2s
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  throw new Error(`AI review failed after 3 attempts: ${lastError?.message}`);
}

// ─── Diff Position Enrichment ─────────────────────────────────────────────────

/**
 * Maps AI line numbers back to GitHub diff positions.
 * GitHub's inline comment API uses diff positions, not file line numbers.
 */
function enrichWithDiffPositions(
  reviewComments: ReviewComment[],
  diffChunks: DiffChunk[]
): ReviewComment[] {
  // Build a map: filePath -> lineNumber -> diffPosition
  const positionMap = new Map<string, Map<number, number>>();

  for (const chunk of diffChunks) {
    const lineMap = new Map<number, number>();
    for (const hunk of chunk.hunks) {
      for (const line of hunk.lines) {
        if (line.lineNumber !== null && line.type === "added") {
          lineMap.set(line.lineNumber, line.diffPosition);
        }
      }
    }
    positionMap.set(chunk.filePath, lineMap);
  }

  return reviewComments.map((comment) => {
    const fileMap = positionMap.get(comment.file);
    const diffPosition = fileMap?.get(comment.line);
    return { ...comment, diffPosition };
  });
}