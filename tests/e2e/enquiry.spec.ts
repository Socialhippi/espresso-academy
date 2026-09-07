import { expect, test } from "@playwright/test";
import { acceptConsent, waitForHydratedForm } from "./helpers";

const WHATSAPP_URL = "https://wa.me/919448106100?text=Hi";

test.beforeEach(async ({ context, baseURL }) => {
  await acceptConsent(context, baseURL as string);
});

test.describe("enquiry form", () => {
  test("an invalid phone shows an error and moves focus to the field", async ({ page }) => {
    await page.goto("/enquire");
    await waitForHydratedForm(page);

    await page.getByLabel("Your name (required)").fill("Test Person");
    await page.getByLabel("Mobile number (required)").fill("123");
    await page.getByLabel(/The academy may contact me/).check();
    await page.getByRole("button", { name: "Send my enquiry" }).click();

    const phone = page.getByLabel("Mobile number (required)");
    await expect(page.getByText("Enter a 10-digit Indian mobile number, without +91")).toBeVisible();
    await expect(phone).toBeFocused();
    await expect(phone).toHaveAttribute("aria-invalid", "true");
  });

  test("an unticked consent box blocks the submit and moves focus to it", async ({ page }) => {
    await page.goto("/enquire");
    await waitForHydratedForm(page);
    await page.getByLabel("Your name (required)").fill("Test Person");
    await page.getByLabel("Mobile number (required)").fill("9876543210");
    await page.getByRole("button", { name: "Send my enquiry" }).click();

    await expect(page.getByText("Tick the box so we can reply to you")).toBeVisible();
    await expect(page.getByLabel(/The academy may contact me/)).toBeFocused();
  });

  test("a valid submit replaces the form with the success state", async ({ page }) => {
    await page.route("**/api/enquiry", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, delivery: "email" }),
      });
    });

    await page.goto("/enquire");
    await waitForHydratedForm(page);
    await page.getByLabel("Your name (required)").fill("Test Person");
    await page.getByLabel("Mobile number (required)").fill("9876543210");
    await page.getByLabel(/The academy may contact me/).check();
    // The route handler rejects anything faster than 2 seconds on the form.
    await page.waitForTimeout(2100);
    await page.getByRole("button", { name: "Send my enquiry" }).click();

    await expect(page.getByText("We have your enquiry")).toBeVisible();
    await expect(page.getByRole("link", { name: "Continue on WhatsApp" })).toHaveAttribute(
      "href",
      /wa\.me/,
    );
    await expect(page.getByRole("button", { name: "Send my enquiry" })).toHaveCount(0);
  });

  test("the whatsapp fallback is offered when no email can be sent", async ({ page }) => {
    await page.route("**/api/enquiry", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          delivery: "whatsapp",
          fallback: "whatsapp",
          url: WHATSAPP_URL,
          whatsappUrl: WHATSAPP_URL,
        }),
      });
    });

    await page.goto("/enquire?course=latte-art");
    await waitForHydratedForm(page);
    await page.getByLabel("Your name (required)").fill("Test Person");
    await page.getByLabel("Mobile number (required)").fill("9876543210");
    await page.getByLabel(/The academy may contact me/).check();
    await page.waitForTimeout(2100);
    await page.getByRole("button", { name: "Send my enquiry" }).click();

    await expect(page.getByText("We have your enquiry")).toBeVisible();
    await expect(page.getByText(/fastest reply is on WhatsApp/)).toBeVisible();
    const link = page.getByRole("link", { name: "Continue on WhatsApp" });
    await expect(link).toHaveAttribute("href", /Latte%20Art/);
  });

  test("a server failure shows the WhatsApp handoff instead of a dead end", async ({ page }) => {
    await page.route("**/api/enquiry", async (route) => {
      await route.fulfill({ status: 500, contentType: "text/plain", body: "boom" });
    });

    await page.goto("/enquire");
    await waitForHydratedForm(page);
    await page.getByLabel("Your name (required)").fill("Test Person");
    await page.getByLabel("Mobile number (required)").fill("9876543210");
    await page.getByLabel(/The academy may contact me/).check();
    await page.waitForTimeout(2100);
    await page.getByRole("button", { name: "Send my enquiry" }).click();

    // Next renders its own role="alert" route announcer, so scope to the form's alert.
    const alert = page.locator("form [role=alert]");
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("We could not send that just now");
    await expect(alert.getByRole("link", { name: "Ask on WhatsApp", exact: true })).toBeVisible();
  });

  test("the query string pre-fills the course", async ({ page }) => {
    await page.goto("/enquire?course=brewing");
    await expect(page.getByLabel("Which course (optional)")).toHaveValue("brewing");
  });
});

