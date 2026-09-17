/**
 * Capture mode: the one place that knows how to take a screenshot of this site.
 *
 * The section-heading reveal (`reveal-heading` in src/app/globals.css) is a scroll-driven clip
 * wipe whose rest state is a closed shutter. A full-page screenshot never scrolls, so every
 * heading below the first viewport is captured at `clip-path: inset(0 -5% 100% -5%)` — painted as
 * nothing. Every capture in docs/screens/ was taken that way, and the design reviews run against
 * them read the empty bands as generous spacing rather than as missing headings.
 *
 * `enableCaptureMode` sets `data-capture` on the root element before any page script runs, which
 * globals.css keys the reveal off. `countVisibleHeadings` is the check that the escape actually
 * worked, so a future change to the reveal cannot quietly reintroduce the blindness.
 */

/** The attribute globals.css keys on. Nothing in src/ sets it; only a capture harness does. */
export const CAPTURE_ATTR = "data-capture";

/**
 * Arm capture mode on a Playwright BrowserContext (or Page). Call before the first navigation.
 *
 * `addInitScript` runs at document-start, which on the very first call can be before
 * `document.documentElement` exists, so the attribute is set again on `DOMContentLoaded`. Setting
 * it twice is free; setting it too late is a blank heading.
 */
export async function enableCaptureMode(contextOrPage) {
  await contextOrPage.addInitScript(() => {
    const mark = () => document.documentElement?.setAttribute("data-capture", "static");
    mark();
    document.addEventListener("DOMContentLoaded", mark, { once: true });
  });
}

/**
 * Accept the cookie banner before capturing, so it is not sitting across the top of the page.
 *
 * It is a separate call from `enableCaptureMode` because it needs the base URL to scope the cookie
 * and because a capture of the banner itself is occasionally the point. Everything that captures
 * the *site* wants it: the banner is 90px of overlay across the first band on every route, and on
 * the homepage that band is the stats row.
 */
export async function dismissConsent(context, baseUrl) {
  await context.addCookies([
    { name: "ea-consent", value: "accepted", domain: new URL(baseUrl).hostname, path: "/" },
  ]);
}

/**
 * Classify every h2 in the current render into the three states that matter.
 *
 * The distinction is the whole point. A *clipped* heading is the bug: it is meant to be read, and
 * it paints nothing. A *screen-reader* heading is correct and deliberate — Footer.tsx carries four
 * `sr-only` h2s so a screen-reader user gets landmarks the sighted layout conveys with columns, and
 * ProofStrip has one. Counting those two states together produces a check that cries wolf on every
 * route and fails /enquire, whose only h2s are the four in the footer.
 *
 * Clipping has to be detected structurally, because a clipped heading still reports a full bounding
 * box, `opacity: 1` and `visibility: visible`. Every check a person would reach for first passes on
 * an element that paints nothing, which is exactly how this survived a whole review pass.
 */
export async function classifyHeadings(page) {
  return page.evaluate(() => {
    /** An inset() with any side >= 100% has closed the box completely. */
    const closedByClip = (el) => {
      for (let node = el; node; node = node.parentElement) {
        const clip = getComputedStyle(node).clipPath;
        if (!clip || clip === "none" || !clip.includes("inset(")) continue;
        const sides = clip.match(/-?[\d.]+%/g);
        if (sides?.some((side) => Number.parseFloat(side) >= 100)) return true;
      }
      return false;
    };

    const label = (h) => h.textContent?.trim().slice(0, 40) ?? "";
    const visible = [];
    const clipped = [];
    const screenReader = [];

    for (const heading of document.querySelectorAll("h2")) {
      const box = heading.getBoundingClientRect();
      const style = getComputedStyle(heading);
      /* 4px floor: an sr-only heading is clamped to 1x1px. It is correct, not missing. */
      const isScreenReader = box.width < 4 || box.height < 4;
      const isHidden =
        style.display === "none" ||
        style.visibility === "hidden" ||
        Number.parseFloat(style.opacity) === 0;

      if (isScreenReader) screenReader.push(label(heading));
      else if (isHidden || closedByClip(heading)) clipped.push(label(heading));
      else visible.push(label(heading));
    }

    return { visible, clipped, screenReader };
  });
}
