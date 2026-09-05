/**
 * The zod half of the checkout contract. Server-side only, for the same reason as
 * `enquiry-schema.ts`: zod is about 50KB gzipped and the browser needs none of it.
 *
 * There is no `amount` field, and there never will be. The server reads the fee from Sanity
 * (CLAUDE.md non-negotiable 11); a body that carried an amount would invite a route to trust it.
 */
import { z } from "zod";
import { phoneRegex } from "@/lib/enquiry";

export const orderSchema = z.object({
  instanceId: z.string().min(1).max(120),
  name: z.string().trim().min(2, "Enter your name").max(80, "That name is longer than we can store"),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Enter a 10-digit Indian mobile number, without +91"),
  email: z.email("Enter an email address we can send the confirmation to").max(200),
  /**
   * Only required when the course states a prerequisite. The route re-checks against the course
   * it read from Sanity rather than trusting the browser about whether the box was needed.
   */
  prerequisiteAccepted: z.boolean().optional(),
  consent: z.literal(true, { error: "Tick the box so we can contact you about this booking" }),
  /** Honeypot. Any value is accepted here; the route drops it silently with a 200. */
  company: z.string().max(200).optional(),
  /** Milliseconds between the form mounting and the submit. */
  elapsedMs: z.number().int().nonnegative(),
  turnstileToken: z.string().max(4000).optional(),
  page: z.string().max(300).optional(),
  referrer: z.string().max(500).optional(),
  utm: z.record(z.string(), z.string().max(200)).optional(),
});

export type OrderInput = z.infer<typeof orderSchema>;

export const verifySchema = z.object({
  bookingId: z.string().min(1).max(120),
  razorpayOrderId: z.string().min(1).max(120),
  razorpayPaymentId: z.string().min(1).max(120),
  razorpaySignature: z.string().min(1).max(500),
});

export type VerifyInput = z.infer<typeof verifySchema>;
