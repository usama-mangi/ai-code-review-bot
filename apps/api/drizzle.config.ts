import type { Config } from "drizzle-kit";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env from apps/api/ first, then fall back to project root
config({ path: resolve(__dirname, ".env") });
config({ path: resolve(__dirname, "../../.env") });

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
