import { createHmac, timingSafeEqual } from "crypto";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

/**
 * Verifies the GitHub webhook signature (x-hub-signature-256 header).
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string | undefined
): boolean {
  if (!signature) {
    logger.warn("Webhook received without signature");
    return false;
  }

  const expectedSig = `sha256=${createHmac("sha256", env.GITHUB_WEBHOOK_SECRET)
    .update(payload)
    .digest("hex")}`;

  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSig)
    );
  } catch {
    return false;
  }
}

export interface PullRequestEvent {
  action: "opened" | "synchronize" | "reopened" | "closed";
  number: number;
  pull_request: {
    number: number;
    title: string;
    html_url: string;
    user: { login: string };
    head: { sha: string };
    base: { repo: { id: number; full_name: string } };
  };
  installation: { id: number };
  repository: {
    id: number;
    full_name: string;
  };
}
