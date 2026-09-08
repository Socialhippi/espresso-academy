import { expect, test } from "@playwright/test";
import { acceptConsent } from "./helpers";

/** The whole catalogue, after revision 2 of content/facts.md. */
const COURSE_COUNT = 3;
const IBC_BASIC = "/courses/italian-barista-course-basic";

/**
 * Every rupee figure the site is allowed to print, from content/facts.md.
 *
 * The old assertion was "no rupee figure anywhere", which held only while the client had given no
 * fee at all. Revision 2 gives one, so a blanket ban would now fail on a true statement. An
 * allow-list is the stronger test anyway: it fails on an invented number rather than on any
 * number, which is the thing the rule is actually about.
 */
const ALLOWED_RUPEE_FIGURES = [
  "35,600", // IBC Basic list price
  "26,700", // IBC Basic after the 55th-batch offer
  "21,700", // the balance due at the academy
  "5,000", // the advance that confirms a seat
];

function unknownRupeeFigures(body: string): string[] {
  return [...body.matchAll(/₹\s?([\d,]+)/g)]
    .map((match) => match[1] as string)
    .filter((figure) => !ALLOWED_RUPEE_FIGURES.includes(figure));
}

test.beforeEach(async ({ context, baseURL }) => {
  await acceptConsent(context, baseURL as string);
});

test.describe("course hub", () => {
  test("unfiltered, every course is listed", async ({ page }) => {
    await page.goto("/courses");
    await expect(page.getByRole("heading", { level: 3 }).first()).toBeVisible();
    const grid = page.locator("ul > li > article");
    await expect(grid).toHaveCount(COURSE_COUNT);
  });

  test("?level=basic narrows the grid and keeps the canonical on /courses", async ({ page }) => {
    await page.goto("/courses?level=basic");

    const grid = page.locator("ul > li > article");
    await expect(grid).toHaveCount(1);
    await expect(grid.first()).toContainText("Italian Barista Course (IBC), Basic");

    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(new URL(canonical as string).pathname).toBe("/courses");
    expect(canonical).not.toContain("level=");

    /* The chip bar went with the eight-course catalogue. A narrowed view still has to say it is
       narrowed and offer the way back, or a reader who arrived from the ladder is stuck. */
    await expect(page.getByRole("link", { name: `Show all ${COURSE_COUNT}` })).toBeVisible();
  });

  test("?area=roasting-cupping narrows the grid", async ({ page }) => {
    await page.goto("/courses?area=roasting-cupping");
    const grid = page.locator("ul > li > article");
    await expect(grid).toHaveCount(1);
    await expect(grid.first()).toContainText("IBC Advanced Roasting");
  });

  test("a combination with no match shows the empty state, not an empty page", async ({ page }) => {
    // Basic is a barista-skills course, so pairing it with the roasting area matches nothing.
    await page.goto("/courses?level=basic&area=roasting-cupping");
    await expect(page.locator("ul > li > article")).toHaveCount(0);
    await expect(page.getByText("Nothing matches that combination yet")).toBeVisible();
    await expect(page.getByRole("link", { name: "Show all courses" })).toBeVisible();
  });

  test("an unknown filter value is ignored rather than emptying the page", async ({ page }) => {
    await page.goto("/courses?level=not-a-level");
    await expect(page.locator("ul > li > article")).toHaveCount(COURSE_COUNT);
  });
});

