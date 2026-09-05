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
