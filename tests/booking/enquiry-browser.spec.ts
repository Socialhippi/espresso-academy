import { createClient, type SanityClient } from "@sanity/client";
import { expect, test } from "@playwright/test";

/**
 * The enquiry form, driven the way a person drives it, checked where the lead has to end up.
 *
 * `enquiry-pipeline.spec.ts` posts to `/api/enquiry` directly, which is the right way to test the
 * route's branches — and it cannot see anything the browser does wrong on the way there. It
 * supplies its own Turnstile token, its own field names and its own payload shape, so a form that
 * submits the wrong thing, or cannot submit at all, passes every one of those tests. That is not
 * hypothetical: a missing site key stopped every submission on the deployed site while the API
 * suite stayed green, and a batch `<select>` whose values were dates sent a label where the schema
 * wanted a document id.
 *
 * So this one fills the real form, presses the real button, and then asks Sanity whether the lead
 * is actually there.
 *
 * In the `booking` project because it writes to the dataset, and that project runs serially with
 * one worker against `ci`.
 */

const TEST_NAME = "PLAYWRIGHT Browser Lead";

function sanity(): SanityClient | null {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim();
  const token = process.env.SANITY_API_WRITE_TOKEN?.trim();
  if (!projectId || !dataset || !token) return null;
  return createClient({
    projectId,
    dataset,
    token,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || "2026-09-05",
    useCdn: false,
  });
}

test.describe("/enquire, from the browser to the dataset", () => {
  const client = sanity();
  test.skip(!client, "No Sanity write credentials in this environment");

  test.afterAll(async () => {
    if (!client) return;
    await client.delete({
      query: `*[_type == "enquiry" && name == $name]`,
      params: { name: TEST_NAME },
    });
  });

  test("submitting the form stores an enquiry with what the form said", async ({ page }) => {
    await page.goto("/enquire");
    await page.locator("form[data-hydrated=true]").first().waitFor();

    // The widget has to produce a token, or the server drops the lead to a WhatsApp handoff.
    await expect(
      page.locator('input[name="cf-turnstile-response"]'),
      "no Turnstile token, so the submission would be dropped before it reached Sanity",
    ).toHaveValue(/.+/, { timeout: 20_000 });

    await page.getByLabel(/Your name/).fill(TEST_NAME);
    await page.getByLabel(/Mobile number/).fill("9876500011");
    await page.getByRole("combobox", { name: /Which course/ }).selectOption("latte-art");
    await page.getByRole("checkbox", { name: /may contact me/i }).check();

    // The route drops anything submitted inside two seconds of the form mounting.
    await page.waitForTimeout(2600);
    await page.getByRole("button", { name: /Send|Ask|Submit/ }).first().click();

    /*
     * The success state, not a WhatsApp handoff. A handoff is what a *dropped* lead looks like, so
     * asserting it is absent is half the point of this test.
     */
    await expect(page.getByText(/thank|got it|we have your enquiry|on its way/i).first()).toBeVisible(
      { timeout: 20_000 },
    );

    // And the lead is where the academy will look for it.
    await expect
      .poll(
        async () =>
          client!.fetch<number>(`count(*[_type == "enquiry" && name == $name])`, {
            name: TEST_NAME,
          }),
        {
          message: "the form reported success and no enquiry document exists",
          timeout: 20_000,
        },
      )
      .toBeGreaterThan(0);

    const stored = await client!.fetch<{ courseSlug: string | null; phone: string }[]>(
      `*[_type == "enquiry" && name == $name]{ "courseSlug": course->slug.current, phone }`,
      { name: TEST_NAME },
    );
    expect(stored[0]?.phone, "the phone number the form sent should be stored").toContain(
      "9876500011",
    );
    expect(stored[0]?.courseSlug, "the course the form chose should be linked").toBe("latte-art");
  });
});
