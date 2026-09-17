import { test, expect, type Page } from "@playwright/test";

/**
 * The section-heading reveal, and the one thing it must never do: leave a heading unreadable.
 *
 * `reveal-heading` is a scroll-driven clip wipe (src/app/globals.css). Its closed state paints
 * nothing while still reporting a full bounding box, `opacity: 1` and `visibility: visible`, so a
 * stuck heading is invisible to every ordinary check — including a screenshot, which is how a whole
 * review pass was run against pages whose headings had all collapsed.
 *
 * The timing is a taste question and is not asserted here. What is asserted is the guarantee: a
 * heading that has reached the upper half of the screen is painted at full strength, however it got
 * there — scrolled to, jumped to by anchor, or restored by a back navigation.
 */

/** Where the reveal must be finished. The range ends at `cover 35%`, which for the smallest
 *  heading block on the site completes at about 0.62 of viewport height; half the screen is the
 *  conservative line, and it is also the honest reading of "someone is looking at this". */
const READING_ZONE = 0.5;

interface RevealState {
  text: string;
  top: number;
  bottom: number;
  viewport: number;
  /** Bottom inset as a percentage. <= 0 is fully open; 100 is a closed shutter. */
  bottomInset: number;
}

async function revealStates(page: Page): Promise<RevealState[]> {
  return page.evaluate(() => {
    /* `inset()` collapses repeated sides when computed, so the bottom value has to be read
       positionally against the shorthand's own rules rather than by index. */
    const bottomInsetOf = (clip: string): number => {
      if (!clip || clip === "none") return -Infinity;
      const inner = clip.match(/inset\(([^)]+)\)/)?.[1];
      if (!inner) return -Infinity;
      const sides = inner.trim().split(/\s+/).map((value) => Number.parseFloat(value));
      if (sides.length === 1) return sides[0]!;
      if (sides.length === 2) return sides[0]!;
      return sides[2]!;
    };

    return [...document.querySelectorAll(".reveal-heading")].map((el) => {
      const box = el.getBoundingClientRect();
      return {
        text: el.textContent?.trim().slice(0, 40) ?? "",
        top: box.top,
        bottom: box.bottom,
        viewport: window.innerHeight,
        bottomInset: bottomInsetOf(getComputedStyle(el).clipPath),
      };
    });
  });
}

/** Every heading that has reached the reading zone must be fully open. */
function expectNoneStuck(states: RevealState[], context: string) {
  const stuck = states.filter(
    (s) => s.bottom > 0 && s.top < s.viewport * READING_ZONE && s.bottomInset > 0,
  );
  expect(
    stuck.map((s) => `${s.text} (top ${Math.round(s.top)}, bottom inset ${s.bottomInset}%)`),
    `${context}: heading(s) stuck clipped inside the reading zone`,
  ).toEqual([]);
}

const ROUTES = ["/", "/courses", "/courses/italian-barista-course-basic"];

/* The three viewports the reveal has the least room in: the design floor, the phone height the
   audience actually holds, and a short laptop window where the cover range is tightest. */
const VIEWPORTS = [
  { name: "390x844 phone", width: 390, height: 844 },
  { name: "1280x620 short laptop", width: 1280, height: 620 },
  { name: "1280x800 desktop", width: 1280, height: 800 },
];

