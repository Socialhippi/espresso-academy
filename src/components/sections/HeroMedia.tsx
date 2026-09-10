import { existsSync } from "node:fs";
import { join } from "node:path";
import Image from "next/image";
import { Placeholder } from "@/components/site/Placeholder";
import { cn } from "@/lib/utils";

/*
 * Where the client's footage lands. Named here once so the component, the manifest and whoever
 * drops the files in are all talking about the same two paths.
 */
const VIDEO_PATH = "/video/hero.mp4";
const POSTER_PATH = "/video/hero-poster.jpg";

/**
 * Does the file exist in public/ at the moment this page is rendered?
 *
 * The homepage is prerendered, so this runs at build time and the answer is baked into the HTML.
 * That is the point: dropping `public/video/hero.mp4` into the repo and redeploying switches the
 * hero from a still to a loop with no code change and no flag to remember, which is what
 * docs/images-manifest.md has been promising since the draft ("when the reel arrives, a muted,
 * poster-first, 12-second loop can replace the hero photo on desktop only").
 *
 * It is a server module. `node:fs` never reaches the browser, and nothing here costs a byte of
 * client JavaScript — which matters, because first-load JS is already over the budget in CLAUDE.md
 * and this pass is not allowed to make that worse.
 */
function publicFileExists(publicPath: string): boolean {
  return existsSync(join(process.cwd(), "public", publicPath.replace(/^\//, "")));
}

interface HeroMediaProps {
  /** The still the academy has already supplied, if any. Unrelated to the reel. */
  image?: string | null;
  /** Alt for `image`. It describes that photograph and is never reused for the reel's poster. */
  alt?: string;
  /**
   * Alt for the reel's poster frame, which is a different picture from `image`.
   *
   * TODO(client): no alt has been written for the reel, because there is no reel. Empty until one
   * is supplied, which marks the poster decorative — the honest state, and the one .claude/rules/
   * a11y.md allows. Do not fall this back to `alt`: alt that accurately describes the wrong
   * photograph is worse for a screen reader than none.
   */
  posterAlt?: string;
  /** The slot name the branded placeholder prints while there is nothing at all. */
  slot: string;
  className?: string;
}

/**
 * The hero's picture: a loop when there is footage, a still when there is a photograph, and the
 * branded placeholder when there is neither.
 *
 * All three states share one frame — 4:5 on a phone, 3:2 from md — so the composition beside the
 * words does not move when the client's files land, and none of the three can shift layout as it
 * loads. The 400ms shutter (`hero-media-in`) runs on the frame and never on the words: the
 * measured LCP element on this route is the hero sub-line, and an entry animation on it would
 * defer the very paint the budget is written against.
 *
 * Precedence is reel, then photograph, then placeholder. The reel outranks the still deliberately,
 * because that is what docs/images-manifest.md describes ("a muted, poster-first, 12-second loop
 * can replace the hero photo on desktop only"), and because the still keeps rendering underneath
 * it on every phone and under prefers-reduced-motion. A supplied photograph is never lost; on
 * desktop, when there is footage, the footage wins.
 *
 * No AI-generated imagery is ever produced here (CLAUDE.md non-negotiable 8). The placeholder is
 * branded geometry and the other two branches only ever render a file the academy supplied.
 */
export function HeroMedia({
  image,
  alt = "",
  posterAlt = "",
  slot,
  className,
}: HeroMediaProps) {
  const frame = cn(
    "aspect-portrait w-full rounded-sm object-cover md:aspect-photo",
    className,
  );

  if (publicFileExists(VIDEO_PATH) && publicFileExists(POSTER_PATH)) {
    return (
      <div className="hero-media-in">
        {/*
         * Muted, looping, inline, and poster-first, per .claude/rules/a11y.md.
         *
         * `controls` is there because that rule also requires a pause control, and this pass is
         * not allowed to add client JavaScript: the native control bar is the only pause button
         * available for zero bytes. TODO(design): if the academy wants the bar gone, a designed
         * pause toggle is a small client component and a deliberate decision to spend on it.
         *
         * `hero-loop` hides this below md and under prefers-reduced-motion, where the still below
         * takes over. Both are rendered from the same server HTML; CSS picks, so nothing has to
         * run to decide.
         *
         * `preload="none"`, not "metadata": `display: none` does not cancel a metadata fetch, so
         * with "metadata" every phone paid for the first bytes of a reel it is never shown, and
         * 64% of this audience is on a phone. Desktop loses nothing, because `autoplay` overrides
         * the hint the moment the element is displayed.
         */}
        <video
          className={cn(frame, "hero-loop")}
          poster={POSTER_PATH}
          autoPlay
          muted
          loop
          playsInline
          controls
          preload="none"
          aria-label={posterAlt || undefined}
        >
          <source src={VIDEO_PATH} type="video/mp4" />
        </video>

        {/*
          The same frame as a still: every phone, and anyone who has asked for less motion. It is
          the hero picture for most of this audience, so it keeps `priority`. The cost is one
          optimised poster fetched on desktop and not shown; the alternative is a lazy hero image
          on the 64% who do see it, which is the worse trade.
        */}
        <Image
          src={POSTER_PATH}
          alt={posterAlt}
          width={1200}
          height={800}
          priority
          sizes="(min-width: 1080px) 480px, 100vw"
          className={cn(frame, "hero-still")}
        />
      </div>
    );
  }

  if (image) {
    return (
      <Image
        src={image}
        alt={alt}
        width={1200}
        height={800}
        priority
        sizes="(min-width: 1080px) 480px, 100vw"
        className={cn(frame, "hero-media-in")}
      />
    );
  }

  return (
    <Placeholder
      slot={slot}
      aspect="portrait"
      priority
      className={cn("hero-media-in md:aspect-photo", className)}
    />
  );
}
