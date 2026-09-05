import "server-only";

/**
 * Environment validation, server side.
 *
 * Two halves, and the split matters. **Public** values are inlined into the browser bundle by the
 * bundler and live in `src/lib/public-env.ts`, which imports nothing: pulling this file into a
 * Client Component would ship zod with it, which measured about 50KB gzipped on every page in
 * build 1. **Server** values are validated here and never leave the server.
 *
 * Almost everything is optional, and that is a design decision rather than laziness: every
 * integration degrades to a logged fallback, so a missing key makes a feature quiet rather than
 * making the site fail. The two exceptions are the Sanity project id and dataset, which are
 * required, because a site with no content is not a site. `docs/plans/build-2.md` has the full
 * matrix of what switches off when.
 *
 * A malformed *optional* value warns and is ignored. A malformed *required* one throws at boot,
 * which is the right time to find out.
 */
import { z } from "zod";
import { absoluteUrl, isIndexable, siteUrl } from "@/lib/public-env";

export { absoluteUrl, isIndexable, siteUrl };

/** Treat an empty string in a .env file as "not set" rather than as an invalid value. */
function blankToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === "" ? undefined : trimmed;
}

const optionalSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  /** Digits with country code, no plus. Overrides the number in Sanity settings when set. */
  NEXT_PUBLIC_WHATSAPP_NUMBER: z
    .string()
    .regex(/^\d{10,15}$/, "Expected 10 to 15 digits including the country code")
    .optional(),

  SANITY_API_READ_TOKEN: z.string().min(1).optional(),
  SANITY_API_WRITE_TOKEN: z.string().min(1).optional(),
  SANITY_REVALIDATE_SECRET: z.string().min(16, "Too short to be worth having").optional(),

  RAZORPAY_KEY_ID: z.string().startsWith("rzp_", "A Razorpay key id starts with rzp_").optional(),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(16, "Too short to be worth having").optional(),

  RESEND_API_KEY: z.string().startsWith("re_", "A Resend key starts with re_").optional(),
  LEAD_TO_EMAIL: z.email().optional(),
  BOOKING_TO_EMAIL: z.email().optional(),
  CAFE_TO_EMAIL: z.email().optional(),
  RESEND_FROM_EMAIL: z.string().min(3).optional(),

  GOOGLE_SHEETS_ID: z.string().min(1).optional(),
  GOOGLE_SHEETS_CLIENT_EMAIL: z.email().optional(),
  GOOGLE_SHEETS_PRIVATE_KEY: z.string().min(1).optional(),

  TURNSTILE_SECRET_KEY: z.string().min(1).optional(),
  META_CAPI_ACCESS_TOKEN: z.string().min(1).optional(),
  META_TEST_EVENT_CODE: z.string().min(1).optional(),
});

/**
 * Required. Not optional-with-a-fallback, because there is no honest fallback: a build that cannot
 * reach the content should stop rather than deploy an empty site.
 */
const requiredSchema = z.object({
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1, "Sanity project id is required"),
  NEXT_PUBLIC_SANITY_DATASET: z.string().min(1, "Sanity dataset is required"),
});

const rawOptional = Object.fromEntries(
  Object.keys(optionalSchema.shape).map((key) => [key, blankToUndefined(process.env[key])]),
);

const parsed = optionalSchema.safeParse(rawOptional);

if (!parsed.success) {
  // Warn rather than throw: a malformed optional value must never take the site down.
  console.warn(
    "[env] Ignoring invalid environment values:",
    JSON.stringify(z.flattenError(parsed.error).fieldErrors),
  );
}

export const env = parsed.success ? parsed.data : optionalSchema.parse({});

/**
 * Validates the required values. Called from the places that cannot work without them rather than
 * at module scope, so importing this file for one optional key does not throw in a context (a unit
 * test, a script) that has no Sanity credentials.
 */
export function assertRequiredEnv(): void {
  const result = requiredSchema.safeParse({
    NEXT_PUBLIC_SANITY_PROJECT_ID: blankToUndefined(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID),
    NEXT_PUBLIC_SANITY_DATASET: blankToUndefined(process.env.NEXT_PUBLIC_SANITY_DATASET),
  });
  if (!result.success) {
    throw new Error(
      `Missing required environment: ${JSON.stringify(z.flattenError(result.error).fieldErrors)}`,
    );
  }
}

/** True when a lead email can actually be sent; otherwise the form hands off to WhatsApp. */
export const canSendLeadEmail: boolean = Boolean(env.RESEND_API_KEY && env.LEAD_TO_EMAIL);

/**
 * What is switched on in this environment. Logged once at boot so a deployment's capabilities are
 * visible in the platform log rather than having to be inferred from behaviour.
 */
export function featureFlags(): Record<string, boolean> {
  return {
    sanityRead: Boolean(env.SANITY_API_READ_TOKEN),
    sanityWrite: Boolean(env.SANITY_API_WRITE_TOKEN),
    revalidateWebhook: Boolean(env.SANITY_REVALIDATE_SECRET),
    payments: Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET),
    paymentWebhook: Boolean(env.RAZORPAY_WEBHOOK_SECRET),
    email: Boolean(env.RESEND_API_KEY),
    sheets: Boolean(
      env.GOOGLE_SHEETS_ID && env.GOOGLE_SHEETS_CLIENT_EMAIL && env.GOOGLE_SHEETS_PRIVATE_KEY,
    ),
    turnstile: Boolean(env.TURNSTILE_SECRET_KEY),
    metaCapi: Boolean(env.META_CAPI_ACCESS_TOKEN),
    indexable: isIndexable,
  };
}