test.describe("the enquiry API", () => {
  test("rejects a bad phone with a field error", async ({ request }) => {
    const response = await request.post("/api/enquiry", {
      data: { type: "student", name: "Test", phone: "123", consent: true, elapsedMs: 5000 },
    });
    expect(response.status()).toBe(400);
    const body = (await response.json()) as { ok: boolean; errors: Record<string, string> };
    expect(body.ok).toBe(false);
    expect(body.errors.phone).toContain("10-digit");
  });

  test("drops a filled honeypot silently with a 200", async ({ request }) => {
    const response = await request.post("/api/enquiry", {
      data: {
        type: "student",
        name: "Bot",
        phone: "9876543210",
        consent: true,
        company: "spam",
        elapsedMs: 5000,
      },
    });
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { ok: boolean };
    // A bot must not be able to tell the honeypot from a real success.
    expect(body.ok).toBe(true);
  });

  test("drops a submission faster than two seconds", async ({ request }) => {
    const response = await request.post("/api/enquiry", {
      data: { type: "student", name: "Fast", phone: "9876543210", consent: true, elapsedMs: 100 },
    });
    expect(response.status()).toBe(200);
  });

  test("refuses anything that is not a POST", async ({ request }) => {
    const response = await request.get("/api/enquiry");
    expect(response.status()).toBe(405);
  });
});

test.describe("waitlist", () => {
  test("the inline form validates the phone before sending", async ({ page }) => {
    await page.goto("/courses/brewing");
    await waitForHydratedForm(page);
    const form = page.locator("form").filter({ hasText: "Tell me when dates are set" }).first();
    await form.getByLabel("Your name (required)").fill("Test Person");
    await form.getByLabel("Mobile number (required)").fill("12345");
    const submit = form.getByRole("button", { name: "Tell me when dates are set" });
    await submit.scrollIntoViewIfNeeded();
    await submit.click();

    await expect(form.getByText("Enter a 10-digit Indian mobile number, without +91")).toBeVisible();
  });
});

/**
 * The honeypot has to stay invisible to people and reachable only by a script.
 *
 * Four properties, and losing any one of them turns a bot trap into a trap for a real customer: a
 * visible field somebody fills in and gets silently dropped for, a field a screen reader reads out
 * as "Company", a field that catches a Tab on the way to the submit button, or a field a browser's
 * autofill puts a company name into on their behalf. The server drops any submission that carries
 * it, so all four are the difference between catching bots and losing leads.
 */
test.describe("the honeypot is invisible and untabbable", () => {
  for (const route of ["/enquire", "/contact", "/for-cafes"]) {
    test(`${route} hides its honeypot from people`, async ({ page }) => {
      await page.goto(route);
      await page.locator("form[data-hydrated=true]").first().waitFor();

      const honeypot = page.locator('input[name="company"]').first();
      await expect(honeypot).toBeAttached();

      /*
       * What makes this field invisible is its `sr-only` wrapper, not the field: the input keeps a
       * perfectly ordinary 186x26 layout box and the wrapper clips it to 1px with overflow hidden.
       * So the wrapper is what has to be measured, and `toBeHidden()` is no use either — it is a
       * 1px box, not display:none, deliberately, because a bot reading the DOM should still find
       * it. This walks to the aria-hidden ancestor and checks that *it* is too small to see or tap.
       */
      const wrapper = await honeypot.evaluate((element) => {
        let node: HTMLElement | null = element.parentElement;
        while (node) {
          if (node.getAttribute("aria-hidden") === "true") {
            const rect = node.getBoundingClientRect();
            return { found: true, area: rect.width * rect.height };
          }
          node = node.parentElement;
        }
        return { found: false, area: Number.POSITIVE_INFINITY };
      });

      expect(wrapper.found, "the honeypot is not inside an aria-hidden container").toBe(true);
      expect(
        wrapper.area,
        "a filled honeypot is dropped silently, so nobody may see or tap it",
      ).toBeLessThanOrEqual(4);
      await expect(honeypot).toHaveAttribute("tabindex", "-1");
      await expect(honeypot).toHaveAttribute("autocomplete", "off");


    });
  }
});
