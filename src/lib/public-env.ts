/**
 * The public half of the environment, with no dependencies.
 *
 * Kept separate from src/lib/env.ts on purpose: that file validates with zod, and anything a
 * Client Component imports drags its whole import graph into the browser bundle. The enquiry form
 * needs the WhatsApp number and the site origin, and pulling zod along for that cost about 50KB
 * gzipped on every page. NEXT_PUBLIC_* values are read as literals so Next can inline them.
 */

function blankToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === "" ? undefined : trimmed;
}

const rawSiteUrl = blankToUndefined(process.env.NEXT_PUBLIC_SITE_URL) ?? "http://localhost:3000";

/** Absolute site origin with no trailing slash, used for canonicals, OG and JSON-LD. */
export const siteUrl: string = rawSiteUrl.replace(/\/+$/, "");

/**
 * Digits with country code and no plus, or undefined when the variable is unset or malformed.
 * src/lib/env.ts reports the malformed case; here a bad value simply falls back to siteSettings.
 */
export const whatsappNumberOverride: string | undefined = (() => {
  const value = blankToUndefined(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);
  return value && /^\d{10,15}$/.test(value) ? value : undefined;
})();

/** Build an absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
