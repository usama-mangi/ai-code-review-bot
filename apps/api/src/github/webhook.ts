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
  action: "opened" | "synchronize" | "reopened" | "closed" | "ready_for_review" | "converted_to_draft";
  number: number;
  pull_request: {
    number: number;
    title: string;
    html_url: string;
    draft?: boolean;
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

export interface IssueCommentEvent {
  action: "created" | "edited" | "deleted";
  issue: {
    number: number;
    pull_request?: Record<string, unknown>;
    html_url: string;
  };
  comment: {
    id: number;
    body: string;
    user: { login: string };
    created_at: string;
    html_url: string;
    in_reply_to_id?: number;
  };
  repository: {
    id: number;
    full_name: string;
  };
  installation: { id: number };
}

export interface PullRequestReviewCommentEvent {
  action: "created" | "edited" | "deleted";
  comment: {
    id: number;
    body: string;
    path: string;
    line?: number;
    diff_hunk: string;
    user: { login: string };
    pull_request_review_id: number;
    in_reply_to_id?: number;
    created_at: string;
    html_url: string;
  };
  pull_request: {
    number: number;
    title: string;
    html_url: string;
    head: { sha: string };
    base: { repo: { id: number; full_name: string } };
  };
  repository: {
    id: number;
    full_name: string;
  };
  installation: { id: number };
}
