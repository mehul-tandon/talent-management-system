import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendEmail(payload: EmailPayload) {
  if (!env.RESEND_API_KEY) {
    logger.info("Email delivery skipped because RESEND_API_KEY is not configured", {
      to: payload.to,
      subject: payload.subject
    });
    return { delivered: false, provider: "noop" as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text
    })
  });

  if (!response.ok) {
    const failure = await response.text();
    throw new Error(`Email delivery failed: ${failure}`);
  }

  return { delivered: true, provider: "resend" as const };
}
