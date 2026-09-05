import Image from "next/image";
import { Placeholder } from "@/components/site/Placeholder";
import { imageAlt, imageLqip, imageUrl, sanityLoader, type SanityImage } from "@/lib/sanity/image";
import { cn } from "@/lib/utils";

interface SanityPhotoProps {
  /** The image as the GROQ projection returns it, or null while the academy has not sent one. */
  image: SanityImage | null | undefined;
  /** The slot name the branded placeholder prints while there is no photograph. */
  slot: string;
  /** Used when the image exists but its alt somehow does not; the schema requires one. */
  fallbackAlt: string;
  aspect: "photo" | "portrait" | "square";
  sizes: string;
  priority?: boolean;
  className?: string;
  placeholderClassName?: string;
}

const RENDER_WIDTH: Record<SanityPhotoProps["aspect"], { width: number; height: number }> = {
  photo: { width: 1200, height: 800 },
  portrait: { width: 800, height: 1000 },
  square: { width: 900, height: 900 },
};

const ASPECT_CLASS: Record<SanityPhotoProps["aspect"], string> = {
  photo: "aspect-photo",
  portrait: "aspect-portrait",
  square: "aspect-square",
};

/**
 * One photo slot: the Sanity image when there is one, the branded placeholder when there is not.
 *
 * Every card in build 1 wrote this `? :` out by hand, which was fine while `heroImage` was a
 * string path. It is an object now, with an alt, a blur hash and a CDN that does the resizing, and
 * writing that out per card is three chances to forget the blur or the sizes attribute. The
 * placeholder branch is unchanged: no photograph is ever invented, and the slot name still prints
 * so the academy can see which file is missing.
 */
export function SanityPhoto({
  image,
  slot,
  fallbackAlt,
  aspect,
  sizes,
  priority = false,
  className,
  placeholderClassName,
}: SanityPhotoProps) {
  const dimensions = RENDER_WIDTH[aspect];
  const src = imageUrl(image, dimensions);

  if (!src) {
    return <Placeholder slot={slot} aspect={aspect} className={placeholderClassName} />;
  }

  const blur = imageLqip(image);

  return (
    <Image
      loader={sanityLoader}
      src={src}
      alt={imageAlt(image, fallbackAlt)}
      width={dimensions.width}
      height={dimensions.height}
      priority={priority}
      sizes={sizes}
      // A blur hash only helps if it exists; without one, no placeholder is better than an empty
      // grey box that shifts.
      placeholder={blur ? "blur" : undefined}
      blurDataURL={blur}
      className={cn(ASPECT_CLASS[aspect], "w-full object-cover", className)}
    />
  );
}
