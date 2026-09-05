/**
 * The Studio's view of the environment.
 *
 * Kept apart from src/lib/env.ts because this module is imported by both the Studio bundle and
 * the Node scripts in sanity/seed, neither of which should drag zod or the site's server-only
 * validation along with them.
 */
function required(value: string | undefined, name: string): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(
      `Missing ${name}. Copy it from .env.example; the project id and dataset are not optional because the site has no content without them.`,
    );
  }
  return trimmed;
}

export const projectId = required(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  "NEXT_PUBLIC_SANITY_PROJECT_ID",
);

export const dataset = required(process.env.NEXT_PUBLIC_SANITY_DATASET, "NEXT_PUBLIC_SANITY_DATASET");

/**
 * Pinned, not floating. A date here is a contract: the API answers exactly as it did on that day,
 * so a change Sanity ships next month cannot alter what the site renders without a commit.
 */
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || "2026-09-05";

/** Where the Presentation tool points its iframe. */
export const studioPreviewOrigin =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "") ||
  "http://localhost:3000";
