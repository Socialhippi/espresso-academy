import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { allRoutes, isMobileProject } from "./helpers";

/**
 * WCAG 2.2 AA is a non-negotiable in CLAUDE.md, so serious and critical findings fail the build.
 * The axe pass runs on one desktop and one mobile project rather than all four: the rendered DOM
 * is identical between chromium and webkit, and running it four times only slows the suite.
 */
test.describe("axe", () => {
  test.beforeEach(async ({ browserName }) => {
    // The rendered DOM is identical across engines, so running axe on all five projects only
    // makes the suite slower. Chromium desktop and Pixel 7 cover both layouts.
    test.skip(browserName === "webkit", "Covered by the chromium and Pixel 7 projects.");
  });

  for (const route of allRoutes) {
    test(`${route.path} has no serious or critical violations`, async ({ page }) => {
      await page.goto(route.path);

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();

      const blocking = results.violations.filter(
        (violation) => violation.impact === "serious" || violation.impact === "critical",
      );

      const summary = blocking
        .map(
          (violation) =>
            `${violation.id} (${violation.impact}) on ${violation.nodes.length} node(s): ${violation.nodes[0]?.target.join(" ")}`,
        )
        .join("\n");

      expect(blocking, `${route.path}\n${summary}`).toEqual([]);
    });
  }

  test("the mobile sheet is clean while open", async ({ page }, testInfo) => {
    test.skip(!isMobileProject(testInfo), "The sheet is mobile only.");
    await page.goto("/");
    await page.getByRole("button", { name: "Open the menu" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    // The sheet fades in over 200ms. Auditing it mid-transition measures text at partial opacity
    // and reports contrast failures that do not exist once it has settled.
    await page.waitForFunction(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return dialog !== null && getComputedStyle(dialog).opacity === "1";
    });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      // Scoped to the sheet itself. The page behind it is inert and sits under a translucent
      // backdrop; axe measures that washed-out text and reports contrast failures for content the
      // reader cannot reach. The page is audited on its own in the tests above.
      .include('[role="dialog"]')
      .analyze();
    const blocking = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );
    expect(blocking, blocking.map((v) => `${v.id}: ${v.nodes[0]?.failureSummary ?? ""}`).join("\n")).toEqual([]);
  });

  test("an open FAQ answer stays in the DOM when collapsed", async ({ page }) => {
    await page.goto("/faq");
    // hiddenUntilFound keeps the panel mounted, which is what makes the copy crawlable.
    const answer = page.getByText(
      "If you have never worked a machine, start with IBC Junior",
      { exact: false },
    );
    await expect(answer).toHaveCount(1);
  });
});

test.describe("reduced motion", () => {
  test("reveals are instant and nothing animates", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const longest = await page.evaluate(() => {
      let max = 0;
      for (const el of document.querySelectorAll("body *")) {
        const cs = getComputedStyle(el);
        for (const value of [cs.transitionDuration, cs.animationDuration]) {
          for (const part of value.split(",")) {
            const seconds = part.trim().endsWith("ms")
              ? parseFloat(part) / 1000
              : parseFloat(part) || 0;
            if (seconds > max) max = seconds;
          }
        }
      }
      return max;
    });
    expect(longest, "no transition or animation should run under prefers-reduced-motion").toBeLessThan(0.05);
  });
});
