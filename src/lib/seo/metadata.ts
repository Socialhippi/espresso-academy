/**
 * Metadata helpers. Every indexable route gets a self-referencing absolute canonical, an OG image
 * and a description inside the 140 to 160 character band that .claude/rules/seo.md sets.
 */
import type { Metadata } from "next";
import { absoluteUrl } from "@/lib/env";

/** The site-wide Open Graph card, rendered by src/app/opengraph-image.tsx. */
export const DEFAULT_OG_IMAGE = absoluteUrl("/opengraph-image");

/**
 * The suffix is the site name, and `generateMetadata` runs before any request in a static build,
 * so this one string stays a literal rather than an await on Sanity. Everything else on a page's
 * metadata comes from the document being rendered.
 */
export const SITE_NAME = "Espresso Academy India";
export const TITLE_SUFFIX = ` | ${SITE_NAME}`;

interface PageMetadataInput {
  /** Without the suffix: the root layout's template appends it. */
  title: string;
  description: string;
  /** Site-relative, e.g. "/courses/latte-art". */
  path: string;
  /**
   * Absolute URL of this route's Open Graph card. Defaults to the site-wide one.
   *
   * Set explicitly rather than left to the `opengraph-image.tsx` file convention: that convention
   * applies to the segment that declares it and is not inherited by sibling routes, so a single
   * root card silently covered only the homepage.
   */
  ogImage?: string;
  noindex?: boolean;
  type?: "website" | "article";
}

export function pageMetadata({
  title,
  description,
  path,
  ogImage = DEFAULT_OG_IMAGE,
  noindex = false,
  type = "website",
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  /* Set the title absolutely rather than leaning on the root layout's template: the template
     does not apply to the segment that defines it, so app/page.tsx would silently lose the
     suffix. Every page carrying its own full title removes that trap. */
  return {
    title: { absolute: `${title}${TITLE_SUFFIX}` },
    description,
    alternates: { canonical: url },
    robots: noindex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
    openGraph: {
      type,
      url,
      title: `${title}${TITLE_SUFFIX}`,
      description,
      siteName: SITE_NAME,
      locale: "en_IN",
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${title}${TITLE_SUFFIX}` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title}${TITLE_SUFFIX}`,
      description,
      images: [ogImage],
    },
  };
}

/**
 * Trim a description to the 160-character ceiling on a word boundary. Used where the copy is
 * assembled from content/data.ts rather than written by hand.
 */
export function clampDescription(text: string, max = 158): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= max) return collapsed;
  const cut = collapsed.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : max).replace(/[,.;:]$/, "")}.`;
}
