import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/site/Logo";

export type PlaceholderAspect = "photo" | "portrait" | "wide" | "square";

interface PlaceholderProps {
  /** The slot name from docs/images-manifest.md, e.g. "hero" or "trainer-akanksha-gupta". */
  slot: string;
  aspect?: PlaceholderAspect;
  /** Dark placeholders sit inside the one black section; light ones everywhere else. */
  tone?: "light" | "dark";
  /** Set on an above-the-fold slot so its mark is not lazy-loaded into the LCP window. */
  priority?: boolean;
  className?: string;
}

const aspectClass: Record<PlaceholderAspect, string> = {
  photo: "aspect-photo",
  portrait: "aspect-portrait",
  wide: "aspect-wide",
  square: "aspect-square",
};

/**
 * Stands in for a photo the client has not sent yet. Branded geometry only: a ground, a thin red
 * rule, the fleur-de-lis mark at 20% and the slot name. No AI-generated imagery, ever
 * (CLAUDE.md non-negotiable 8). Drop the real file into public/images/ and this disappears.
 */
export function Placeholder({
  slot,
  aspect = "photo",
  tone = "light",
  priority = false,
  className,
}: PlaceholderProps) {
  const dark = tone === "dark";
  return (
    <div
      role="img"
      aria-label={`Photo placeholder: ${slot}`}
      data-placeholder="true"
      className={cn(
        "relative isolate overflow-hidden rounded-sm border",
        aspectClass[aspect],
        dark ? "border-black-2 bg-black" : "border-white-2 bg-white-3",
        className,
      )}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 120 80"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full"
      >
        {/* Corner ticks: a frame that reads as a crop mark rather than as decoration. */}
        <path
          d="M6 2 H2 V6 M114 2 H118 V6 M6 78 H2 V74 M114 78 H118 V74"
          fill="none"
          strokeWidth="0.5"
          className={dark ? "stroke-black-2" : "stroke-white-2"}
          vectorEffect="non-scaling-stroke"
        />
        {/* The single red rule, at the top so it never runs through the slot label, which wraps
            to two lines on a narrow card. On the dark tone it stays a rule, never text. */}
        <line
          x1="10"
          y1="14"
          x2="34"
          y2="14"
          strokeWidth="1"
          className="stroke-red"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/*
        The master prompt specifies the mark at 20% opacity. That holds on the black ground, but on
        white-3 the red artwork at 20% renders as a distinct pink, and with a placeholder in every
        course card and trainer card it becomes the only pastel note on the page, which is exactly
        the "AI template" register design.md rules out. Halved on the light ground; the intent, a
        faint watermark, is unchanged.
      */}
      <div className="absolute inset-0 grid place-items-center">
        <LogoMark
          className={cn("h-2/5 w-auto", dark ? "opacity-20" : "opacity-10")}
          sizes="(min-width: 768px) 160px, 96px"
          priority={priority}
        />
      </div>

      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-x-3 bottom-3 type-label leading-tight text-balance",
          dark ? "text-grey-2" : "text-grey",
        )}
      >
        Photo: {slot}
      </span>
    </div>
  );
}
