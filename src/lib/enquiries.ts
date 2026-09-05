import "server-only";

/**
 * Writing an enquiry to Sanity.
 *
 * This is the write the response depends on, and the only one. The email, the spreadsheet and the
 * Meta event are all fan-out: a lead that reached Sanity is a lead the academy has, and a slow mail
 * provider must not turn it into a failure the student sees.
 */
import { writeClient } from "@/lib/sanity/client";
import type { BookingSource } from "@/lib/bookings";

export type EnquiryKind = "student" | "waitlist" | "cafe";

export interface CreateEnquiryInput {
  type: EnquiryKind;
  name: string;
  /** E.164, with the country code. */
  phone: string;
  email?: string | null;
  /** Course slug, when the reader picked one. */
  courseSlug?: string | null;
  /** Batch document id, when the enquiry is about one specific batch. */
  instanceId?: string | null;
  message?: string | null;
  source: BookingSource;
}

export type CreateEnquiryResult =
  | { created: true; id: string }
  | { created: false; reason: "no-write-access" | "failed"; error?: string };

/**
 * Resolves a course slug to its document id.
 *
 * The form sends a slug because that is what its `<select>` carries and what the URL uses; a
 * reference needs an id. A slug that does not resolve is not an error: the enquiry is still worth
 * having without the link, and refusing it because a course was renamed would lose a customer.
 */
async function courseIdForSlug(slug: string | null | undefined): Promise<string | null> {
  if (!slug || !writeClient) return null;
  try {
    return await writeClient.fetch<string | null>(
      `*[_type == "course" && slug.current == $slug][0]._id`,
      { slug },
    );
  } catch {
    return null;
  }
}

export async function createEnquiry(input: CreateEnquiryInput): Promise<CreateEnquiryResult> {
  if (!writeClient) return { created: false, reason: "no-write-access" };

  try {
    const courseId = await courseIdForSlug(input.courseSlug);

    const doc = await writeClient.create({
      _type: "enquiry",
      type: input.type,
      name: input.name,
      phone: input.phone,
      email: input.email || undefined,
      ...(courseId ? { course: { _type: "reference", _ref: courseId } } : {}),
      ...(input.instanceId ? { instance: { _type: "reference", _ref: input.instanceId } } : {}),
      message: input.message || undefined,
      source: { _type: "attributionSource", ...input.source },
      status: "new",
      createdAt: new Date().toISOString(),
    });

    return { created: true, id: doc._id };
  } catch (error) {
    return {
      created: false,
      reason: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
