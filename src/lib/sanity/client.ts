import "server-only";

/**
 * Two clients, and the difference between them is the point.
 *
 * `readClient` serves the public site. The dataset is private, because bookings and enquiries live
 * in it, so even a published read needs a token; it goes through the CDN and its results are
 * cached by Next under tags that /api/revalidate invalidates on publish.
 *
 * `writeClient` is the only thing that may create a booking, move a seat count or read a fee for
 * an order. It never uses the CDN: an order created seconds after a fee changed must see the new
 * fee, and the CDN is allowed to be a minute behind.
 */
import { createClient, type SanityClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "../../../sanity/env";

const readToken = process.env.SANITY_API_READ_TOKEN?.trim() || undefined;
const writeToken = process.env.SANITY_API_WRITE_TOKEN?.trim() || undefined;

export const readClient: SanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: "published",
  token: readToken,
});

/** Drafts, for the Presentation tool. Never used outside draft mode. */
export const previewClient: SanityClient = readClient.withConfig({
  useCdn: false,
  perspective: "drafts",
  token: readToken,
  stega: { enabled: true, studioUrl: "/studio" },
});

/**
 * Null when SANITY_API_WRITE_TOKEN is absent. Every caller checks, and the feature that needed it
 * degrades to a WhatsApp handoff rather than throwing at a reader mid-checkout.
 */
export const writeClient: SanityClient | null = writeToken
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      perspective: "published",
      token: writeToken,
    })
  : null;

export const hasWriteAccess = writeClient !== null;
