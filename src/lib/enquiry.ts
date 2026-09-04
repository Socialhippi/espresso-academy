/**
 * The enquiry contract, shared by the form and by /api/enquiry so the two can never drift.
 *
 * Deliberately zod-free: this module is imported by the client form, and anything it imports
 * ships to the browser. The zod schema lives in src/lib/enquiry-schema.ts, which only the route
 * handler imports. The route re-validates every field, because a client check is not a check.
 */

export const enquiryTypes = ["student", "waitlist", "cafe"] as const;
export type EnquiryType = (typeof enquiryTypes)[number];

/** Indian mobile numbers are 10 digits and never start with 0 to 5. */
export const phoneRegex = /^[6-9]\d{9}$/;

/** Anything faster than this was not typed by a person. */
export const MIN_TIME_ON_FORM_MS = 2000;

export interface EnquirySuccess {
  ok: true;
  /** "email" when the lead was sent, "whatsapp" when the reader must carry it over themselves. */
  delivery: "email" | "whatsapp";
  /** Set to "whatsapp" when no email could be sent, per the route contract. */
  fallback?: "whatsapp";
  /** The pre-filled handoff link that goes with the fallback. */
  url?: string;
  /** Same link, named for the form. */
  whatsappUrl?: string;
}

export interface EnquiryFailure {
  ok: false;
  /** Field name to message. Empty for a general failure. */
  errors: Record<string, string>;
  /** Always offered so a failure still has a way through. */
  whatsappUrl: string;
}

export type EnquiryResponse = EnquirySuccess | EnquiryFailure;

/** Human label for the enquiry type, used in the email subject and the form heading. */
export const enquiryTypeLabel: Record<EnquiryType, string> = {
  student: "Course enquiry",
  waitlist: "Batch alert request",
  cafe: "Cafe and team training enquiry",
};

/** Pull the utm_* pairs out of a query string for the lead record. */
export function readUtm(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const utm: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    if (key.startsWith("utm_") && value) utm[key] = value.slice(0, 120);
  }
  return utm;
}
