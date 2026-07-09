import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  // GitHub App
  GITHUB_APP_ID: z.string().min(1, "GITHUB_APP_ID is required"),
  GITHUB_APP_PRIVATE_KEY: z.string().min(1, "GITHUB_APP_PRIVATE_KEY is required"),
  GITHUB_WEBHOOK_SECRET: z.string().min(1, "GITHUB_WEBHOOK_SECRET is required"),
  GITHUB_CLIENT_ID: z.string().min(1, "GITHUB_CLIENT_ID is required"),
  GITHUB_CLIENT_SECRET: z.string().min(1, "GITHUB_CLIENT_SECRET is required"),

  // AI Provider Configuration
  // Primary provider: "openai" | "anthropic" | "google" | "openai-compatible"
  AI_PROVIDER: z.string().default("openai"),

  // OpenAI-compatible (works with OpenRouter, Groq, Gemini, etc.)
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  OPENAI_BASE_URL: z.string().optional(), // e.g. https://api.groq.com/openai/v1
  OPENAI_MODEL: z.string().default("gpt-4o"),

  // Anthropic (Claude)
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_BASE_URL: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-3-5-sonnet-20241022"),

  // Google (Gemini)
  GOOGLE_API_KEY: z.string().optional(),
  GOOGLE_BASE_URL: z.string().optional(),
  GOOGLE_MODEL: z.string().default("gemini-2.0-flash"),

  // Fallback providers (tried in order if primary fails)
  AI_FALLBACK_1: z.string().optional(), // "anthropic" | "google" | "openai"
  AI_FALLBACK_2: z.string().optional(),

  // Database
  DATABASE_URL: z.string().startsWith("postgres"),

  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // App
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
