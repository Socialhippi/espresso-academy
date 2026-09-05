/**
 * Google Consent Mode v2, as the snippet that has to run before anything else.
 *
 * The order matters more than the content. `gtag('consent', 'default', ...)` must execute before
 * GTM loads, or the container fires its tags once with no consent state and then again after the
 * update, which is exactly the double-count consent mode exists to prevent. So this is inlined in
 * the document head rather than imported as a module: a module would load after the parser reached
 * the GTM script tag.
 *
 * Everything defaults to `denied`. India is not covered by the EU rules that make consent mode
 * mandatory, and the academy could legally fire analytics on load. Defaulting to denied anyway is a
 * choice: a student filling in a phone number and an email deserves the same treatment as a reader
 * in Berlin, and the banner is one tap.
 *
 * `security_storage` is not listed because it is always granted and cannot be denied.
 */

export const CONSENT_COOKIE = "ea-consent";

/**
 * Runs before GTM. Reads the cookie synchronously so a returning visitor who already accepted is
 * not measured as denied for the first few hundred milliseconds of every page.
 *
 * Deterministic: no environment value is interpolated. That is what lets the CSP trust it by hash
 * rather than by nonce, and the difference matters more than it looks. A nonce has to be generated
 * per request and read back in the root layout with `headers()`, and reading a header in the root
 * layout opts **every page on the site** out of static generation — which it duly did, turning 32
 * static routes into 32 dynamic ones and putting two Sanity round trips in front of every view.
 */
export function consentModeSnippet(): string {
  return `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = window.gtag || gtag;
var m = document.cookie.match(/(?:^|; )${CONSENT_COOKIE}=([^;]*)/);
var granted = m && decodeURIComponent(m[1]) === 'accepted';
var state = granted ? 'granted' : 'denied';
gtag('consent', 'default', {
  ad_storage: state,
  ad_user_data: state,
  ad_personalization: state,
  analytics_storage: state,
  functionality_storage: 'granted',
  personalization_storage: state,
  wait_for_update: 500
});
gtag('set', 'ads_data_redaction', !granted);
gtag('set', 'url_passthrough', true);
`.trim();
}

/**
 * The CSP source for the snippet above: `sha256-<base64>`.
 *
 * Computed from the exact string that will be rendered, so the two cannot drift: change the snippet
 * and the hash changes with it.
 *
 * Web Crypto rather than `node:crypto`, because the caller is middleware and middleware runs on the
 * Edge runtime, which has no Node built-ins. `crypto.subtle` exists in both, so there is one
 * implementation rather than two that can disagree. Memoised: the input is a constant, so the
 * digest is computed once per worker rather than once per request.
 */
let cachedHash: string | null = null;

export async function consentModeHash(): Promise<string> {
  if (cachedHash) return cachedHash;
  const bytes = new TextEncoder().encode(consentModeSnippet());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  cachedHash = `'sha256-${base64}'`;
  return cachedHash;
}

/**
 * The `consent update` a banner choice sends.
 *
 * Uses the `gtag` the head snippet put on `window`, which is the documented interface and the only
 * shape GTM reads for a consent command: a consent update is not a dataLayer *event*, it is a
 * positional `arguments` object, and pushing an ordinary object here would be silently ignored.
 */
export function consentUpdate(granted: boolean): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  const state: "granted" | "denied" = granted ? "granted" : "denied";
  window.gtag("consent", "update", {
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
    analytics_storage: state,
    personalization_storage: state,
  });
  window.gtag("set", "ads_data_redaction", !granted);
}
