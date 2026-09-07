import "server-only";
import { turnstileGate } from "@/lib/turnstile-gate";

/**
 * Cloudflare Turnstile verification.
 *
 * Degrades on purpose, and `turnstile-gate.ts` holds the rule: both halves of the key pair or
 * neither. Without `TURNSTILE_SECRET_KEY` there is nothing to check against; without
 * `NEXT_PUBLIC_TURNSTILE_SITE_KEY` no widget renders, so no token can exist and demanding one
 * refuses every real customer. Either way the honeypot and the two-second time floor still run.
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileOutcome = "passed" | "failed" | "skipped";

export interface TurnstileResult {
  outcome: TurnstileOutcome;
  /** Cloudflare's own error codes, for the log. Never shown to a reader. */
  errorCodes?: string[];
}

/** True only when both halves are present, which is the only state in which the check can pass. */
export function isTurnstileConfigured(): boolean {
  return (
    turnstileGate({
      secret: process.env.TURNSTILE_SECRET_KEY,
      siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      token: "probe",
    }).action === "verify"
  );
}

export async function verifyTurnstile(
  token: string | undefined | null,
  remoteIp?: string,
): Promise<TurnstileResult> {
  const gate = turnstileGate({
    secret: process.env.TURNSTILE_SECRET_KEY,
    siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    token,
  });

  if (gate.action === "skip") {
    if (gate.reason === "half-configured") {
      /*
       * Loud, and at error level, because this one is silent from the outside: the site looks
       * normal and every submission is refused. It is a deployment mistake, not a visitor's.
       */
      console.error(
        JSON.stringify({
          at: "turnstile",
          event: "half-configured",
          detail:
            "TURNSTILE_SECRET_KEY is set but NEXT_PUBLIC_TURNSTILE_SITE_KEY is not, so no widget " +
            "renders and no token can exist. Skipping the check. Set both or neither, and " +
            "redeploy: the site key is inlined at build time.",
        }),
      );
      return { outcome: "skipped", errorCodes: ["site-key-missing"] };
    }
    return { outcome: "skipped" };
  }

  if (gate.action === "fail") return { outcome: "failed", errorCodes: ["missing-input-response"] };

  const body = new URLSearchParams({ secret: gate.secret, response: gate.token });
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
