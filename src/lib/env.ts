/**
 * The only place the app reads process.env.
 *
 * Everything is optional in this draft phase: a missing RESEND_API_KEY must not crash the
 * build or the request, it just routes the enquiry form to the WhatsApp handoff instead.
 * NEXT_PUBLIC_* values are read as literals so Next can inline them into the client bundle.
 */
import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  /** Digits with country code, no plus. Overrides siteSettings.whatsappNumber when set. */
  NEXT_PUBLIC_WHATSAPP_NUMBER: z
    .string()
    .regex(/^\d{10,15}$/, "Expected 10 to 15 digits including the country code")
    .optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  LEAD_TO_EMAIL: z.email().optional(),
});

/** Treat empty strings in .env files as "not set" rather than as invalid values. */
function blankToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === "" ? undefined : trimmed;
}

const parsed = schema.safeParse({
  NEXT_PUBLIC_SITE_URL: blankToUndefined(process.env.NEXT_PUBLIC_SITE_URL),
  NEXT_PUBLIC_WHATSAPP_NUMBER: blankToUndefined(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER),
  RESEND_API_KEY: blankToUndefined(process.env.RESEND_API_KEY),
  LEAD_TO_EMAIL: blankToUndefined(process.env.LEAD_TO_EMAIL),
});

if (!parsed.success) {
  // Warn rather than throw: a malformed optional value must never take the site down.
  console.warn(
    "[env] Ignoring invalid environment values:",
    JSON.stringify(z.flattenError(parsed.error).fieldErrors),
  );
}

const fallback = schema.parse({});

export const env = parsed.success ? parsed.data : fallback;

/** Absolute site origin with no trailing slash, used for canonicals, OG and JSON-LD. */
export const siteUrl: string = env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");

/** True when a lead email can actually be sent; otherwise the form hands off to WhatsApp. */
export const canSendLeadEmail: boolean = Boolean(env.RESEND_API_KEY && env.LEAD_TO_EMAIL);

/** Build an absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
