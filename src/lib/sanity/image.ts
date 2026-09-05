/**
 * next/image against the Sanity CDN.
 *
 * Sanity serves the transform, so `next/image`'s own optimiser is bypassed with a custom loader:
 * two CDNs re-encoding the same file is a waste, and Sanity's is closer to the asset. `auto=format`
 * asks its CDN for AVIF or WebP by Accept header, which is what next.config.ts already prefers for
 * local files.
 */
import imageUrlBuilder, { type SanityImageSource } from "@sanity/image-url";
import { dataset, projectId } from "../../../sanity/env";

const builder = imageUrlBuilder({ projectId, dataset });

/** An image reference as the queries return it: the asset, its alt, and the LQIP data URI. */
export interface SanityImage {
  asset?: { _ref?: string; _id?: string; url?: string | null; lqip?: string | null } | null;
  alt?: string | null;
  hotspot?: { x: number; y: number } | null;
}

/** A URL for a Sanity image at a given width, or null when there is no image yet. */
export function imageUrl(
  source: SanityImage | null | undefined,
  { width, height, quality = 80 }: { width: number; height?: number; quality?: number },
): string | null {
  if (!source?.asset) return null;
  let url = builder.image(source as SanityImageSource).width(width).quality(quality).auto("format");
  if (height) url = url.height(height).fit("crop");
  return url.url();
}

/** The blur placeholder Sanity computes for every asset, or undefined when it is not available. */
export function imageLqip(source: SanityImage | null | undefined): string | undefined {
  return source?.asset?.lqip ?? undefined;
}

/** The alt text. Required by the schema, so this only guards against an unmigrated document. */
export function imageAlt(source: SanityImage | null | undefined, fallback: string): string {
  const alt = source?.alt?.trim();
  return alt && alt.length > 0 ? alt : fallback;
}

/**
 * A `next/image` loader for Sanity assets. Passed per-image rather than configured globally so
 * local files in public/ keep using Next's optimiser.
 */
export function sanityLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 80));
  url.searchParams.set("auto", "format");
  return url.toString();
}
