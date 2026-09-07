import "server-only";

/**
 * A dropped lead must never look like success.
 *
 * Every failure path on the enquiry routes answers 200 and hands the visitor to WhatsApp, which is
 * right for the visitor: the conversation can still happen, and a form that throws at somebody
 * mid-enquiry loses them outright. What was wrong is that it looked identical to a lead that
 * arrived — same response, same shape, nothing to reconcile against. The academy could lose a week
 * of leads and see nothing at all.
 *
 * So each failure now leaves three traces: an error-level structured log, an email to whoever reads
 * `LEAD_TO_EMAIL`, and a flag on the enquiry document when there is one to flag.
 *
 * **Nothing here carries the form's contents.** The name, the phone number, the email address and
 * the message are the reason to care about the failure and the reason not to copy it into a log or
 * an alert inbox. What travels is the shape of the lead — its type, its course, whether it had an
 * email — which is enough to tell a bot storm from a broken integration.
 */
import { canSendEmail, leadRecipient, sendEmail } from "@/lib/email";

export type LeadFailureStage = "turnstile" | "store" | "notify";

export interface LeadFailure {
  stage: LeadFailureStage;
  /** Machine reason, e.g. "no-write-access" or a provider's own code. */
  reason?: string;
  /** Provider message. Never the reader's input. */
  detail?: string;
  /** Redacted shape of the lead, from `leadFields`. */
  context: Record<string, unknown>;
}

/*
 * A bot storm must not become a mail storm.
 *
 * A failed challenge is the ordinary shape of a bot, and alerting on each one would fill the
 * academy's inbox and train them to ignore the alert that matters. Six an hour per running
 * instance is enough to notice a real outage on the first one and to stop well before anybody
 * starts deleting them unread. The log is never rate-limited.
 */
const MAX_ALERTS_PER_WINDOW = 6;
const WINDOW_MS = 60 * 60 * 1000;
let windowStartedAt = 0;
let alertsThisWindow = 0;

function mayAlert(now: number): { allowed: boolean; suppressed: number } {
  if (now - windowStartedAt > WINDOW_MS) {
    windowStartedAt = now;
    alertsThisWindow = 0;
  }
  alertsThisWindow += 1;
  return {
    allowed: alertsThisWindow <= MAX_ALERTS_PER_WINDOW,
    suppressed: Math.max(0, alertsThisWindow - MAX_ALERTS_PER_WINDOW),
  };
}

const STAGE_SUBJECT: Record<LeadFailureStage, string> = {
  turnstile: "A visitor could not be verified and was handed to WhatsApp",
  store: "A LEAD WAS NOT STORED — check Sanity",
  notify: "A stored lead was not emailed",
};

const STAGE_BODY: Record<LeadFailureStage, string> = {
  turnstile:
    "Their challenge failed, so nothing was stored. Usually this is a bot. If several of these arrive together from real-looking traffic, check that both Turnstile keys are set.",
  store:
    "The enquiry did not reach Sanity, so it is in no list anywhere. The visitor was handed to WhatsApp, so they may still message. Check SANITY_API_WRITE_TOKEN and Sanity's status.",
  notify:
    "The enquiry is in Sanity and safe. The email about it did not send, so nobody was told. Check RESEND_FROM_EMAIL and the Resend dashboard.",
};

/**
 * Logs the failure, and emails it unless this instance has already sent its hourly quota.
 *
 * Never throws and never awaits anything the response depends on: this runs after the reader has
 * been answered.
 */
export async function alertLeadFailure(failure: LeadFailure, now = Date.now()): Promise<void> {
  const { allowed, suppressed } = mayAlert(now);

  console.error(
    JSON.stringify({
      at: "api/enquiry",
      event: "lead-delivery-failed",
      stage: failure.stage,
      reason: failure.reason ?? null,
      detail: failure.detail ?? null,
      alerted: allowed,
      suppressedThisHour: suppressed,
      ...failure.context,
    }),
  );

  if (!allowed) return;

  const to = leadRecipient();
  if (!canSendEmail() || !to) return;

  await sendEmail({
    to,
    subject: `[Espresso Academy] ${STAGE_SUBJECT[failure.stage]}`,
    text: [
      STAGE_BODY[failure.stage],
      "",
      `Stage:   ${failure.stage}`,
      `Reason:  ${failure.reason ?? "not given"}`,
      `Detail:  ${failure.detail ?? "not given"}`,
      "",
      "What the enquiry was about, without the personal details:",
      JSON.stringify(failure.context, null, 2),
      "",
      "The visitor saw the WhatsApp handoff, so they were not told anything was wrong.",
    ].join("\n"),
  }).catch(() => {
    /* An alert that cannot send is not worth failing over; the log above is the durable record. */
  });
}

/** Test seam: the hourly cap is process state, and a test needs to start from a known one. */
export function resetLeadAlertWindow(): void {
  windowStartedAt = 0;
  alertsThisWindow = 0;
}
