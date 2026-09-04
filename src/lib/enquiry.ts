/**
 * The enquiry contract, shared by the form and by /api/enquiry so the two can never drift.
 * Validation lives here; the route handler re-runs it because a client check is not a check.
 */
import { z } from "zod";

export const enquiryTypes = ["student", "waitlist", "cafe"] as const;
export type EnquiryType = (typeof enquiryTypes)[number];

/** Indian mobile numbers are 10 digits and never start with 0 to 5. */
export const phoneRegex = /^[6-9]\d{9}$/;

/** Anything faster than this was not typed by a person. */
export const MIN_TIME_ON_FORM_MS = 2000;

export const enquirySchema = z.object({
  type: z.enum(enquiryTypes),
  name: z
    .string()
    .trim()
    .min(2, "Enter your name")
    .max(80, "That name is longer than we can store"),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Enter a 10-digit Indian mobile number, without +91"),
  course: z.string().trim().max(120).optional().or(z.literal("")),
  batch: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().max(1000, "Keep it under 1000 characters").optional().or(z.literal("")),
  consent: z.literal(true, { error: "Tick the box so we can reply to you" }),
  /**
   * Honeypot. A real person never fills a field they cannot see. The schema accepts any value:
   * rejecting it here would return a 400 naming the field, which tells a bot exactly what it
   * tripped. The route handler drops a filled honeypot silently with a 200 instead.
   */
  company: z.string().max(200).optional(),
  /** Milliseconds between the form mounting and the submit. */
  elapsedMs: z.number().int().nonnegative(),
  page: z.string().max(300).optional(),
  referrer: z.string().max(500).optional(),
  utm: z.record(z.string(), z.string()).optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

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
