import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** Which ground the logo sits on. Picks the matching lockup file. */
  on?: "white" | "black";
  className?: string;
  /** Set on the header logo so it is not lazy-loaded into the LCP window. */
  priority?: boolean;
  /** Empty when the surrounding link already carries the accessible name. */
  alt?: string;
  /** Match the rendered box: an oversized value makes the browser fetch several times the pixels. */
  sizes?: string;
}

/**
 * The supplied lockups are stacked (roughly square), not the horizontal lockup design.md
 * describes, and only raster renders exist. Both are recorded in docs/STATUS.md as client items.
 * Until the SVG arrives the lockup is used whole: no crop, recolour or reconstruction.
 * Clear space is the height of the portafilter circle, enforced here as padding.
 */
export function Logo({
  on = "white",
  className,
  priority = false,
  alt = "Espresso Academy India",
  sizes = "(min-width: 768px) 128px, 96px",
}: LogoProps) {
  const src = on === "black" ? "/logo/lockup-on-black.png" : "/logo/lockup-on-white.png";
  return (
    <Image
      src={src}
      alt={alt}
      width={1000}
      height={1000}
      priority={priority}
      sizes={sizes}
      className={cn("h-auto w-auto object-contain", className)}
    />
  );
}

interface LogoMarkProps {
  className?: string;
  alt?: string;
  sizes?: string;
  /** Set above the fold so the mark is not lazy-loaded into the LCP window. */
  priority?: boolean;
}

/** The fleur-de-lis and portafilter mark on its own, for tight spaces and the photo placeholder. */
export function LogoMark({ className, alt = "", sizes = "64px", priority = false }: LogoMarkProps) {
  return (
    <Image
      src="/logo/mark.png"
      alt={alt}
      width={682}
      height={1000}
      sizes={sizes}
      priority={priority}
      className={cn("h-auto w-auto object-contain", className)}
    />
  );
}
