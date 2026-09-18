import { test, expect } from "@playwright/test";
import { LEGACY_REDIRECTS } from "../../src/lib/legacy-redirects";

/**
 * Every URL the old espressoacademy.in served, and where it lands here.
 *
 * The map itself is imported from src/lib/legacy-redirects.ts rather than restated, because a test
 * that carries its own copy of the list passes forever while the config drifts underneath it.
 *
 * Two things are asserted per URL, and the second is the one that matters to whoever reads a
 * crawl report after the cutover:
 *
 *  1. the first hop is a 301, to the exact destination declared — not a 308, which is what Next
 *     emits for `permanent: true` and which the academy's SEO consultant will read as a different
 *     thing;
 *  2. following the chain ends at a 200. A redirect to a page that 404s is worse than no redirect
 *     at all: it spends the old URL's equity and gives the reader a dead end, and it is invisible
 *     unless something follows the hop.
 *
 * These rules are inert until espressoacademy.in resolves to Vercel. The test runs against
 * baseURL, so it proves the destinations exist and the rules are compiled in — which is what can
 * be proved before the DNS moves.
 */
test.describe("legacy espressoacademy.in URLs", () => {
  for (const rule of LEGACY_REDIRECTS) {
    test(`${rule.source} redirects 301 to ${rule.destination}`, async ({ request, baseURL }) => {
      const response = await request.get(rule.source, { maxRedirects: 0 });

      expect(response.status(), `${rule.source} should be a 301`).toBe(rule.statusCode);

      /* Next writes Location as a path for a same-origin destination; normalise both sides so the
         assertion does not depend on that. */
      const location = response.headers()["location"] ?? "";
      const actual = new URL(location, baseURL ?? "http://localhost:3000");
      const expected = new URL(rule.destination, baseURL ?? "http://localhost:3000");
      expect(actual.pathname + actual.search).toBe(expected.pathname + expected.search);
    });

    test(`${rule.source} ends at a 200`, async ({ request }) => {
      const response = await request.get(rule.source);
      expect(
        response.status(),
        `${rule.source} -> ${rule.destination} did not end at a 200`,
      ).toBe(200);
    });
  }

  /**
   * `/form_submit.php` must NOT be redirected, and this test is the reason it is not.
   *
   * The old form took name, email and phone over GET, so a link to it carries a real person's
   * contact details in the query string. The first version of this map sent it to
   * `/enquire?from=legacy-form`, on the assumption that a destination with its own query would
   * stop Next forwarding the incoming one. It does not — Next merges them — and the rule emitted:
   *
   *   location: /enquire?name=Test%20Person&email=test%40example.com&phone=9999999999&from=legacy-form
   *
   * which copies that data into a Location header, the reader's address bar, the `page_path` the
   * analytics layer reports, and our access logs. This test failed, which is how that was caught.
   *
   * A 404 leaves the data in one server log line and stops. The endpoint was never a page and has
   * no equity to preserve, so the 404 is the right answer and this pins it against someone later
   * "fixing" the gap in the map.
   */
  test("the legacy form endpoint 404s rather than forwarding personal data", async ({
    request,
  }) => {
    const response = await request.get(
      "/form_submit.php?name=Test+Person&email=test%40example.com&phone=9999999999&source=web",
      { maxRedirects: 0 },
    );

    expect(
      response.status(),
      "/form_submit.php must not redirect: Next merges the incoming query into the destination, " +
        "so any redirect here forwards the caller's name, email and phone onward",
    ).toBe(404);
    expect(response.headers()["location"] ?? "").toBe("");
  });
});
