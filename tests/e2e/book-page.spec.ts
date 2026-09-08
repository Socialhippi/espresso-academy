import { expect, test } from "@playwright/test";

/**
 * The checkout page, as a reader sees it.
 *
 * Read-only: nothing here creates an order or moves a seat, so it is safe to run in all six
 * browser projects at once. The half of the suite that does change state lives in
 * tests/booking/payments.spec.ts, which runs in one project, serially, for that reason.
 *
 * Needs the batch seeded by `pnpm sanity:seed:test-batch`.
 */

const TEST_INSTANCE = "instance-e2e-test-batch";

test.describe("the checkout page", () => {
  test("renders the batch, the fee and the form", async ({ page }) => {
    const response = await page.goto(`/book/${TEST_INSTANCE}`);
    expect(response?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Seats left")).toBeVisible();
    /* "+ GST" while `gstRate` is null, "incl. GST" once the academy confirms the rate. Either is
       correct; a bare figure with no tax qualifier beside it is not. */
    await expect(page.getByText(/\+ GST|incl\. GST/).first()).toBeVisible();
    await expect(page.getByLabel(/Your name/)).toBeVisible();
    await expect(page.getByLabel(/Mobile number/)).toBeVisible();
    await expect(page.getByLabel(/Email/)).toBeVisible();
  });

  test("is noindex: it is transactional and it goes stale", async ({ page }) => {
    await page.goto(`/book/${TEST_INSTANCE}`);
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots ?? "").toContain("noindex");
  });

  test("does not overflow the viewport", async ({ page }) => {
    await page.goto(`/book/${TEST_INSTANCE}`);
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth + 1);
  });

  test("links to the refund policy before anyone pays", async ({ page }) => {
    await page.goto(`/book/${TEST_INSTANCE}`);
    await expect(page.locator('a[href="/refund-policy"]').first()).toBeVisible();
  });

  test("an unknown batch is a 404, not a broken checkout", async ({ page }) => {
    const response = await page.goto("/book/instance-that-does-not-exist");
    expect(response?.status()).toBe(404);
  });
});

test.describe("form validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/book/${TEST_INSTANCE}`);
    await page.locator("form[data-hydrated=true]").first().waitFor();
  });

  test("an empty submit shows errors and moves focus to the first one", async ({ page }) => {
    await page.getByRole("button", { name: /Pay/ }).click();
    await expect(page.getByText("Enter your name")).toBeVisible();
    await expect(page.getByLabel(/Your name/)).toBeFocused();
  });

  test("a bad phone number is caught on blur", async ({ page }) => {
    await page.getByLabel(/Mobile number/).fill("12345");
    await page.getByLabel(/Email/).click();
    await expect(page.getByText(/10-digit Indian mobile number/)).toBeVisible();
  });

  test("a bad email is caught on blur", async ({ page }) => {
    await page.getByLabel(/Email/).fill("not-an-email");
    await page.getByLabel(/Your name/).click();
    await expect(page.getByText(/email address we can send/)).toBeVisible();
  });

  test("the consent box is required", async ({ page }) => {
    await page.getByLabel(/Your name/).fill("Test Student");
    await page.getByLabel(/Mobile number/).fill("9876543210");
    await page.getByLabel(/Email/).fill("test@example.com");
    await page.getByRole("button", { name: /Pay/ }).click();
    await expect(page.getByText(/Tick the box/)).toBeVisible();
  });
});
