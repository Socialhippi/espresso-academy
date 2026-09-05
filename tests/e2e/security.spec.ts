import { expect, test, type APIRequestContext } from "@playwright/test";
import { allRoutes } from "./helpers";

/**
 * Security headers, asserted on the real responses.
 *
 * These are the kind of thing that is set once, believed forever and quietly dropped by a config
 * change nobody connected to them. Every one below is checked on every route.
 */

/** One representative of each kind of route: static, dynamic, transactional, campaign, API. */
const SAMPLE_ROUTES = ["/", "/courses/latte-art", "/enquire", "/book/instance-e2e-test-batch", "/lp/example-campaign"];

test.describe("security headers", () => {
  for (const path of SAMPLE_ROUTES) {
    test(`${path} sends the full header set`, async ({ request }) => {
      const response = await request.get(path);
      const headers = response.headers();

      expect(headers["content-security-policy"], "a CSP must be present").toBeTruthy();
      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
      expect(headers["x-frame-options"]).toBe("DENY");
      expect(headers["permissions-policy"]).toContain("camera=()");
      expect(headers["permissions-policy"]).toContain("geolocation=()");
    });
  }

  /**
   * The policy is split by what a route handles, and the split is deliberate. See the long note in
   * src/middleware.ts: a statically generated page's HTML is fixed at build time and cannot carry a
   * per-request nonce, so the choice is between every page dynamic and the content pages keeping
   * `unsafe-inline`. Pages that take personal data get the strict policy; pages that only display
   * content stay static.
   */
  const scriptSrcOf = async (request: APIRequestContext, path: string): Promise<string> => {
    const csp = (await request.get(path)).headers()["content-security-policy"] ?? "";
    return csp.split(";").find((part) => part.trim().startsWith("script-src")) ?? "";
  };

  for (const path of ["/enquire", "/book/instance-e2e-test-batch", "/for-cafes", "/lp/example-campaign"]) {
    test(`${path} takes personal data, so it gets the strict policy`, async ({ request }) => {
      const scriptSrc = await scriptSrcOf(request, path);

      expect(scriptSrc, "a per-request nonce for the framework's own scripts").toMatch(
        /'nonce-[A-Za-z0-9+/=]+'/,
      );
      expect(scriptSrc, "strict-dynamic is what lets GTM inject its own tags").toContain(
        "'strict-dynamic'",
      );
      expect(
        scriptSrc,
        "unsafe-inline would allow an injected script too, which is the whole attack",
      ).not.toContain("'unsafe-inline'");
      expect(scriptSrc, "unsafe-eval must never reach a public page").not.toContain("'unsafe-eval'");
    });
  }

  test("a content page keeps unsafe-inline, and nothing else", async ({ request }) => {
    const scriptSrc = await scriptSrcOf(request, "/courses/latte-art");

    expect(scriptSrc).toContain("'unsafe-inline'");
    expect(scriptSrc, "unsafe-eval must never reach a public page").not.toContain("'unsafe-eval'");
    /*
     * No hash and no nonce here, and that is load-bearing rather than an omission: the CSP spec
     * says a browser ignores `unsafe-inline` the moment a hash-source or nonce-source is present.
     * Adding the consent-snippet hash "for good measure" silently turned this policy back into one
     * that blocked every inline script on the page, which is how it was first written.
     */
    expect(scriptSrc, "a hash here would nullify unsafe-inline").not.toMatch(/'sha256-/);
    expect(scriptSrc, "a nonce here would nullify unsafe-inline").not.toMatch(/'nonce-/);
  });

  test("the nonce on a strict route is different on every request", async ({ request }) => {
    const nonceOf = async (): Promise<string> => {
      const scriptSrc = await scriptSrcOf(request, "/enquire");
      return /'nonce-([A-Za-z0-9+/=]+)'/.exec(scriptSrc)?.[1] ?? "";
    };
    const [first, second] = await Promise.all([nonceOf(), nonceOf()]);
    expect(first).toBeTruthy();
    // A reused nonce is no nonce: an attacker who reads one page can inject into the next.
    expect(first).not.toBe(second);
  });

  test("the content pages are still statically generated", async ({ request }) => {
    /*
     * A regression guard with a scar behind it. The first version of this policy used a nonce
     * everywhere, which meant `headers()` in the root layout, which silently made all 32 routes
     * dynamic and put two Sanity round trips in front of every page view. Nothing looked wrong;
     * the suite just took four times as long.
     */
    const response = await request.get("/courses/latte-art");
    expect(
      response.headers()["x-nextjs-prerender"] ?? response.headers()["cache-control"] ?? "",
      "a content page must not be server-rendered per request",
    ).toBeTruthy();
  });

  test("nothing may frame this site", async ({ request }) => {
    const csp = (await request.get("/")).headers()["content-security-policy"] ?? "";
    expect(csp).toContain("frame-ancestors 'none'");
  });

  test("the payment gateway and Turnstile are allowed to frame themselves in", async ({
    request,
  }) => {
    const csp = (await request.get("/book/instance-e2e-test-batch")).headers()[
      "content-security-policy"
    ] ?? "";
    expect(csp, "Razorpay Checkout is an iframe").toContain("checkout.razorpay.com");
    expect(csp, "Turnstile is an iframe").toContain("challenges.cloudflare.com");
  });

  test("the Studio's unsafe-eval is scoped to the Studio and nowhere else", async ({ request }) => {
    const studio = (await request.get("/studio")).headers()["content-security-policy"] ?? "";
    const publicPage = (await request.get("/")).headers()["content-security-policy"] ?? "";

    // The Studio compiles schemas in the browser and genuinely needs it.
    expect(studio).toContain("'unsafe-eval'");
    // No page a member of the public can reach may have it.
    expect(publicPage).not.toContain("'unsafe-eval'");
  });

  test("HSTS is not sent yet, and that is deliberate", async ({ request }) => {
    /*
     * A wrong HSTS header is cached for its whole max-age and cannot be withdrawn, so it is not
     * turned on until the real domain is attached and serving HTTPS. This asserts the current
     * state so that turning it on is a deliberate change to this test, not an accident.
     */
    const headers = (await request.get("/")).headers();
    expect(headers["strict-transport-security"]).toBeUndefined();
  });
});

test.describe("the noindex header while the draft is public", () => {
  for (const route of allRoutes.slice(0, 6)) {
    test(`${route.path} is held out of the index`, async ({ request }) => {
      const header = (await request.get(route.path)).headers()["x-robots-tag"];
      expect(header, "NEXT_PUBLIC_INDEXABLE is false, so nothing may be indexed").toContain(
        "noindex",
      );
    });
  }
});

/*
 * robots.txt and the noindex header have to be read together, because it is possible to write two
 * directives that each look right and cancel each other out.
 *
 * That is what this file used to do: `Disallow: /` while the header said `noindex, nofollow`. A
 * crawler that obeys Disallow never fetches the page, so it never reads the header — and Google
 * will still index a blocked URL it finds a link to, with no description, because it was not
 * allowed to look. The block was the reason the noindex could not work.
 *
 * So the assertions below are about the *relationship*: the crawl is allowed precisely so that the
 * noindex can be read, and the two must not drift back into contradicting each other.
 */
test.describe("robots.txt lets crawlers in so the noindex can be read", () => {
  async function robotsTxt(request: APIRequestContext): Promise<string> {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    return response.text();
  }

  test("the site is crawlable", async ({ request }) => {
    const body = await robotsTxt(request);
    expect(body).toContain("Allow: /");
    expect(
      body,
      "Disallow: / would stop the crawl that the noindex header depends on",
    ).not.toMatch(/^Disallow: \/$/m);
  });

  test("and every page it lets in answers noindex", async ({ request }) => {
    // The pairing, asserted end to end rather than as two separate facts.
    const body = await robotsTxt(request);
    expect(body).toContain("Allow: /");
    const header = (await request.get("/")).headers()["x-robots-tag"];
    expect(header, "crawlable and indexable at once would publish the draft").toContain("noindex");
  });

  test("the AI crawlers are named and allowed", async ({ request }) => {
    const body = await robotsTxt(request);
    for (const agent of ["GPTBot", "ClaudeBot", "PerplexityBot", "Google-Extended"]) {
      expect(body, `${agent} should be addressed by name`).toContain(`User-Agent: ${agent}`);
    }
  });

  test("the routes that should never be crawled are still held back", async ({ request }) => {
    const body = await robotsTxt(request);
    for (const path of ["/api/", "/dev/", "/studio", "/thank-you", "/book/", "/booking/", "/lp/"]) {
      expect(body, `${path} must stay disallowed`).toContain(`Disallow: ${path}`);
    }
  });

  test("it points at the sitemap", async ({ request }) => {
    const body = await robotsTxt(request);
    expect(body).toMatch(/^Sitemap: https?:\/\/\S+\/sitemap\.xml$/m);
  });
});

test.describe("write routes refuse what they should", () => {
  test("the Sanity revalidate webhook rejects an unsigned POST", async ({ request }) => {
    const response = await request.post("/api/revalidate", {
      data: { _type: "course", _id: "course-latte-art" },
    });
    expect([400, 401]).toContain(response.status());
  });

  test("the Razorpay webhook rejects an unsigned POST", async ({ request }) => {
    const response = await request.post("/api/webhooks/razorpay", {
      data: { event: "payment.captured" },
    });
    expect([400, 503]).toContain(response.status());
  });

  test("the payment verify route rejects an unsigned POST", async ({ request }) => {
    const response = await request.post("/api/payments/verify", {
      data: {
        bookingId: "x",
        razorpayOrderId: "order_fake",
        razorpayPaymentId: "pay_fake",
        razorpaySignature: "deadbeef",
      },
    });
    expect([400, 404, 503]).toContain(response.status());
  });

  test("a booking status is readable but a booking's personal data is not", async ({ request }) => {
    const response = await request.get("/api/bookings/does-not-exist/status");
    expect(response.status()).toBe(404);

    const body = await response.text();
    for (const leak of ["phone", "email", "razorpay"]) {
      expect(body.toLowerCase(), `a 404 must not leak a ${leak} field name`).not.toContain(leak);
    }
  });
});
