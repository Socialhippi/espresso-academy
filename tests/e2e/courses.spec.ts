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
  "35,600", // IBC Basic standard fee, ex-GST
  "42,008", // and the same with GST at 18%
  "26,700", // IBC Basic while the 55th-batch offer runs, ex-GST
  "31,506", // and the same with GST
  "26,506", // what is left after the advance on the IBC Basic
  "30,000", // either Advanced course, ex-GST
  "35,400", // and the same with GST
  "30,400", // what is left after the advance on either Advanced course
  "5,000", // the advance that confirms a seat, on any of the three
];

function unknownRupeeFigures(body: string): string[] {
  /*
   * `[\d,]*\d`, not `[\d,]+`: the greedy version swallows the comma after a figure in a sentence,
   * so "₹26,506 incl. GST, and" yielded "26,506," and read as a figure nobody has heard of. The
   * allow-list would then have failed on true copy, which is the worst kind of red.
   */
  return [...body.matchAll(/₹\s?([\d,]*\d)/g)]
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
  test("the priced Roasting batch offers a checkout, not an enquiry", async ({ page }) => {
    /*
     * This used to assert the opposite, and correctly: IBC Advanced Roasting had a dated batch and
     * no fee, so the hero asked about it. The client priced it at ₹30,000 + GST on 8 September and
     * asked for the 15 to 16 September batch to be bookable, so the hero has to have moved with
     * the fee. `courseCta`'s enquire-batch branch still exists for an unpriced dated batch and is
     * covered in tests/unit/course-cta.spec.ts, which does not need a dataset to exercise it.
     */
    await page.goto("/courses/ibc-advanced-roasting");

    const book = page.getByRole("link", { name: /^(Book this batch|Choose a date)/ }).first();
    await expect(book).toBeVisible();
    await expect(book).toHaveAttribute("href", /^(\/book\/|#dates-heading)/);

    await expect(
      page.getByRole("link", { name: /^Ask about this batch$/ }),
      "a priced, open, dated batch must not be offering an enquiry as its primary action",
    ).toHaveCount(0);
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

  test("every fee is stated twice: before GST and including it", async ({ page }) => {
    /*
     * The client quotes ex-GST and the student pays gross, so both have to be on the page and
     * they have to agree. ₹30,000 + 18% is ₹35,400; a page showing one without the other, or the
     * wrong pair, is the failure that costs the academy an argument at the counter.
     */
    await page.goto("/courses/ibc-advanced-roasting");
    const body = await page.locator("body").innerText();

    expect(body).toContain("₹30,000");
    expect(body).toContain("₹35,400");
    expect(
      unknownRupeeFigures(body),
      "every rupee figure has to come from content/facts.md or be arithmetic on one",
    ).toEqual([]);
  });

  test("the offer shows the discounted fee, the standard fee and the reason", async ({ page }) => {
    await page.goto(IBC_BASIC);
    const body = await page.locator("body").innerText();

    expect(body, "the charged fee").toContain("₹26,700");
    expect(body, "and the same figure with GST").toContain("₹31,506");
    expect(body, "the standard fee it is struck through against").toContain("₹35,600");
    /* A crossed-out number with no reason beside it is a sales trick, and .claude/rules/design.md
       says so. The reason is what makes it a fact.
       Case-insensitive: the chip is a `type-label`, which design.md sets in uppercase, and
       `innerText` returns what the browser rendered rather than what the source said. */
    expect(body.toLowerCase(), "the reason the price is lower").toContain("25% off");
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

test.describe("retired URLs", () => {
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
    /*
     * Three trainer profiles, retired on 8 September 2026 when the client confirmed none of the
     * three is part of the academy's team. Both the old website and the Florence authorised
     * trainer list carried these people, and both were indexed, so somebody has the URLs. They go
     * to the trainers page: the question they arrived with still has an answer.
     */
    ["/trainers/akanksha-gupta", "/trainers"],
    ["/trainers/sowmya-r", "/trainers"],
    ["/trainers/nirupam-ranjan", "/trainers"],
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
      expect(body, 'no "SCA certified course" phrasing').not.toMatch(
        /SCA[- ]certified\s+(course|courses|programme?|training|batch)/i,
      );
      /*
       * The AST claim is gone with the trainer it rested on. It was sourced to one named trainer
       * in the SCA's public directory, and on 8 September 2026 the client confirmed she is not
       * part of the academy's team. With no Authorised Trainer on faculty there is nobody who
       * could assess an SCA module here, so neither claim may appear.
       */
      /*
       * Narrow on purpose. "authorised trainers" appears in the client's own faculty description
       * and "Authorised trainer" is Nageswara Rao K's own credential, both sanctioned by facts.md
       * and both meaning authorised by Espresso Academy Florence. What may not appear is the SCA
       * reading of it, which is the claim that rested on a trainer who is not on the team.
       */
      expect(body, "no SCA Authorised Trainer claim").not.toMatch(
        /SCA[- ]Authorised Trainer|Authorised Trainer \(AST\)|AST on faculty/i,
      );
      expect(body, "no claim that SCA modules are assessed here").not.toMatch(
        /assessed\s+(SCA\s+)?modules?\s+(run|are available)/i,
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
