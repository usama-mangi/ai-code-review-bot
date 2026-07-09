import { logger } from "../../config/logger.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "../prompts.js";
import {
  type AIProvider,
  type AIProviderConfig,
  type ReviewResult,
  ReviewResultSchema,
} from "./types.js";

export class GoogleProvider implements AIProvider {
  readonly name = "google";
  private apiKey: string;
  private model: string;
  private baseURL: string;

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.baseURL = config.baseURL ?? "https://generativelanguage.googleapis.com";
  }

  isAvailable(): boolean {
    return true;
  }

  async review(diffContent: string, prTitle: string): Promise<ReviewResult> {
    const userPrompt = buildUserPrompt(diffContent, prTitle);
    const fullPrompt = `${SYSTEM_PROMPT}\n\n${userPrompt}`;

    const response = await fetch(
      `${this.baseURL}/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Google API error ${response.status}: ${errorBody}`);
    }

    const data = (await response.json()) as any;
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) throw new Error("Empty response from Google");

    // Extract JSON from response
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in Google response");

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = ReviewResultSchema.parse(parsed);

    logger.info("✅ Google review completed", {
      model: this.model,
      commentCount: validated.comments.length,
    });

    return { ...validated, comments: validated.comments };
  }
}