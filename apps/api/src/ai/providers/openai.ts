import OpenAI from "openai";
import { logger } from "../../config/logger.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "../prompts.js";
import {
  type AIProvider,
  type AIProviderConfig,
  type ReviewResult,
  ReviewResultSchema,
} from "./types.js";

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  private client: OpenAI;
  private model: string;

  constructor(config: AIProviderConfig) {
    this.client = new OpenAI({
      baseURL: config.baseURL,
      apiKey: config.apiKey,
    });
    this.model = config.model;
  }

  isAvailable(): boolean {
    return true;
  }

  async review(diffContent: string, prTitle: string): Promise<ReviewResult> {
    const userPrompt = buildUserPrompt(diffContent, prTitle);

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    });

    const rawContent = response.choices[0]?.message?.content;
    if (!rawContent) throw new Error("Empty response from OpenAI");

    const parsed = JSON.parse(rawContent);
    const validated = ReviewResultSchema.parse(parsed);

    logger.info("✅ OpenAI review completed", {
      model: this.model,
      commentCount: validated.comments.length,
    });

    return { ...validated, comments: validated.comments };
  }
}