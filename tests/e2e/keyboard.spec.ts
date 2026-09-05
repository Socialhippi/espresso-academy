import { expect, test, type Page } from "@playwright/test";
import { acceptConsent } from "./helpers";

/**
 * Keyboard-only walkthroughs of the two paths that take money and personal data.
 *
 * Written as tests rather than done once by hand, because focus order is the kind of thing that
 * breaks when somebody reorders two divs and nobody notices for a month. What cannot be automated
 * is inside Razorpay's iframe, which is a third-party origin; that handoff was walked by hand and
 * the screenshots are in docs/screens/razorpay-*.png.
 */

const TEST_INSTANCE = "instance-e2e-test-batch";

/**
 * WebKit's Tab key visits text fields and nothing else — not links, not buttons, not checkboxes —
 * unless "Press Tab to highlight each item on a webpage" is switched on, which is off by default in
 * Safari and in Playwright's WebKit. That is a browser preference, not a property of this site.
 *
 * So the two engines are tested for what each actually does. On Chromium: everything is reachable
 * by Tab, in reading order. On WebKit: the fields are reachable by Tab, and the form is submittable
 * with Enter from inside a field, which is the path a Safari user on the default setting has.
 * Asserting full tab order on WebKit would be asserting a fiction, and skipping WebKit entirely
 * would leave the engine two thirds of this audience uses untested.
 */
function tabsToEverything(projectName: string): boolean {
  return !["webkit", "iPhone 14", "iPad Mini"].includes(projectName);
}

/** The accessible name of whatever currently has focus. */
async function focused(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el) return "none";
    const label =
      el.getAttribute("aria-label") ??
      (el.id ? document.querySelector(`label[for="${el.id}"]`)?.textContent : null) ??
      el.textContent ??
      "";
    return `${el.tagName.toLowerCase()}:${label.trim().slice(0, 45)}`;
  });
}

/** Tab until the predicate matches, so the assertion is "reachable", not "reachable in N tabs". */
async function tabUntil(page: Page, matches: (name: string) => boolean, limit = 45): Promise<string> {
  for (let i = 0; i < limit; i += 1) {
    await page.keyboard.press("Tab");
    const name = await focused(page);
    if (matches(name)) return name;
  }
  throw new Error(`Nothing matched within ${limit} tabs; last focus was ${await focused(page)}`);
}

test.describe("keyboard: the checkout", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await acceptConsent(context, baseURL as string);
  });

  test("every field and the Pay button are reachable, in reading order", async ({
    page,
  }, testInfo) => {
    await page.goto(`/book/${TEST_INSTANCE}`);
    await page.locator("form[data-hydrated=true]").first().waitFor();

    /*
     * No click first. Clicking at the top-left of the document lands on the skip link's own box,
     * which focuses it, so the first Tab then moves past it and the assertion below fails on a
     * site that is behaving correctly. After a navigation, focus is already at the document start.
     */
    if (tabsToEverything(testInfo.project.name)) {
      // The skip link is first in the DOM, per .claude/rules/a11y.md.
      await page.keyboard.press("Tab");
      expect(await focused(page)).toContain("Skip to main content");
    }

    // Every engine: the three fields follow each other in the order they are read.
    await page.getByLabel(/Your name/).focus();
    const order: string[] = [await focused(page)];
    for (const field of [/Mobile number/, /Email/]) {
      order.push(await tabUntil(page, (name) => field.test(name)));
    }
    expect(order).toHaveLength(3);

    if (tabsToEverything(testInfo.project.name)) {
      // The consent checkbox and the submit are reachable after the fields.
      await tabUntil(page, (name) => /academy may contact me/i.test(name));
      await tabUntil(page, (name) => /Pay/.test(name));
    }
  });

  test("a keyboard submit with an empty form moves focus to the first error", async ({
    page,
  }, testInfo) => {
    await page.goto(`/book/${TEST_INSTANCE}`);
    await page.locator("form[data-hydrated=true]").first().waitFor();

    if (tabsToEverything(testInfo.project.name)) {
      await page.getByLabel(/Your name/).focus();
      await tabUntil(page, (name) => /Pay/.test(name));
      await page.keyboard.press("Enter");
    } else {
      // Safari's default keyboard path: Enter from inside a text field submits the form.
      await page.getByLabel(/Mobile number/).focus();
      await page.keyboard.press("Enter");
    }

    await expect(page.getByText("Enter your name")).toBeVisible();
    // Focus has to move to the problem, or a screen-reader user is told nothing useful.
    expect(await focused(page)).toContain("Your name");
  });

  test("the visible focus ring is never removed", async ({ page }) => {
    await page.goto(`/book/${TEST_INSTANCE}`);
    await page.locator("form[data-hydrated=true]").first().waitFor();

    await page.getByLabel(/Your name/).focus();
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const style = getComputedStyle(el);
      return { width: style.outlineWidth, style: style.outlineStyle, color: style.outlineColor };
    });

    expect(outline.style, "a focused control must have a visible outline").not.toBe("none");
    expect(parseFloat(outline.width), "the ring is 2px per design.md").toBeGreaterThanOrEqual(2);
  });
});

