import { expect, test } from "@playwright/test";
import { acceptConsent } from "./helpers";

test.beforeEach(async ({ context, baseURL }) => {
  await acceptConsent(context, baseURL as string);
});

test.describe("course hub filters", () => {
  test("unfiltered, every course is listed", async ({ page }) => {
    await page.goto("/courses");
    await expect(page.getByRole("heading", { level: 3 }).first()).toBeVisible();
    const grid = page.locator("ul > li > article");
    await expect(grid).toHaveCount(8);
  });

  test("?level=foundation narrows the grid and keeps the canonical on /courses", async ({ page }) => {
    await page.goto("/courses?level=foundation");

    const grid = page.locator("ul > li > article");
    await expect(grid).toHaveCount(1);
    await expect(grid.first()).toContainText("Barista Skills, Foundation");

    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(new URL(canonical as string).pathname).toBe("/courses");
    expect(canonical).not.toContain("level=");

    // The chosen chip is marked as current.
    await expect(page.getByRole("link", { name: "Foundation", exact: true })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  test("?area=latte-art narrows the grid", async ({ page }) => {
    await page.goto("/courses?area=latte-art");
    const grid = page.locator("ul > li > article");
    await expect(grid).toHaveCount(1);
    await expect(grid.first()).toContainText("Latte Art");
  });

  test("a combination with no match shows the empty state, not an empty page", async ({ page }) => {
    await page.goto("/courses?level=professional&area=brewing");
    await expect(page.locator("ul > li > article")).toHaveCount(0);
    await expect(page.getByText("Nothing matches that combination yet")).toBeVisible();
    await expect(page.getByRole("link", { name: "Show all courses" })).toBeVisible();
  });

  test("an unknown filter value is ignored rather than emptying the page", async ({ page }) => {
    await page.goto("/courses?level=not-a-level");
    await expect(page.locator("ul > li > article")).toHaveCount(8);
  });
});

test.describe("course page", () => {
  test("the hero button asks about the course when no batch can be booked", async ({ page }) => {
    // A course with no priced batch has nothing to charge for, so its hero asks — and the enquiry
    // form arrives with the course already chosen.
    await page.goto("/courses/sca-barista-skills-foundation");
    await page.getByRole("link", { name: /^Ask about the next batch$/ }).first().click();

    await expect(page).toHaveURL(/\/enquire\?course=sca-barista-skills-foundation/);
    const select = page.getByLabel("Which course (optional)");
    await expect(select).toHaveValue("sca-barista-skills-foundation");
  });

  test("the hero button books when a batch can be booked", async ({ page }) => {
    // The defect this covers: /courses/latte-art has an open priced batch and its hero offered
    // "Reserve a seat", which went to the enquiry form. The only route to a checkout was the Book
    // button in the batch table, most of a page further down.
    await page.goto("/courses/latte-art");
    /*
     * Both wordings are correct and the data decides which: one bookable batch gives "Book this
     * batch" pointing straight at its checkout, more than one gives "Book a batch" pointing at the
     * table so the reader picks. What must never appear on a course with a payable seat is an
     * enquiry link, which is what "Reserve a seat" was.
     */
    const book = page.getByRole("link", { name: /^(Book this batch|Choose a date)/ }).first();
    await expect(book).toBeVisible();
    await expect(book).toHaveAttribute("href", /^(\/book\/|#dates-heading)/);
  });

  test("states what is unknown in one line rather than a row of pills", async ({ page }) => {
    await page.goto("/courses/sca-barista-skills-foundation");

    /*
     * Seven cells each carrying a TBC pill made the unknowns the loudest thing under the H1. One
     * sentence says the same and offers the way to find out. The point of the assertion is that
     * the page still says the fee is unconfirmed — it just says it once, in words.
     */
    await expect(page.getByText("Confirmed on WhatsApp before you pay").first()).toBeVisible();
    await expect(page.getByText("Batch dates are being finalised").first()).toBeVisible();
    await expect(page.getByText("Syllabus being finalised")).toBeVisible();

    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body, "no rupee figure should appear while fees are unpublished").not.toMatch(/₹\s?\d/);
  });

  test("links to the certification, the hub and the next rung", async ({ page }) => {
    await page.goto("/courses/italian-barista-certificate-junior");
    // The header nav is hidden below md, so assert a visible instance exists rather than that the
    // first match in DOM order happens to be the visible one.
    for (const href of [
      "/certifications/italian-barista-certificate",
      "/courses",
      "/courses/italian-barista-certificate-advanced",
    ]) {
      const links = page.locator(`a[href="${href}"]`);
      await expect(links.first()).toHaveCount(1);
      const visible = await links.evaluateAll((nodes) =>
        nodes.some((node) => (node as HTMLElement).offsetParent !== null),
      );
      expect(visible, `${href} should have at least one visible link`).toBe(true);
    }
  });
});

test.describe("calendar", () => {
  /*
   * The calendar has two states and which one it is in depends on the dataset, not on the code.
   * Asserting only the empty one meant this test failed the day a batch first got a date, which is
   * the day it should have been most useful. So it branches: whichever state the data produces,
   * that state has to be complete.
   */
  test("shows either scheduled batches or the alert state, and never a half of each", async ({
    page,
  }) => {
    await page.goto("/calendar");

    const emptyState = page.getByRole("heading", { name: "Batch dates are being finalised" });
    const isEmpty = await emptyState.isVisible().catch(() => false);

    if (isEmpty) {
      // Nothing scheduled: every course gets its own alert, so nobody leaves empty-handed.
      const details = page.locator("details");
      await expect(details).toHaveCount(8);
      await details.first().locator("summary").click();
      await expect(details.first().getByLabel("Mobile number (required)")).toBeVisible();
      return;
    }

    // Something is scheduled: there is a table, and every row offers a way to act on it.
    const rows = page.locator("tbody tr");
    await expect(rows.first()).toBeVisible();

    const actions = page.getByRole("link", { name: /^(Book|Waitlist|Enquire)$/ });
    expect(await actions.count()).toBeGreaterThan(0);

    // And the filters describe the batches that exist rather than every course.
    await expect(page.getByRole("link", { name: "Every course" })).toBeVisible();
  });

  test("a course filter narrows the calendar and keeps the canonical", async ({ page }) => {
    await page.goto("/calendar");
    const isEmpty = await page
      .getByRole("heading", { name: "Batch dates are being finalised" })
      .isVisible()
      .catch(() => false);
    test.skip(isEmpty, "No batch has a date in this dataset, so there is nothing to filter");

    await page.goto("/calendar?course=latte-art");
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical, "a facet must not compete with the page it filters").toMatch(
      /\/calendar$/,
    );
  });
});

test.describe("no invented facts", () => {
  const paths = ["/", "/courses", "/calendar", "/certifications", "/trainers", "/about"];
  for (const path of paths) {
    test(`${path} states no fee, rating or student count`, async ({ page }) => {
      await page.goto(path);
      const body = await page.locator("body").innerText();
      expect(body, "no rupee figure").not.toMatch(/₹\s?\d/);
      expect(body, "no star rating").not.toMatch(/\d(\.\d)?\s*\/\s*5/);
      // Shapes an invented count actually takes. A bare "05 Students" is the numbered section
      // eyebrow sitting next to its label, not a claim.
      expect(body, "no student or graduate count claim").not.toMatch(
        /(\b\d{3,}[\d,]*|\b\d[\d,]*\+)\s*(students|graduates|reviews|placements)\b/i,
      );
      expect(body, "no trained-N claim").not.toMatch(
        /\b(over|more than|trained|taught|placed)\s+\d[\d,]*\s+(students|graduates|baristas|people)\b/i,
      );
      // facts.md sources one named Authorised Trainer, so the site may say the academy has an AST
      // on faculty. A *course* being "SCA certified" is a different claim, it is not sourced, and
      // facts.md still forbids it: alignment to the Coffee Skills Program is not certification.
      expect(body, 'no "SCA certified course" phrasing').not.toMatch(
        /SCA[- ]certified\s+(course|courses|programme?|training|batch)/i,
      );
      expect(body, "no India-first superlative").not.toMatch(
        /India'?s (first|only|best|leading)/i,
      );
    });
  }
});
