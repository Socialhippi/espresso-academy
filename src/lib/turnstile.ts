import "server-only";

/**
 * Cloudflare Turnstile verification.
 *
 * Degrades on purpose. Without `TURNSTILE_SECRET_KEY` the widget is not rendered either, so there
 * is no token to check and `verifyTurnstile` returns `skipped`. A bot check that takes the site
 * down when a key rotates badly is worse than one that is briefly absent, and the honeypot and the
 * two-second time floor are still in force underneath.
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileOutcome = "passed" | "failed" | "skipped";

export interface TurnstileResult {
  outcome: TurnstileOutcome;
  /** Cloudflare's own error codes, for the log. Never shown to a reader. */
  errorCodes?: string[];
}

export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
}

export async function verifyTurnstile(
  token: string | undefined | null,
  remoteIp?: string,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) return { outcome: "skipped" };
  if (!token) return { outcome: "failed", errorCodes: ["missing-input-response"] };

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);

  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      // Cloudflare is fast; a hung request here would hold a checkout open.
      signal: AbortSignal.timeout(5000),
    });
    const result: { success?: boolean; "error-codes"?: string[] } = await response.json();
    return result.success
      ? { outcome: "passed" }
      : { outcome: "failed", errorCodes: result["error-codes"] ?? [] };
  } catch (error) {
    /*
     * Cloudflare being unreachable is not the reader's fault, and failing closed here would mean
     * a Cloudflare incident stops the academy taking bookings. Log it and let the request through
     * to the honeypot and timing checks, which do not depend on anyone else's uptime.
     */
    console.warn(
      JSON.stringify({ at: "turnstile", event: "unreachable", error: String(error) }),
    );
    return { outcome: "skipped", errorCodes: ["verification-unreachable"] };
  }
}
