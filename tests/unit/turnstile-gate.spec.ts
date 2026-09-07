import { expect, test } from "@playwright/test";
import { turnstileGate } from "@/lib/turnstile-gate";

/**
 * The rule that took bookings down on production: a secret with no site key means no widget, so
 * no token, so every real customer was told "We could not verify that you are human."
 *
 * These cases are written from the four states the pair can be in, not from the implementation.
 */

const SECRET = "1x0000000000000000000000000000000AA";
const SITE_KEY = "1x00000000000000000000AA";
const TOKEN = "XXXX.DUMMY.TOKEN.XXXX";

test.describe("both halves or neither", () => {
  test("neither key: skipped, and the honeypot and time floor carry the load", () => {
    expect(turnstileGate({ secret: undefined, siteKey: undefined, token: undefined })).toEqual({
      action: "skip",
      reason: "not-configured",
    });
  });

  test("secret only: skipped as half-configured, never charged to the visitor", () => {
    expect(turnstileGate({ secret: SECRET, siteKey: undefined, token: undefined })).toEqual({
      action: "skip",
      reason: "half-configured",
    });
  });

  test("secret only, and a token turns up anyway: still half-configured", () => {
    // Nothing on the site could have produced this token, so it proves nothing either way.
    expect(turnstileGate({ secret: SECRET, siteKey: "", token: TOKEN })).toEqual({
      action: "skip",
      reason: "half-configured",
    });
  });

  test("site key only: skipped, because there is nothing to verify against", () => {
    expect(turnstileGate({ secret: undefined, siteKey: SITE_KEY, token: TOKEN })).toEqual({
      action: "skip",
      reason: "not-configured",
    });
  });
});

test.describe("both halves present", () => {
  test("no token is a real signal now, and fails", () => {
    expect(turnstileGate({ secret: SECRET, siteKey: SITE_KEY, token: undefined })).toEqual({
      action: "fail",
      reason: "missing-token",
    });
  });

  test("an empty token fails rather than being sent to Cloudflare", () => {
    expect(turnstileGate({ secret: SECRET, siteKey: SITE_KEY, token: "" })).toEqual({
      action: "fail",
      reason: "missing-token",
    });
  });

  test("a token is verified, and the call gets the trimmed pair it needs", () => {
    expect(turnstileGate({ secret: ` ${SECRET} `, siteKey: SITE_KEY, token: TOKEN })).toEqual({
      action: "verify",
      secret: SECRET,
      token: TOKEN,
    });
  });
});

test("whitespace is not a key", () => {
  // A variable set to an empty string in a dashboard is the usual way this goes wrong.
  expect(turnstileGate({ secret: "   ", siteKey: SITE_KEY, token: TOKEN })).toEqual({
    action: "skip",
    reason: "not-configured",
  });
  expect(turnstileGate({ secret: SECRET, siteKey: "   ", token: TOKEN })).toEqual({
    action: "skip",
    reason: "half-configured",
  });
});