test.describe("course page", () => {
  test("the hero asks about the batch when the batch has no fee", async ({ page }) => {
    /*
     * IBC Advanced Roasting has a dated batch and no fee: facts.md gives 15 and 16 September but
     * no figure. There is nothing to charge, so the hero asks about that batch rather than
     * offering a checkout, and it names the batch rather than the next one.
     */
    await page.goto("/courses/ibc-advanced-roasting");
    await page.getByRole("link", { name: /^Ask about this batch$/ }).first().click();

    await expect(page).toHaveURL(/\/enquire\?course=ibc-advanced-roasting/);
    const select = page.getByLabel("Which course (optional)");
    await expect(select).toHaveValue("ibc-advanced-roasting");
  });

  test("the hero button books when a batch can be booked", async ({ page }) => {
    // The defect this covers: a course with an open priced batch offered "Reserve a seat", which
    // went to the enquiry form. The only route to a checkout was the Book button in the batch
    // table, most of a page further down. IBC Advanced Barista carries the seeded ₹1 test batch.
    await page.goto("/courses/ibc-advanced-barista");
    /*
     * Both wordings are correct and the data decides which: one bookable batch gives "Book this
     * batch" pointing straight at its checkout, more than one gives "Choose a date" pointing at
     * the table so the reader picks. What must never appear on a course with a payable seat is an
     * enquiry link, which is what "Reserve a seat" was.
     */
    const book = page.getByRole("link", { name: /^(Book this batch|Choose a date)/ }).first();
    await expect(book).toBeVisible();
    await expect(book).toHaveAttribute("href", /^(\/book\/|#dates-heading)/);
  });

  test("an unpriced course says the fee is unconfirmed and invents no figure", async ({ page }) => {
    await page.goto("/courses/ibc-advanced-roasting");

    await expect(page.getByText("The academy confirms the fee for this batch.")).toBeVisible();

    const body = await page.locator("body").innerText();
    expect(
      unknownRupeeFigures(body),
      "an unpriced course must print no figure that content/facts.md does not give",
    ).toEqual([]);
  });

  test("the syllabus renders a day at a time, and each day is addressable", async ({ page }) => {
    /*
     * /courses/latte-art and /courses/brewing were retired when revision 2 folded them into the
     * IBC, and they redirect to #day-4 and #day-2 here. If the anchors stop existing the redirects
     * silently degrade to "somewhere on a long page", which is the failure this catches.
     */
    await page.goto(IBC_BASIC);
    for (const [day, title] of [
      [1, "Roasting and Cupping"],
      [2, "Brewing Techniques"],
      [3, "Basic Barista Training"],
      [4, "Latte Art"],
    ] as const) {
      const block = page.locator(`#day-${day}`);
      await expect(block, `day ${day} should have an anchor`).toHaveCount(1);
      await expect(block).toContainText(title);
    }
  });

  test("links to the certification, the hub and the next rung", async ({ page }) => {
    await page.goto(IBC_BASIC);
    // The header nav is hidden below md, so assert a visible instance exists rather than that the
    // first match in DOM order happens to be the visible one.
    for (const href of [
      "/certifications/italian-barista-certificate",
      "/courses",
      "/courses/ibc-advanced-barista",
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

test.describe("retired course URLs", () => {
  /*
   * Latte Art, Brewing, Roasting and Cupping and the three Barista Skills courses stopped being
   * courses in revision 2. Someone who searched for one of them, or who has an old link, must land
   * on the day that now teaches it rather than on a 404.
   */
  const retired: [string, string][] = [
    ["/courses/roasting-and-cupping", `${IBC_BASIC}#day-1`],
    ["/courses/brewing", `${IBC_BASIC}#day-2`],
    ["/courses/sca-barista-skills-foundation", `${IBC_BASIC}#day-3`],
    ["/courses/sca-barista-skills-intermediate", `${IBC_BASIC}#day-3`],
    ["/courses/sca-barista-skills-professional", `${IBC_BASIC}#day-3`],
    ["/courses/latte-art", `${IBC_BASIC}#day-4`],
    ["/courses/italian-barista-certificate-junior", IBC_BASIC],
    ["/courses/italian-barista-certificate-advanced", "/courses/ibc-advanced-barista"],
  ];

  for (const [from, to] of retired) {
    test(`${from} redirects to ${to}`, async ({ request }) => {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status(), `${from} should be a permanent redirect`).toBe(301);
      expect(response.headers().location).toBe(to);
    });
  }
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
      await expect(details).toHaveCount(COURSE_COUNT);
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

    await page.goto("/calendar?course=italian-barista-course-basic");
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical, "a facet must not compete with the page it filters").toMatch(
      /\/calendar$/,
    );
  });
});

test.describe("no invented facts", () => {
  const paths = ["/", "/courses", IBC_BASIC, "/calendar", "/certifications", "/trainers", "/about"];
  for (const path of paths) {
    test(`${path} states no unsourced fee, rating or student count`, async ({ page }) => {
      await page.goto(path);
      const body = await page.locator("body").innerText();
      expect(
        unknownRupeeFigures(body),
        "every rupee figure on the site has to come from content/facts.md",
      ).toEqual([]);
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
      // facts.md still forbids it.
      expect(body, 'no "SCA certified course" phrasing').not.toMatch(
        /SCA[- ]certified\s+(course|courses|programme?|training|batch)/i,
      );
      expect(body, "no India-first superlative").not.toMatch(
        /India'?s (first|only|best|leading)/i,
      );
      /* facts.md forbids "globally accepted" and "globally recognised" as the academy's own
         claim: the reach belongs to the issuer and has to be attributed to it. */
      expect(body, "no global-recognition claim").not.toMatch(
        /globally (accepted|recognised|recognized)/i,
      );
    });
  }
});

/**
 * A batch link has to carry the batch's document id, not its date.
 *
 * The enquiry schema keeps `instanceId` apart from the human `batch` label, and only the id makes
 * the Sanity reference that puts a person on that batch's roster in the Studio. Two links to the
 * same form disagreed about which to send: `courseCta` passed an id, the batch table passed a
 * formatted date. The date matched no option in the form's select, so it preselected nothing and
 * joined to no batch — a waitlist request that looked filed and reached no roster.
 */
test.describe("a batch link identifies its batch", () => {
  test("every enquiry link from a batch row passes an instance id", async ({ page }) => {
    await page.goto("/courses/ibc-advanced-roasting");

    const links = page.locator('a[href*="/enquire?course="][href*="batch="]');
    const count = await links.count();
    test.skip(count === 0, "No batch on this course links to the enquiry form in this dataset");

    for (let i = 0; i < count; i++) {
      const href = (await links.nth(i).getAttribute("href")) ?? "";
      const batch = new URL(href, "http://localhost").searchParams.get("batch") ?? "";
      expect(batch, `${href} should carry a batch id`).not.toBe("");
      expect(
        batch,
        `${href} passes a date where the form's options are keyed by document id`,
      ).toMatch(/^instance-/);
    }
  });

  test("the enquiry form preselects the batch the link named", async ({ page }) => {
    await page.goto("/courses/ibc-advanced-roasting");
    const link = page.locator('a[href*="/enquire?course="][href*="batch="]:visible').first();
    const count = await link.count();
    test.skip(count === 0, "No batch on this course links to the enquiry form in this dataset");

    const href = (await link.getAttribute("href")) ?? "";
    const expected = new URL(href, "http://localhost").searchParams.get("batch");
    await link.click();

    await page.locator("form[data-hydrated=true]").first().waitFor();
    await expect(page.getByLabel("Which batch")).toHaveValue(expected ?? "");
  });
});
