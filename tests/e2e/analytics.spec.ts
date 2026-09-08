import { expect, test, type Page } from "@playwright/test";
import { acceptConsent, waitForHydratedForm } from "./helpers";

/**
 * The dataLayer, asserted as a sequence rather than as a pile of events.
 *
 * What matters is not that `generate_lead` exists somewhere; it is that it exists *after* a
 * form_submit, on the journey a real person takes, carrying the parameters a report groups by. A
 * funnel that fires every event on every page is worse than no funnel.
 */

interface LayerEvent {
  event?: string;
  [key: string]: unknown;
}

/**
 * Every event pushed so far, in order.
 *
 * Serialised through JSON on the way out of the page: the real `dataLayer` also holds `arguments`
 * objects from the gtag consent commands, which do not survive Playwright's structured clone and
 * are not events anyway. `consentCommands` below reads those separately.
 */
async function readLayer(page: Page): Promise<LayerEvent[]> {
  return page.evaluate(() =>
    JSON.parse(
      JSON.stringify((window.dataLayer ?? []).filter((entry) => "event" in entry)),
    ) as Record<string, unknown>[],
  );
}

async function eventNames(page: Page): Promise<string[]> {
  return (await readLayer(page)).map((entry) => String(entry.event));
}

test.describe("consent gates the third-party scripts", () => {
  test("nothing from Google or Meta loads before the banner is answered", async ({ page }) => {
    const thirdParty: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (/googletagmanager\.com|connect\.facebook\.net|google-analytics\.com/.test(url)) {
        thirdParty.push(url);
      }
    });

    await page.goto("/");
    /*
     * Scroll, so the interaction gate is open and only the consent gate can be holding the scripts
     * back. `window.scrollTo` rather than `mouse.wheel`: mobile WebKit does not support a wheel
     * event, and this test has to run on the two phone projects most of all, since those are the
     * two thirds of the audience.
     */
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(1500);

    expect(thirdParty, "no measurement script may load before consent").toEqual([]);
  });

  test("consent mode defaults to denied before anything is answered", async ({ page }) => {
    await page.goto("/");
    const consentCommands = await page.evaluate(() =>
      (window.dataLayer ?? [])
        .map((entry) => (Array.isArray(entry) ? entry : Object.values(entry as object)))
        .filter((entry) => entry[0] === "consent"),
    );
    expect(consentCommands.length, "a consent default must be set in the head").toBeGreaterThan(0);

    const defaults = consentCommands.find((entry) => entry[1] === "default");
    expect(defaults?.[2]).toMatchObject({
      ad_storage: "denied",
      analytics_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  });

  test("answering the banner records the choice as an event", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "That is fine" }).click();

    await expect.poll(async () => await eventNames(page)).toContain("consent_update");

    const layer = await readLayer(page);
    const consent = layer.find((entry) => entry.event === "consent_update");
    expect(consent, "the choice must be reportable, not only actionable").toBeTruthy();
    expect(consent?.consent_analytics).toBe(true);
  });
});

test.describe("journey 1: course to enquiry", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await acceptConsent(context, baseURL as string);
  });

  test("pushes the funnel in order, with the course on every step", async ({ page }) => {
    await page.route("**/api/enquiry", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, delivery: "email" }),
      });
    });

    await page.goto("/courses/italian-barista-course-basic");

    /*
     * Polled. `page_view` is pushed from an effect after hydration, and `goto` resolves on load,
     * which is earlier: reading once was a flake on webkit and on iPad Mini. Every assertion on an
     * effect-driven push in this file is polled for the same reason.
     */
    await expect
      .poll(async () => await eventNames(page))
      .toEqual(expect.arrayContaining(["page_view", "course_view"]));

    const onCourse = await readLayer(page);
    const view = onCourse.find((entry) => entry.event === "page_view");
    expect(view?.page_type).toBe("course");
    expect(view?.course_id).toBe("italian-barista-course-basic");

    await page.goto("/enquire?course=italian-barista-course-basic");
    await waitForHydratedForm(page);

    await page.getByLabel("Your name (required)").fill("Test Person");
    /*
     * Polled, not read once. `form_start` is pushed from a React focus handler, and on WebKit the
     * focus event can land a frame after `fill()` resolves; a single read was a flake on iPad Mini.
     */
    await expect
      .poll(async () => await eventNames(page), { message: "focus starts the form" })
      .toContain("form_start");

    await page.getByLabel("Mobile number (required)").fill("9876543210");
    await page.getByLabel(/The academy may contact me/).check();
    await page.getByRole("button", { name: "Send my enquiry" }).click();

    await expect(page.getByText("We have your enquiry")).toBeVisible();

    const names = await eventNames(page);
    expect(names).toContain("form_submit");
    expect(names).toContain("generate_lead");
    // Order matters: a lead reported before its submit is a broken funnel.
    expect(names.lastIndexOf("generate_lead")).toBeGreaterThan(names.lastIndexOf("form_submit"));

    const lead = (await readLayer(page)).find((entry) => entry.event === "generate_lead");
    expect(lead?.course_id, "a lead has to say which course it was about").toBe(
      "italian-barista-course-basic",
    );
    expect(lead?.event_id, "the browser half needs an id to pair with the server half").toBeTruthy();
  });

  test("a validation failure reports itself and does not report a lead", async ({ page }) => {
    await page.goto("/enquire");
    await waitForHydratedForm(page);

    await page.getByLabel("Your name (required)").fill("Test Person");
    await page.getByLabel("Mobile number (required)").fill("123");
    await page.getByLabel(/The academy may contact me/).check();
    await page.getByRole("button", { name: "Send my enquiry" }).click();

    const names = await eventNames(page);
    expect(names).toContain("form_error");
    expect(names, "a rejected form is not a lead").not.toContain("generate_lead");
  });
});

