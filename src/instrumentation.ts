import { featureFlags, halfConfigured } from "@/lib/env";

/**
 * Runs once when a server instance starts, before it takes a request.
 *
 * `featureFlags()` was written to be "logged once at boot so a deployment's capabilities are
 * visible in the platform log" and then never called from anywhere, which is half of why a
 * Turnstile secret with no site key survived a deploy, a smoke test and 1727 passing tests: the
 * deployment log said nothing about what was switched on, so nobody could see that the bot check
 * was configured on one side only.
 */
export function register(): void {
  // The edge runtime boots per region and would print this on every cold start in every one.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  console.log(JSON.stringify({ at: "boot", event: "feature-flags", flags: featureFlags() }));

  const broken = halfConfigured();
  if (broken.length > 0) {
    /*
     * Error level, not warn. Each of these renders a working-looking site with one path that
     * refuses everyone, and the public half is inlined at build time, so the fix is a variable
     * *and* a redeploy.
     */
    console.error(
      JSON.stringify({ at: "boot", event: "half-configured-integration", pairs: broken }),
    );
  }
}
