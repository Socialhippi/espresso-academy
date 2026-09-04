import { expect, test } from "@playwright/test";
import {
  allRoutes,
  horizontalOverflow,
  isMobileProject,
  readJsonLd,
  routes,
  typesIn,
} from "./helpers";

test.describe("every route", () => {
  for (const route of allRoutes) {
    test(`${route.path} loads, has one h1 and does not overflow`, async ({ page }, testInfo) => {
      const response = await page.goto(route.path);
      expect(response?.status(), `${route.path} should return 200`).toBe(200);

      // The component gallery deliberately renders a second H1 inside the hero specimen.
      const expectedH1s = route.path === "/dev/components" ? 2 : 1;
      await expect(page.locator("h1")).toHaveCount(expectedH1s);

      if (isMobileProject(testInfo)) {
        expect(
          await horizontalOverflow(page),
          `${route.path} overflows horizontally at ${testInfo.project.use.viewport?.width}px`,
        ).toBeLessThanOrEqual(0);
      }
    });
  }

  for (const route of routes) {
    test(`${route.path} carries the sticky bar rule`, async ({ page }, testInfo) => {
      test.skip(!isMobileProject(testInfo), "The sticky bar is mobile only.");

      await page.goto(route.path);
      const bar = page.getByTestId("sticky-bar");

      if (route.stickyBar) {
        await expect(bar, `${route.path} should render the sticky bar`).toHaveCount(1);
        // It reveals itself only once the header has scrolled away.
        await expect(bar).toHaveAttribute("data-visible", "false");
        await page.evaluate(() => window.scrollTo(0, 900));
        await expect(bar).toHaveAttribute("data-visible", "true");
      } else {
        await expect(bar, `${route.path} should not render the sticky bar`).toHaveCount(0);
      }
    });
  }

  for (const route of routes) {
    test(`${route.path} has parseable JSON-LD and correct robots`, async ({ page }) => {
      await page.goto(route.path);

      // readJsonLd throws on malformed JSON, which is the assertion.
      const blocks = await readJsonLd(page);
      expect(blocks.length, `${route.path} should carry JSON-LD`).toBeGreaterThan(0);

      const types = typesIn(blocks);
      expect(types, `${route.path} should carry the site-wide organisation node`).toContain(
        "EducationalOrganization",
      );
      expect(types).toContain("LocalBusiness");

      if (route.breadcrumbs) {
        expect(types, `${route.path} should carry breadcrumbs`).toContain("BreadcrumbList");
        await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toHaveCount(1);
      } else {
        expect(
          types,
          `${route.path} renders no visible trail, so it must not claim one in structured data`,
        ).not.toContain("BreadcrumbList");
      }

      const robots = await page
        .locator('meta[name="robots"]')
        .first()
        .getAttribute("content");
      if (route.index) {
        expect(robots ?? "index").toContain("index");
        expect(robots ?? "").not.toContain("noindex");
      } else {
        expect(robots ?? "").toContain("noindex");
      }
    });
  }
});

test.describe("metadata", () => {
  for (const route of routes.filter((entry) => entry.index)) {
    test(`${route.path} has a canonical, a title and a description`, async ({ page }) => {
      await page.goto(route.path);

      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(canonical, `${route.path} needs a canonical`).toBeTruthy();
      // A filtered hub still canonicalises to the hub, so compare against the route we asked for.
      expect(new URL(canonical as string).pathname).toBe(route.path);

      const title = await page.title();
      expect(title).toContain("Espresso Academy India");
      expect(title.length, `${route.path} title is ${title.length} chars: ${title}`).toBeLessThanOrEqual(65);

      const description = await page
        .locator('meta[name="description"]')
        .getAttribute("content");
      expect(description, `${route.path} needs a description`).toBeTruthy();
      expect((description as string).length).toBeGreaterThanOrEqual(110);
      expect((description as string).length).toBeLessThanOrEqual(165);
    });
  }
});

test.describe("headings", () => {
  for (const route of routes) {
    test(`${route.path} does not skip a heading level`, async ({ page }) => {
      await page.goto(route.path);
      const levels = await page.evaluate(() =>
        Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).map((el) =>
          Number(el.tagName.slice(1)),
        ),
      );
      let previous = 0;
      for (const level of levels) {
        if (previous !== 0) {
          expect(level, `${route.path} jumps from h${previous} to h${level}`).toBeLessThanOrEqual(
            previous + 1,
          );
        }
        previous = level;
      }
    });
  }
});
