import Image from "next/image";
import { Placeholder } from "@/components/site/Placeholder";
import { publicPhoto, publicPhotoAlt } from "@/lib/photos";
import { cn } from "@/lib/utils";

type SlotAspect = "photo" | "portrait" | "wide" | "square";

interface SlotPhotoProps {
  /** The slot name from docs/images-manifest.md, e.g. "about-campus-1". */
  slot: string;
  aspect?: SlotAspect;
  /** Told to the browser so it can pick a width; the frame's own aspect class holds the box. */
  sizes: string;
  priority?: boolean;
  /** Dark placeholders sit inside the one black section; light ones everywhere else. */
  tone?: "light" | "dark";
  className?: string;
  placeholderClassName?: string;
}

const ASPECT_CLASS: Record<SlotAspect, string> = {
  photo: "aspect-photo",
  portrait: "aspect-portrait",
  wide: "aspect-wide",
  square: "aspect-square",
};

/**
 * One photo slot filled from public/, or the branded placeholder while the file has not arrived.
 *
 * The counterpart to SanityPhoto for the slots that are not Sanity documents — the campus gallery,
 * the for-cafes section — where the academy's file lands in the repository rather than in the CMS.
 * Both branches render the same frame at the same aspect, so a page does not reflow on the day a
 * photograph lands, and neither branch ever invents an image (CLAUDE.md non-negotiable 8).
 *
 * `width`/`height` are the aspect written as numbers, not the file's real pixels: the frame is an
 * aspect class with `object-cover`, so these only give the browser the ratio that reserves the box
 * before the bytes arrive. That is what keeps CLS at zero here.
 */
export function SlotPhoto({
  slot,
  aspect = "photo",
  sizes,
  priority = false,
  tone = "light",
  className,
  placeholderClassName,
}: SlotPhotoProps) {
  const src = publicPhoto(slot);

  if (!src) {
    return (
      <Placeholder
        slot={slot}
        aspect={aspect}
        tone={tone}
        priority={priority}
        className={placeholderClassName ?? className}
      />
    );
  }

  const ratio = { photo: [1200, 800], portrait: [800, 1000], wide: [1280, 720], square: [900, 900] }[
    aspect
  ] as [number, number];

  return (
    <Image
      src={src}
      alt={publicPhotoAlt(slot)}
      width={ratio[0]}
      height={ratio[1]}
      priority={priority}
      sizes={sizes}
      /* The same 1px white-2 edge the placeholder draws. Without it a mixed grid drew a border
         around every empty frame and none around the photograph, so the placeholders looked more
         designed than the picture. */
      className={cn(
        ASPECT_CLASS[aspect],
        "w-full rounded-sm border border-white-2 object-cover",
        className,
      )}
    />
  );
}
