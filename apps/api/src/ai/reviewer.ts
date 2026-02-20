import OpenAI from "openai";
import { z } from "zod";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts.js";
import type { DiffChunk } from "../github/diff-parser.js";

const openai = new OpenAI({
  baseURL: env.OPENAI_BASE_URL,
  apiKey: env.OPENAI_API_KEY,
});

// ─── Output Schema ────────────────────────────────────────────────────────────

const ReviewCommentSchema = z.object({
  file: z.string(),
  line: z.number().int().positive(),
  severity: z.enum(["bug", "security", "improvement", "style", "info"]),
  comment: z.string().min(1),
});

const ReviewResultSchema = z.object({
  summary: z.string().min(1),
  comments: z.array(ReviewCommentSchema).max(15),
});

export type ReviewComment = z.infer<typeof ReviewCommentSchema> & {
  diffPosition?: number;
};
export type ReviewResult = z.infer<typeof ReviewResultSchema> & {
  comments: ReviewComment[];
};

// ─── Main Reviewer ────────────────────────────────────────────────────────────

/**
 * Sends the diff to GPT-4o and returns structured review feedback.
 * Retries up to 3 times on failure with exponential backoff.
 */
export async function reviewDiff(
  diffContent: string,
  prTitle: string,
  diffChunks: DiffChunk[]
): Promise<ReviewResult> {
  const userPrompt = buildUserPrompt(diffContent, prTitle);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      logger.debug(`GPT-4 review attempt ${attempt}`);

      const response = await openai.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2, // Low temperature for consistent, deterministic output
        max_tokens: 4096,
        response_format: { type: "json_object" },
      });

      const rawContent = response.choices[0]?.message?.content;
      if (!rawContent) throw new Error("Empty response from OpenAI");

      const parsed = JSON.parse(rawContent);
      const validated = ReviewResultSchema.parse(parsed);

      // Enrich comments with diff positions for GitHub inline comments
      const enrichedComments = enrichWithDiffPositions(
        validated.comments,
        diffChunks
      );

      logger.info("✅ GPT-4 review completed", {
        commentCount: enrichedComments.length,
        model: env.OPENAI_MODEL,
      });

      return { ...validated, comments: enrichedComments };
    } catch (err) {
      lastError = err as Error;
      logger.warn(`GPT-4 attempt ${attempt} failed`, { error: err });

      if (attempt < 3) {
        // Exponential backoff: 1s, 2s
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  throw new Error(`GPT-4 review failed after 3 attempts: ${lastError?.message}`);
}

/**
 * Maps GPT-4 line numbers back to GitHub diff positions.
 * GitHub's inline comment API uses diff positions, not file line numbers.
 */
function enrichWithDiffPositions(
  comments: z.infer<typeof ReviewCommentSchema>[],
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

  return comments.map((comment) => {
    const fileMap = positionMap.get(comment.file);
    const diffPosition = fileMap?.get(comment.line);
    return { ...comment, diffPosition };
  });
}
