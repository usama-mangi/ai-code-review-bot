import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { OpenAIProvider } from "./openai.js";
import { AnthropicProvider } from "./anthropic.js";
import { GoogleProvider } from "./google.js";
import { FallbackProvider } from "./fallback.js";
import type { AIProvider } from "./types.js";

let cachedProvider: AIProvider | null = null;

/**
 * Creates the AI provider chain based on environment configuration.
 * Providers are tried in order: primary → fallback1 → fallback2.
 */
export function createProvider(): AIProvider {
  if (cachedProvider) return cachedProvider;

  const providers: AIProvider[] = [];

  // Primary provider
  if (env.AI_PROVIDER === "openai" || env.AI_PROVIDER === "openai-compatible") {
    providers.push(
      new OpenAIProvider({
        name: "openai",
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL,
        baseURL: env.OPENAI_BASE_URL,
      })
    );
  } else if (env.AI_PROVIDER === "anthropic") {
    providers.push(
      new AnthropicProvider({
        name: "anthropic",
        apiKey: env.ANTHROPIC_API_KEY ?? env.OPENAI_API_KEY,
        model: env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20241022",
        baseURL: env.ANTHROPIC_BASE_URL,
      })
    );
  } else if (env.AI_PROVIDER === "google") {
    providers.push(
      new GoogleProvider({
        name: "google",
        apiKey: env.GOOGLE_API_KEY ?? env.OPENAI_API_KEY,
        model: env.GOOGLE_MODEL ?? "gemini-2.0-flash",
        baseURL: env.GOOGLE_BASE_URL,
      })
    );
  } else {
    // Default: OpenAI-compatible
    providers.push(
      new OpenAIProvider({
        name: "openai",
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL,
        baseURL: env.OPENAI_BASE_URL,
      })
    );
  }

  // Fallback providers
  if (env.AI_FALLBACK_1) {
    const fb = env.AI_FALLBACK_1;
    if (fb === "anthropic" && env.ANTHROPIC_API_KEY) {
      providers.push(
        new AnthropicProvider({
          name: "anthropic",
          apiKey: env.ANTHROPIC_API_KEY,
          model: env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20241022",
          baseURL: env.ANTHROPIC_BASE_URL,
        })
      );
    } else if (fb === "google" && env.GOOGLE_API_KEY) {
      providers.push(
        new GoogleProvider({
          name: "google",
          apiKey: env.GOOGLE_API_KEY,
          model: env.GOOGLE_MODEL ?? "gemini-2.0-flash",
          baseURL: env.GOOGLE_BASE_URL,
        })
      );
    } else if (fb === "openai" && env.OPENAI_API_KEY) {
      providers.push(
        new OpenAIProvider({
          name: "openai",
          apiKey: env.OPENAI_API_KEY,
          model: env.OPENAI_MODEL,
          baseURL: env.OPENAI_BASE_URL,
        })
      );
    }
  }

  if (env.AI_FALLBACK_2) {
    const fb = env.AI_FALLBACK_2;
    if (fb === "anthropic" && env.ANTHROPIC_API_KEY) {
      providers.push(
        new AnthropicProvider({
          name: "anthropic",
          apiKey: env.ANTHROPIC_API_KEY,
          model: env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-20241022",
          baseURL: env.ANTHROPIC_BASE_URL,
        })
      );
    } else if (fb === "google" && env.GOOGLE_API_KEY) {
      providers.push(
        new GoogleProvider({
          name: "google",
          apiKey: env.GOOGLE_API_KEY,
          model: env.GOOGLE_MODEL ?? "gemini-2.0-flash",
          baseURL: env.GOOGLE_BASE_URL,
        })
      );
    } else if (fb === "openai" && env.OPENAI_API_KEY) {
      providers.push(
        new OpenAIProvider({
          name: "openai",
          apiKey: env.OPENAI_API_KEY,
          model: env.OPENAI_MODEL,
          baseURL: env.OPENAI_BASE_URL,
        })
      );
    }
  }

  if (providers.length === 0) {
    throw new Error("No AI providers configured. Set at least one AI provider.");
  }

  if (providers.length === 1) {
    cachedProvider = providers[0];
  } else {
    cachedProvider = new FallbackProvider(providers);
  }

  logger.info("🤖 AI provider chain initialized", {
    providers: providers.map((p) => p.name),
  });

  return cachedProvider;
}

export function getProvider(): AIProvider {
  if (!cachedProvider) {
    return createProvider();
  }
  return cachedProvider;
}