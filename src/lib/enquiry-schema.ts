/**
 * The zod half of the enquiry contract. Server-side only: it is imported by /api/enquiry and by
 * nothing that reaches the browser, because zod is about 50KB gzipped and the form needs none of
 * it. The plain types, the phone rule and the timing floor live in src/lib/enquiry.ts.
 */
import { z } from "zod";
import { enquiryTypes, phoneRegex } from "@/lib/enquiry";

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
