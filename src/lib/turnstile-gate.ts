/**
 * The Turnstile decision, on its own: no secret, no network, no `server-only`, so it can be
 * unit-tested. Same reasoning as `payments/signature.ts` — this is the rule that decides whether a
 * booking is allowed to proceed, and a test that had to stand up a route to reach it would not be
 * run often enough to matter.
 *
 * The rule that matters is **both halves or neither**. Turnstile is a pair: the browser needs
 * `NEXT_PUBLIC_TURNSTILE_SITE_KEY` to render a widget, and the server needs `TURNSTILE_SECRET_KEY`
 * to check what the widget produced. With only the secret, no widget renders, no token can exist,
 * and demanding one refuses every real customer while stopping no bot — which is exactly what
 * happened on production: every booking was answered "We could not verify that you are human."
 */

export type TurnstileGate =
  | { action: "skip"; reason: "not-configured" | "half-configured" }
  | { action: "fail"; reason: "missing-token" }
  /** Carries the two values the call needs, so the caller does not have to re-narrow them. */
  | { action: "verify"; secret: string; token: string };

export function turnstileGate(input: {
  secret: string | undefined | null;
  siteKey: string | undefined | null;
  token: string | undefined | null;
}): TurnstileGate {
  const secret = input.secret?.trim();
  const siteKey = input.siteKey?.trim();

  // Nothing configured. The documented degraded state: the honeypot and the time floor still run.
  if (!secret) return { action: "skip", reason: "not-configured" };

  // Configured on one side only. A misconfiguration, not a visitor problem, so it must not be
  // charged to the visitor.
  if (!siteKey) return { action: "skip", reason: "half-configured" };

  // Both halves are present, so a real browser had a widget and would have sent a token.
  if (!input.token) return { action: "fail", reason: "missing-token" };

  return { action: "verify", secret, token: input.token };
}