test.describe("keyboard: the enquiry form", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await acceptConsent(context, baseURL as string);
  });

  test("the whole form is operable from the keyboard and reports its errors", async ({
    page,
  }, testInfo) => {
    await page.goto("/enquire");
    await page.locator("form[data-hydrated=true]").first().waitFor();

    await page.getByLabel("Your name (required)").focus();
    await page.keyboard.type("Keyboard Person");

    await tabUntil(page, (name) => /Mobile number/.test(name));
    await page.keyboard.type("12345");

    if (tabsToEverything(testInfo.project.name)) {
      await tabUntil(page, (name) => /academy may contact me/i.test(name));
      await page.keyboard.press("Space");
      await tabUntil(page, (name) => /Send my enquiry/.test(name));
      await page.keyboard.press("Enter");
    } else {
      // Safari: the checkbox and the submit are not in the Tab order, so the form is submitted
      // with Enter from the field. The phone error is what this test is about either way.
      await page.keyboard.press("Enter");
    }

    await expect(page.getByText(/10-digit Indian mobile number/)).toBeVisible();
    expect(await focused(page), "focus moves to the field that is wrong").toContain(
      "Mobile number",
    );
  });

  test("the error is announced, not only shown", async ({ page }) => {
    await page.goto("/enquire");
    await page.locator("form[data-hydrated=true]").first().waitFor();

    await page.getByLabel("Mobile number (required)").fill("123");
    await page.getByLabel("Your name (required)").click();

    const field = page.getByLabel("Mobile number (required)");
    await expect(field).toHaveAttribute("aria-invalid", "true");

    // The message has to be wired to the field, or it is invisible to a screen reader.
    const describedBy = await field.getAttribute("aria-describedby");
    expect(describedBy, "the error must be referenced by aria-describedby").toBeTruthy();
    // Resolved in the page: `CSS.escape` is a browser API and this file runs in Node.
    const described = await page.evaluate((raw) => {
      return (raw ?? "")
        .split(/\s+/)
        .filter(Boolean)
        .map((id) => document.getElementById(id)?.textContent ?? "")
        .join(" ");
    }, describedBy);
    expect(described).toMatch(/10-digit/);
  });
});

test.describe("keyboard: the mobile sheet", () => {
  test("closes on Escape and returns focus to the button that opened it", async ({
    page,
  }, testInfo) => {
    test.skip(
      !["Pixel 7", "iPhone 14"].includes(testInfo.project.name),
      "The sheet only exists below the nav breakpoint",
    );

    await page.goto("/");
    const trigger = page.getByRole("button", { name: "Open the menu" });
    await trigger.click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();

    // Focus restored to the trigger, or a keyboard user is dropped at the top of the document.
    expect(await focused(page)).toContain("Open the menu");
  });
});
