import "server-only";

/**
 * Email, through Resend.
 *
 * Every function here returns rather than throws. A booking that succeeded at the gateway must not
 * be reported as a failure because an email provider was slow, and an enquiry that reached Sanity
 * is not lost because a mailbox bounced. Callers log the result and carry on.
 *
 * Plain text, not HTML. These are transactional messages to one person; an HTML template would be
 * more to maintain, more to render wrongly in an Indian mail client, and more likely to be filed
 * as marketing.
 */
import { Resend } from "resend";

export interface SendResult {
  sent: boolean;
  /** "no-key" and "no-recipient" are configuration, not failure. */
  reason?: "no-key" | "no-recipient" | "provider-error";
  error?: string;
}

function trimmed(value: string | undefined): string | undefined {
  const out = value?.trim();
  return out ? out : undefined;
}

/**
 * The From: address. Resend's shared sandbox sender until the academy's domain is verified, which
 * is a launch-checklist step: mail from `onboarding@resend.dev` reaches an inbox, but it does not
 * say Espresso Academy in the sender line.
 */
export function fromAddress(): string {
  return trimmed(process.env.RESEND_FROM_EMAIL) ?? "Espresso Academy India <onboarding@resend.dev>";
}

export function canSendEmail(): boolean {
  return Boolean(trimmed(process.env.RESEND_API_KEY));
}

/** Where a lead goes. */
export function leadRecipient(): string | undefined {
  return trimmed(process.env.LEAD_TO_EMAIL);
}

/** Where a booking notification goes. Falls back to the lead address. */
export function bookingRecipient(): string | undefined {
  return trimmed(process.env.BOOKING_TO_EMAIL) ?? leadRecipient();
}

/** Where a cafe or team enquiry goes. Falls back to the lead address. */
export function cafeRecipient(): string | undefined {
  return trimmed(process.env.CAFE_TO_EMAIL) ?? leadRecipient();
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  text: string;
  /** So a reply from the academy goes to the student rather than to the sending domain. */
  replyTo?: string;
}

export async function sendEmail({ to, subject, text, replyTo }: SendEmailInput): Promise<SendResult> {
  const apiKey = trimmed(process.env.RESEND_API_KEY);
  if (!apiKey) return { sent: false, reason: "no-key" };

  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (recipients.length === 0) return { sent: false, reason: "no-recipient" };

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: fromAddress(),
      to: recipients,
      subject,
      text,
      ...(replyTo ? { replyTo } : {}),
    });
    if (error) return { sent: false, reason: "provider-error", error: error.message };
    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      reason: "provider-error",
      error: error instanceof Error ? error.message : "unknown",
    };
  }
}

/**
 * Runs a side effect up to `attempts` times with a widening delay.
 *
 * Used for the fan-out in the lead pipeline and the booking emails. Deliberately short: three
 * tries over about a second and a half. A route handler holding a request open for a minute of
 * retries is a worse failure than a missed email, which the structured log still records.
 */
export async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  attempts = 3,
): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  let lastError = "unknown";
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return { ok: true, value: await fn() };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** attempt));
      }
    }
  }
  console.warn(JSON.stringify({ at: "retry", label, event: "exhausted", error: lastError }));
  return { ok: false, error: lastError };
}
