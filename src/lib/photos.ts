/**
 * The client's photographs, resolved from a slot name to a file in public/.
 *
 * docs/images-manifest.md is a promise: "drop the file in, redeploy, done; no code changes". That
 * promise needs one place that knows the naming scheme, because the scheme is not uniform — the
 * hero is `hero.jpg`, a course is `courses/<slug>.jpg`, and the for-cafes slot is called
 * `for-cafes-team` but its file is `for-cafes.jpg`. Spreading that across six call sites is six
 * chances for a file to land in the repository and never appear on the site.
 *
 * `existsSync` runs at build time, because every route that renders a photo is prerendered, so the
 * answer is baked into the HTML and costs a reader nothing. Same technique, and the same reason,
 * as the reel detection in HeroMedia. This is a server module: `node:fs` never reaches the browser.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Does this file exist in public/ at the moment this page is rendered?
 *
 * Exported because the hero's reel is not a manifest slot but asks the same question, and two
 * copies of an `existsSync(join(cwd, "public", …))` is two places for the path handling to drift.
 */
export function publicFileExists(publicPath: string): boolean {
  return existsSync(join(process.cwd(), "public", publicPath.replace(/^\//, "")));
}

/** Extensions the manifest allows, in the order they win. */
const EXTENSIONS = [".jpg", ".webp"] as const;

/**
 * Slot to path, exactly as the manifest's table reads it.
 *
 * The three fixed slots are spelled out because their paths are not derivable from the slot name;
 * the three families are patterns because the academy adds files to them over time.
 */
function slotToStem(slot: string): string | null {
  if (slot === "hero") return "/images/hero";
  if (slot === "contact-campus") return "/images/contact";
  if (slot === "for-cafes-team") return "/images/for-cafes";

  const campus = /^about-campus-([1-9]\d*)$/.exec(slot);
  if (campus) return `/images/about/campus-${campus[1]}`;

  const course = /^course-([a-z0-9-]+)$/.exec(slot);
  if (course) return `/images/courses/${course[1]}`;

  const trainer = /^trainer-([a-z0-9-]+)$/.exec(slot);
  if (trainer) return `/images/trainers/${trainer[1]}`;

  return null;
}

/** The public path of the academy's photograph for this slot, or null while none has arrived. */
export function publicPhoto(slot: string): string | null {
  const stem = slotToStem(slot);
  if (!stem) return null;

  for (const extension of EXTENSIONS) {
    const path = stem + extension;
    if (publicFileExists(path)) return path;
  }
  return null;
}

/**
 * Alt text for a photograph that ships in this repository.
 *
 * It lives here, beside the path rule, rather than in content/data.ts as the manifest originally
 * said, because build 2 stopped `src/` importing that file: the site's text comes from Sanity now.
 * A file in public/ and its description are one commit, so keeping them in one file is the only
 * arrangement where a photograph cannot be swapped without its alt being reconsidered.
 *
 * Each line describes the photograph that is actually in the repository, not the photograph the
 * page would like to have. Where the two disagree the alt follows the file, and the disagreement
 * is a question for the academy (see docs/STATUS.md), never something to paper over: alt that
 * confidently describes the wrong picture is worse for a screen reader than none.
 *
 * A Sanity image never reads this map — it carries its own alt, authored with the upload.
 */
const ALT: Record<string, string> = {
  hero: "Two students at the academy bar: one holds an orange pour-over dripper, the other folds a paper filter into a cone set on a glass carafe.",
  /*
   * No `for-cafes-team` entry, deliberately.
   *
   * There was one, describing the cupping pair, and that photograph now serves the IBC Basic
   * course instead. Leaving the line here would be a trap: the day the academy sends a real team
   * photograph it would land at the same slot and silently inherit a description of a different
   * picture, which is the one failure mode alt text has. The slot renders its branded placeholder
   * until a file arrives, and whoever adds that file writes its alt here in the same commit.
   */
  "about-campus-1":
    "Five people standing under the Espresso Academy fleur-de-lis painted on the campus wall, holding green beans, roasted beans and a bag of coffee, with the drum roaster in front of them.",
  "course-italian-barista-course-basic":
    "One person tastes coffee from a cupping spoon while another watches, at a bench of brewing kit.",
  "course-ibc-advanced-barista":
    "A barista at a professional espresso machine, steaming milk in a jug at the steam wand.",
  "course-ibc-advanced-roasting":
    "A student at the academy looking down at the bench, the fleur-de-lis mark on the glass partition behind.",
};

/**
 * The alt for this slot's photograph.
 *
 * `fallback` is what the caller already had — a course's `heroAlt` from Sanity, say. The map wins,
 * because the map was written against the file in this repository and the fallback was written
 * before anyone had seen it.
 */
export function publicPhotoAlt(slot: string, fallback = ""): string {
  return ALT[slot] ?? fallback;
}
