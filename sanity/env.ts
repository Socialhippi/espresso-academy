/**
 * The Studio's view of the environment.
 *
 * Kept apart from src/lib/env.ts because this module is imported by both the Studio bundle and
 * the Node scripts in sanity/seed, neither of which should drag zod or the site's server-only
 * validation along with them.
 */
/**
 * Two names for each value, and the order matters.
 *
 * This module is read by three different builds. Next inlines `NEXT_PUBLIC_*`; the Node seed
 * scripts read the real `process.env`; and `sanity deploy` builds the hosted Studio with Vite,
 * which exposes **only** variables prefixed `SANITY_STUDIO_`. Reading a Next name first meant the
 * hosted Studio at espresso-academy-india.sanity.studio was built with `undefined` and crashed at
 * boot with "Missing NEXT_PUBLIC_SANITY_PROJECT_ID" — a variable that cannot exist in that build
 * no matter what anyone sets.
 */
function required(candidates: Array<string | undefined>, names: string): string {
  for (const candidate of candidates) {
    const value = candidate?.trim();
    if (value) return value;
  }
  throw new Error(
    `Missing ${names}. Copy it from .env.example; the project id and dataset are not optional because the site has no content without them. The Studio build reads the SANITY_STUDIO_ name.`,
  );
}

export const projectId = required(
  [process.env.SANITY_STUDIO_PROJECT_ID, process.env.NEXT_PUBLIC_SANITY_PROJECT_ID],
  "SANITY_STUDIO_PROJECT_ID (or NEXT_PUBLIC_SANITY_PROJECT_ID)",
);

export const dataset = required(
  [process.env.SANITY_STUDIO_DATASET, process.env.NEXT_PUBLIC_SANITY_DATASET],
  "SANITY_STUDIO_DATASET (or NEXT_PUBLIC_SANITY_DATASET)",
);

/**
 * Pinned, not floating. A date here is a contract: the API answers exactly as it did on that day,
 * so a change Sanity ships next month cannot alter what the site renders without a commit.
 */
export const apiVersion =
  process.env.SANITY_STUDIO_API_VERSION?.trim() ||
  process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() ||
  "2026-09-05";

/** Where the Presentation tool points its iframe. */
export const studioPreviewOrigin =
  process.env.SANITY_STUDIO_SITE_URL?.trim() ||
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "") ||
  "http://localhost:3000";