test.describe("journey 2: checkout to confirmation", () => {
  const TEST_INSTANCE = "instance-e2e-test-batch";

  test.beforeEach(async ({ context, baseURL }) => {
    await acceptConsent(context, baseURL as string);
  });

  test("the checkout page reports the batch and the value", async ({ page }) => {
    await page.goto(`/book/${TEST_INSTANCE}`);
    await page.locator("form[data-hydrated=true]").first().waitFor();

    await expect
      .poll(async () => await eventNames(page))
      .toEqual(expect.arrayContaining(["batch_view", "begin_checkout"]));

    const layer = await readLayer(page);

    const batchView = layer.find((entry) => entry.event === "batch_view");
    expect(batchView?.instance_id).toBe(TEST_INSTANCE);

    const begin = layer.find((entry) => entry.event === "begin_checkout");
    expect(begin?.instance_id).toBe(TEST_INSTANCE);
    expect(begin?.currency).toBe("INR");
    expect(typeof begin?.value, "begin_checkout carries the fee the server will charge").toBe(
      "number",
    );
  });

  test("pressing Pay reports add_payment_info before the gateway opens", async ({ page }) => {
    // The order call is intercepted: this asserts the funnel, not Razorpay.
    await page.route("**/api/orders", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ ok: false, errors: { form: "intercepted" } }),
      });
    });

    await page.goto(`/book/${TEST_INSTANCE}`);
    await page.locator("form[data-hydrated=true]").first().waitFor();

    await page.getByLabel(/Your name/).fill("Test Person");
    await page.getByLabel(/Mobile number/).fill("9876543210");
    await page.getByLabel(/Email/).fill("test@example.com");
    /* Every course states a prerequisite now, so the form will not submit without this and
       add_payment_info would never fire. */
    await page.getByLabel(/I confirm I meet the prerequisite/).check();
    await page.getByLabel(/The academy may contact me/).check();
    await page.getByRole("button", { name: /Pay/ }).click();

    // add_payment_info fires synchronously, before the order request. booking_failed fires after it
    // resolves, so the visible error is what says the round trip is done; reading the layer before
    // that would assert against a funnel that is still mid-flight.
    await expect(page.getByText("intercepted")).toBeVisible();

    const names = await eventNames(page);
    expect(names).toContain("add_payment_info");
    // The order was refused, so this is a failure and must be reported as one, not as a purchase.
    expect(names).toContain("booking_failed");
    expect(names).not.toContain("purchase");
  });
});

test.describe("clicks are measured without an onClick on every button", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await acceptConsent(context, baseURL as string);
  });

  test("a WhatsApp button reports where it was pressed", async ({ page }) => {
    await page.goto("/");
    const button = page.locator('[data-event^="whatsapp_click"]').first();
    // Stop the navigation: the assertion is about the push, not about wa.me.
    await button.evaluate((element) => element.setAttribute("href", "#"));
    await button.click();

    await expect.poll(async () => await eventNames(page)).toContain("whatsapp_click");

    const event = (await readLayer(page)).find((entry) => entry.event === "whatsapp_click");
    expect(event, "every data-event attribute should be read by the delegated listener").toBeTruthy();
    expect(event?.cta_id).toMatch(/^whatsapp_click/);
  });
});
