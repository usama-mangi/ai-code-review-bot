import { logger } from "../../config/logger.js";
import { type AIProvider, type ReviewResult } from "./types.js";

/**
 * Provider that tries multiple AI providers in sequence.
 * Falls back to the next provider if the current one fails.
 */
export class FallbackProvider implements AIProvider {
  readonly name = "fallback";
  private providers: AIProvider[];

  constructor(providers: AIProvider[]) {
    this.providers = providers.filter((p) => p.isAvailable());
    if (this.providers.length === 0) {
      throw new Error("No AI providers available");
    }
  }

  isAvailable(): boolean {
    return this.providers.some((p) => p.isAvailable());
  }

  async review(diffContent: string, prTitle: string): Promise<ReviewResult> {
    let lastError: Error | null = null;

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      try {
        logger.info(`🤖 Attempting review with ${provider.name}`, {
          attempt: i + 1,
          provider: provider.name,
        });
        const result = await provider.review(diffContent, prTitle);
        logger.info(`✅ Review succeeded with ${provider.name}`);
        return result;
      } catch (err) {
        lastError = err as Error;
        logger.warn(`❌ ${provider.name} failed, trying next provider`, {
          error: (err as Error).message,
          provider: provider.name,
        });
      }
    }

    throw new Error(
      `All AI providers failed. Last error: ${lastError?.message}`
    );
  }
}