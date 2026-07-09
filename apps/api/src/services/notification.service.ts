import { logger } from "../config/logger.js";
import type { ReviewComment } from "../ai/reviewer.js";

interface NotificationPayload {
  reviewId: number;
  repoFullName: string;
  prNumber: number;
  prTitle: string;
  prUrl: string;
  summary: string;
  commentCount: number;
  severityBreakdown: Record<string, number>;
  isDraft?: boolean;
}

/**
 * Sends a Slack notification via webhook.
 */
async function sendSlackNotification(
  webhookUrl: string,
  payload: NotificationPayload
): Promise<void> {
  const { prTitle, prUrl, repoFullName, summary, commentCount, severityBreakdown, isDraft } = payload;

  const breakdown = Object.entries(severityBreakdown)
    .map(([sev, count]) => `• ${sev}: ${count}`)
    .join("\n");

  const message = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `🤖 AI Code Review${isDraft ? " [DRAFT]" : ""}: ${prTitle}`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Repository:* ${repoFullName}\n*PR:* <${prUrl}|#${payload.prNumber}>`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Summary:* ${summary}`,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Comments:* ${commentCount}` },
          { type: "mrkdwn", text: `*Breakdown:*\n${breakdown}` },
        ],
      },
    ],
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
  }
}

/**
 * Sends an email notification via SMTP or SendGrid-compatible API.
 * Uses a simple fetch-based approach for SendGrid API.
 */
async function sendEmailNotification(
  toEmails: string[],
  payload: NotificationPayload
): Promise<void> {
  // Use SendGrid-compatible API if configured, otherwise log
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.NOTIFICATION_FROM_EMAIL ?? "noreply@codereview.bot";

  if (!sendgridApiKey) {
    logger.info("📧 Email notification skipped (no SENDGRID_API_KEY configured)", {
      to: toEmails,
    });
    return;
  }

  const { prTitle, prUrl, repoFullName, summary, commentCount, severityBreakdown, isDraft } = payload;

  const breakdown = Object.entries(severityBreakdown)
    .map(([sev, count]) => `  - ${sev}: ${count}`)
    .join("\n");

  const htmlContent = `
    <h2>🤖 AI Code Review${isDraft ? " [DRAFT]" : ""}</h2>
    <p><strong>Repository:</strong> ${repoFullName}</p>
    <p><strong>PR:</strong> <a href="${prUrl}">#${payload.prNumber} - ${prTitle}</a></p>
    <h3>Summary</h3>
    <p>${summary}</p>
    <h3>Findings</h3>
    <p>Comments: ${commentCount}</p>
    <pre>${breakdown}</pre>
    <p><a href="${prUrl}">View on GitHub →</a></p>
  `;

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sendgridApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: toEmails.map((email) => ({ email })) }],
      from: { email: fromEmail },
      subject: `[AI Code Review] ${isDraft ? "[DRAFT] " : ""}${prTitle}`,
      content: [{ type: "text/html", value: htmlContent }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Email send failed: ${response.status} ${errorBody}`);
  }
}

/**
 * Notification service for sending review results via Slack and Email.
 */
export class NotificationService {
  /**
   * Sends notifications for a completed review.
   * Checks repo config for notification preferences.
   */
  async notifyReviewComplete(
    slackWebhookUrl: string | null | undefined,
    notifyEmails: string | null | undefined,
    payload: NotificationPayload
  ): Promise<void> {
    const results = await Promise.allSettled([
      slackWebhookUrl
        ? sendSlackNotification(slackWebhookUrl, payload)
        : Promise.resolve(),
      notifyEmails
        ? sendEmailNotification(
            notifyEmails.split(",").map((e) => e.trim()).filter(Boolean),
            payload
          )
        : Promise.resolve(),
    ]);

    for (const result of results) {
      if (result.status === "rejected") {
        logger.error("Notification failed", { error: result.reason });
      }
    }
  }
}

export const notificationService = new NotificationService();