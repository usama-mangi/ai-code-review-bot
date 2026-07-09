import { z } from "zod";

// ─── Core Review Types ───────────────────────────────────────────────────────

export const ReviewCommentSchema = z.object({
  file: z.string(),
  line: z.number().int().positive(),
  severity: z.enum(["bug", "security", "improvement", "style", "info"]),
  comment: z.string().min(1),
});

export type ReviewComment = z.infer<typeof ReviewCommentSchema> & {
  diffPosition?: number;
};

export const ReviewResultSchema = z.object({
  summary: z.string().min(1),
  comments: z.array(ReviewCommentSchema).max(15),
});

export type ReviewResult = z.infer<typeof ReviewResultSchema> & {
  comments: ReviewComment[];
};

// ─── Provider Interface ──────────────────────────────────────────────────────

export interface AIProviderConfig {
  name: string;
  apiKey: string;
  model: string;
  baseURL?: string;
}

export interface AIProvider {
  readonly name: string;
  review(diffContent: string, prTitle: string): Promise<ReviewResult>;
  isAvailable(): boolean;
}