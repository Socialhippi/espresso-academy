import { expect, test } from "@playwright/test";

/**
 * The subset that runs on every push.
 *
 * The full suite is 2069 tests across seven browser projects and takes half an hour on the two-core
 * runner a private repository gets. That is the right thing to run nightly and the wrong thing to
 * wait for before every commit — a gate people learn to ignore stops being a gate.
 *
 * So this is the shortest set of checks that would have caught the failures this project has
 * actually had: a checkout that could not be reached, a bot check nobody could pass, a Studio built
 * without its project id, a page rendering its author's brief, and a robots file that cancelled out
 * the noindex it was paired with. Chromium only, one worker's worth of work, under six minutes
 * including the build.
 *
 * It is not a replacement for the full suite. Anything here that starts catching things the nightly
 * does not is a sign the nightly is missing coverage, not that this file should grow.
 */

const ROUTES = [
  "/",
  "/courses",
  "/courses/italian-barista-course-basic",
  "/calendar",
  "/enquire",
  "/thank-you",
] as const;

test.describe("every smoke route answers", () => {
  for (const path of ROUTES) {
    test(`${path} returns 200 with one h1 and no sideways scroll`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status(), `${path} should return 200`).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path} scrolls sideways by ${overflow}px`).toBeLessThanOrEqual(0);
    });
  }
});

test("the health check says the app can reach its content", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status(), "a deployment that cannot read its courses is down").toBe(200);

  const body = (await response.json()) as {
    ok: boolean;
    content: string;
    flags: Record<string, boolean>;
    warnings?: string[];
  };
  expect(body.ok).toBe(true);
  expect(body.content).toBe("reachable");
  // Not an assertion — the warning is worth seeing in the log of a green run.
  if (body.warnings?.length) console.log("[health] half-configured:", body.warnings.join(" | "));
});

test("robots.txt lets crawlers in and holds the private routes back", async ({ request }) => {
  const body = await (await request.get("/robots.txt")).text();
  // Disallow: / would stop a crawler ever reading the noindex header, which is how a page ends up
  // indexed with no description instead of not indexed at all.
  expect(body, "a blanket disallow defeats the noindex it is paired with").not.toMatch(
    /^Disallow: \/$/m,
  );
  expect(body).toMatch(/^Allow: \/$/m);
  for (const prefix of ["/api/", "/studio", "/book/", "/lp/"]) {
    expect(body, `${prefix} should stay out of the index`).toContain(`Disallow: ${prefix}`);
  }
});

test("a bookable batch can be reached and its checkout form renders", async ({ page }) => {
  // The whole commercial path in one check: the hub offers the course, the course offers the batch,
  // the batch offers a form. Each of those three links has broken separately.
  await page.goto("/courses/italian-barista-course-basic");
  const book = page.getByRole("link", { name: /^(Book this batch|Choose a date)/ }).first();
  await expect(book, "the course with a payable batch is not offering it").toBeVisible();

  await page.goto("/book/instance-e2e-test-batch");
  await page.locator("form[data-hydrated=true]").first().waitFor();
  await expect(page.getByLabel(/Your name/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Pay/ })).toBeVisible();
  await expect(
    page.getByTestId("turnstile"),
    "no Turnstile widget: every booking would be refused",
  ).toBeVisible();
});

test("the enquiry form is interactive and its honeypot is not", async ({ page }) => {
  await page.goto("/enquire");
  await page.locator("form[data-hydrated=true]").first().waitFor();
  await expect(page.getByLabel(/Your name/)).toBeVisible();

  const honeypot = page.locator('input[name="company"]').first();
  await expect(honeypot).toBeAttached();
  await expect(honeypot).toHaveAttribute("tabindex", "-1");
});