test.describe("section-heading reveal", () => {
  test.beforeEach(async ({ page }) => {
    const supported = await page.evaluate(() => CSS.supports("animation-timeline: view()"));
    /* Firefox has no scroll-driven timelines, and globals.css guards the closed state behind the
       same @supports query, so there is nothing to assert there: the headings are simply static. */
    test.skip(!supported, "no scroll-driven animation timeline in this browser");
  });

  for (const viewport of VIEWPORTS) {
    test.describe(viewport.name, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      for (const route of ROUTES) {
        test(`nothing stays clipped while scrolling ${route}`, async ({ page }) => {
          await page.goto(route);

          const height = await page.evaluate(() => document.documentElement.scrollHeight);
          /* Half a viewport at a time: a reveal that only completes on a lazy scroll would pass a
             jump straight to the bottom. */
          for (let y = 0; y < height; y += viewport.height / 2) {
            await page.evaluate((top) => window.scrollTo(0, top), y);
            await page.waitForTimeout(40);
            expectNoneStuck(await revealStates(page), `${route} at scrollY ${y}`);
          }

          await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
          await page.waitForTimeout(80);
          const atBottom = await revealStates(page);
          expect(
            atBottom.filter((s) => s.bottomInset > 0).map((s) => s.text),
            `${route}: heading(s) never opened even at the foot of the page`,
          ).toEqual([]);
        });
      }

      test("a heading reached by an anchor jump is fully open", async ({ page }) => {
        await page.goto("/courses/italian-barista-course-basic#day-4");
        await page.waitForTimeout(120);
        await expect(page.locator("#day-4")).toBeInViewport();
        expectNoneStuck(await revealStates(page), "anchor jump to #day-4");
      });

      test("a heading is fully open after a back navigation restores the scroll", async ({
        page,
      }) => {
        await page.goto("/courses");
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.55));
        await page.waitForTimeout(80);

        await page.goto("/courses/italian-barista-course-basic");
        await page.goBack();
        await page.waitForTimeout(160);

        expectNoneStuck(await revealStates(page), "/courses after back navigation");
      });

      test("the wipe is still running while the heading is at the bottom edge", async ({
        page,
      }) => {
        /*
         * The counterpart to every assertion above, and the one that fails if the range regresses.
         *
         * The previous range was `entry 15% entry 55%`. An `entry` range is bounded by the
         * element's own height, so a 150px heading block finished its wipe about 110px after its
         * first pixel cleared the bottom edge — the whole animation played out in the bottom sixth
         * of the screen, above the fold of the reader's attention. Nothing was stuck and nothing
         * was clipped, so every other test here passed, and the site was still reported as having
         * no motion at all.
         *
         * Position a heading in the bottom fifth of the viewport and require that it is still
         * mid-wipe there. That is only true if the range ends on `cover`, which scales to the
         * viewport instead of to the element.
         */
        await page.goto("/courses");
        const target = await page.evaluate(() => {
          const el = document.querySelectorAll(".reveal-heading")[2];
          return el ? el.getBoundingClientRect().top + window.scrollY : null;
        });
        expect(target).not.toBeNull();

        /* Put its top ~12% of the way up from the bottom edge: on screen, but nowhere a reader
           is looking yet. */
        await page.evaluate(
          ([top, vh]) => window.scrollTo(0, top! - vh! * 0.88),
          [target, viewport.height] as const,
        );
        await page.waitForTimeout(80);

        const states = await revealStates(page);
        const atEdge = states.filter(
          (s) => s.top > s.viewport * 0.8 && s.top < s.viewport && s.bottom > 0,
        );
        expect(atEdge.length, "expected a heading sitting at the bottom edge").toBeGreaterThan(0);
        expect(
          atEdge.every((s) => s.bottomInset > 0),
          "the reveal had already finished before the heading reached the readable part of the " +
            "screen — the range has regressed to one bounded by the element instead of the viewport",
        ).toBe(true);
      });

      test("a heading already in view at first paint is fully open", async ({ page }) => {
        /* Load the route already scrolled, the way a reload or a restored session does it, so the
           first paint happens with headings mid-screen rather than below the fold. */
        await page.goto("/courses");
        const target = await page.evaluate(() => {
          const el = document.querySelectorAll(".reveal-heading")[2];
          return el ? el.getBoundingClientRect().top + window.scrollY : null;
        });
        expect(target, "expected at least three revealed headings on /courses").not.toBeNull();

        /* Put it a third of the way down the screen: unambiguously being read. */
        await page.evaluate((top) => window.scrollTo(0, top), target! - 200);
        await page.reload();
        await page.waitForTimeout(160);

        expectNoneStuck(await revealStates(page), "/courses reloaded at a scrolled position");
      });
    });
  }
});
