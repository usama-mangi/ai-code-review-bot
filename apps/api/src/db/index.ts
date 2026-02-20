import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../config/env.js";
import * as schema from "./schema.js";
import { logger } from "../config/logger.js";

const client = postgres(env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  onnotice: () => {},
});

export const db = drizzle(client, { schema });

export async function checkDbConnection(): Promise<void> {
  try {
    await client`SELECT 1`;
    logger.info("✅ Database connected");
  } catch (err) {
    logger.error("❌ Database connection failed", { error: err });
    throw err;
  }
}
