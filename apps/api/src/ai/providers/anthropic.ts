import { logger } from "../../config/logger.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "../prompts.js";
import {
  type AIProvider,
  type AIProviderConfig,
  type ReviewResult,
  ReviewResultSchema,
} from "./types.js";

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  private apiKey: string;
  private model: string;
  private baseURL: string;

  constructor(config: AIProviderConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.baseURL = config.baseURL ?? "https://api.anthropic.com";
  }

  isAvailable(): boolean {
    return true;
  }

  async review(diffContent: string, prTitle: string): Promise<ReviewResult> {
    const userPrompt = buildUserPrompt(diffContent, prTitle);

    const response = await fetch(`${this.baseURL}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${errorBody}`);
    }

    const data = (await response.json()) as any;
    const rawContent = data.content?.[0]?.text;
    if (!rawContent) throw new Error("Empty response from Anthropic");

    // Extract JSON from response (Anthropic may wrap in markdown)
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in Anthropic response");

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = ReviewResultSchema.parse(parsed);

    logger.info("✅ Anthropic review completed", {
      model: this.model,
      commentCount: validated.comments.length,
    });

    return { ...validated, comments: validated.comments };
  }
}