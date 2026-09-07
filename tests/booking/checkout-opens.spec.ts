import { expect, test } from "@playwright/test";

/**
 * The whole path a real customer takes, in a real browser: the Turnstile widget renders, the form
 * submits, the server verifies the token it was given, and Razorpay's checkout opens.
 *
 * This exists because of a live defect. `payments.spec.ts` posts a `turnstileToken` string of its
 * own to `/api/orders`, so it passes whether or not the browser was ever given a site key to
 * render a widget with — and on production it had not been. Every API test was green while every
 * real booking was refused with "We could not verify that you are human." A test that supplies the
 * token itself cannot see a missing widget; only one that makes the browser produce it can.
 *
 * It stops where `payments.spec.ts` says it should: at Razorpay's modal opening. Filling a card in
 * a third-party iframe would be testing Razorpay. Reaching the modal is testing this site.
 *
 * Run it against the deployment, not only localhost:
 *   PLAYWRIGHT_BASE_URL=https://espresso-academy-india.vercel.app pnpm exec playwright test \
 *     --project=booking tests/booking/checkout-opens.spec.ts
 */

const TEST_INSTANCE = "instance-e2e-test-batch";

/** The two-second floor in `/api/orders`, plus room for a slow deployment. */
const TIME_FLOOR_MS = 2500;

test("the browser reaches Razorpay checkout, widget and all", async ({ page }) => {
  const refusals: string[] = [];
  page.on("response", async (response) => {
    if (!response.url().includes("/api/orders")) return;
    if (response.ok()) return;
    refusals.push(`${response.status()} ${await response.text()}`);
  });

  await page.goto(`/book/${TEST_INSTANCE}`);
  await page.locator("form[data-hydrated=true]").first().waitFor();

  /*
   * The evidence that both halves of the key pair are present. Without
   * NEXT_PUBLIC_TURNSTILE_SITE_KEY the component returns null and this container never exists,
   * which is the state that took bookings down.
   */
  await expect(
    page.getByTestId("turnstile"),
    "no Turnstile widget: NEXT_PUBLIC_TURNSTILE_SITE_KEY is missing from this environment",
  ).toBeVisible();

  /*
   * And the evidence that it worked: Turnstile writes the token into a hidden input of its own.
   * That input, not the iframe, is what a real key and the test key have in common — the test key
   * resolves with no visible challenge at all.
   */
  await expect(
    page.locator('input[name="cf-turnstile-response"]'),
    "the Turnstile widget rendered but produced no token",
  ).toHaveValue(/.+/, { timeout: 20_000 });

  await page.getByLabel(/Your name/).fill("Playwright Student");
  await page.getByLabel(/Mobile number/).fill("9876543210");
  await page.getByLabel(/Email/).fill("playwright@example.com");
  await page.getByRole("checkbox", { name: /may contact me about this booking/i }).check();

  await page.waitForTimeout(TIME_FLOOR_MS);
  await page.getByRole("button", { name: /Pay/ }).click();

  // Razorpay injects its own container and iframe. Either is proof the order was created and
  // Checkout.js was handed it.
  await expect(
    page.locator(".razorpay-container, iframe[src*='razorpay']").first(),
    `Razorpay checkout did not open. /api/orders answered: ${refusals.join(" | ") || "nothing"}`,
  ).toBeVisible({ timeout: 30_000 });

  expect(refusals, "the order was refused").toEqual([]);
  await expect(page.getByText(/could not verify that you are human/i)).toHaveCount(0);
});

/**
 * The enquiry form has the same pair and a quieter failure: `/api/enquiry` answers a failed
 * challenge with the WhatsApp handoff and a 200, so a missing site key did not look like an error
 * at all — it silently stopped storing leads. Confirmed against production before the fix, where
 * a well-formed enquiry came back `delivery: "whatsapp"` and no document was written.
 *
 * This stops at the token rather than submitting: a real submit on the deployment would write a
 * lead into the academy's Sanity dataset and email them about it.
 */
test("the enquiry form gets a Turnstile token too", async ({ page }) => {
  await page.goto("/enquire");
  await page.locator("form[data-hydrated=true]").first().waitFor();

  await expect(
    page.getByTestId("turnstile"),
    "no Turnstile widget on /enquire: NEXT_PUBLIC_TURNSTILE_SITE_KEY is missing",
  ).toBeVisible();

  await expect(page.locator('input[name="cf-turnstile-response"]')).toHaveValue(/.+/, {
    timeout: 20_000,
  });
});


/**
 * The hero button, not the batch table.
 *
 * `/courses/latte-art` carries the ₹1 test batch, so its hero is in the "one open priced batch"
 * state and must go straight to that batch's checkout. This is the path a reader who has decided
 * actually takes: they do not scroll past the syllabus to find a Book button in a table.
 */
test("the course hero button reaches Razorpay checkout", async ({ page }) => {
  await page.goto("/courses/latte-art");

  /*
   * Either wording is correct and which one appears depends on the data: one bookable batch gives
   * "Book this batch" and goes straight to its checkout, more than one gives "Choose a date" and
   * scrolls to the table rather than choosing for the reader. The seeded dataset has two, so the
   * test follows whichever it is offered. What must never happen — and did — is a hero that offers
   * an enquiry form while a seat can be paid for.
   */
  const hero = page.getByRole("link", { name: /^(Book this batch|Choose a date)/ }).first();
  await expect(
    hero,
    "the Latte Art hero is not offering its bookable batch — check courseCta and the seeded test batch",
  ).toBeVisible();
  await hero.click();

  if (!/\/book\//.test(page.url())) {
    /*
     * `:visible` matters. The batch list renders twice — stacked below md, a table from md up —
     * so every batch has two links to the same href and only one of them is displayed at any
     * width. Without the filter this picks the hidden one and waits 45 seconds for it to appear.
     */
    await page.locator('a[href="/book/instance-e2e-test-batch"]:visible').first().click();
  }

  await expect(page).toHaveURL(/\/book\/instance-e2e-test-batch/);
  await page.locator("form[data-hydrated=true]").first().waitFor();
  await expect(page.locator('input[name="cf-turnstile-response"]')).toHaveValue(/.+/, {
    timeout: 20_000,
  });

  await page.getByLabel(/Your name/).fill("Hero CTA");
  await page.getByLabel(/Mobile number/).fill("9876543210");
  await page.getByLabel(/Email/).fill("business@socialhippi.com");
  await page.getByRole("checkbox", { name: /may contact me about this booking/i }).check();
  await page.waitForTimeout(TIME_FLOOR_MS);
  await page.getByRole("button", { name: /Pay/ }).click();

  await expect(page.locator(".razorpay-container, iframe[src*='razorpay']").first()).toBeVisible({
    timeout: 30_000,
  });
});
