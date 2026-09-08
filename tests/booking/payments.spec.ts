import { createHmac } from "node:crypto";
import { expect, test, type APIRequestContext } from "@playwright/test";

/**
 * The payment path: orders, the webhook, seats, the confirmation page and the sold-out state.
 *
 * **This suite changes state**, and that is why it has its own Playwright project rather than
 * running in all six browser ones. It creates Razorpay test orders, fires signed webhooks and
 * takes seats from a shared batch in a shared dataset; six projects running it at once race each
 * other for the last seat and half of them fail on a number that moved underneath them. One
 * project, one worker, and `tests/global-setup.ts` puts the seats back before every run.
 *
 * What is deliberately not automated: Razorpay's Checkout.js itself. It is a third-party iframe on
 * a third-party origin, and driving it would be testing Razorpay rather than this site. It is
 * exercised by hand, with a domestic test card, and the run is recorded in docs/RUNBOOK.md with
 * screenshots in docs/screens/.
 */

const TEST_INSTANCE = "instance-e2e-test-batch";
/** One seat. Filling it is how the sold-out state gets tested without exhausting the main batch. */
const SOLDOUT_INSTANCE = "instance-e2e-soldout-batch";

/** Cloudflare's always-passes test secret accepts any non-empty token. */
const TURNSTILE_TOKEN = "playwright.dummy.token";

interface CreatedOrder {
  bookingId: string;
  orderId: string;
  amountInPaise: number;
}

async function createOrder(
  request: APIRequestContext,
  overrides: Record<string, unknown> = {},
): Promise<{ status: number; body: Record<string, unknown> }> {
  const response = await request.post("/api/orders", {
    data: {
      instanceId: TEST_INSTANCE,
      name: "Playwright Student",
      phone: "9876543210",
      email: "playwright@example.com",
      consent: true,
      /*
       * Every course in the catalogue states a prerequisite now, even the IBC Basic, whose
       * prerequisite is "none". `/api/orders` checks the course it read from Sanity rather than
       * anything the browser claims, so the confirmation is part of every real checkout and
       * belongs in the default body rather than in an override.
       */
      prerequisiteAccepted: true,
      company: "",
      elapsedMs: 5000,
      turnstileToken: TURNSTILE_TOKEN,
      page: `/book/${TEST_INSTANCE}`,
      ...overrides,
    },
  });
  return { status: response.status(), body: (await response.json()) as Record<string, unknown> };
}

function signWebhook(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

function capturedEvent(orderId: string, paymentId: string): string {
  return JSON.stringify({
    event: "payment.captured",
    payload: { payment: { entity: { id: paymentId, order_id: orderId, status: "captured" } } },
  });
}

test.describe("/api/orders", () => {
  test("creates a real Razorpay test order for the right amount", async ({ request }) => {
    const { status, body } = await createOrder(request);
    expect(status).toBe(200);
    expect(body.ok).toBe(true);

    const order = body.order as CreatedOrder;
    expect(order.orderId).toMatch(/^order_/);
    /*
     * ₹1 on the seeded batch. The browser sent no amount; the server read this from Sanity.
     * The advance is capped at the fee (src/lib/booking-terms.ts), so a ₹1 batch charges ₹1
     * rather than the ₹5,000 that a real batch would.
     */
    expect(order.amountInPaise).toBe(100);
    expect(order.bookingId).toBeTruthy();
  });

  test("ignores an amount in the request body: the server reads the fee from Sanity", async ({
    request,
  }) => {
    const { body } = await createOrder(request, { amount: 1, amountInPaise: 1, feeExGst: 5000 });
    const order = body.order as CreatedOrder;
    expect(order.amountInPaise).toBe(100);
  });

  test("rejects a bad phone number", async ({ request }) => {
    const { status, body } = await createOrder(request, { phone: "12345" });
    expect(status).toBe(400);
    expect((body.errors as Record<string, string>).phone).toBeTruthy();
  });

  test("rejects a submit with no consent", async ({ request }) => {
    const { status } = await createOrder(request, { consent: false });
    expect(status).toBe(400);
  });

  test("rejects a filled honeypot", async ({ request }) => {
    const { status } = await createOrder(request, { company: "spam-bot" });
    expect(status).toBe(400);
  });

  test("rejects a submit faster than a person can type", async ({ request }) => {
    const { status } = await createOrder(request, { elapsedMs: 10 });
    expect(status).toBe(400);
  });

  test("rejects an unknown batch", async ({ request }) => {
    const { status } = await createOrder(request, { instanceId: "instance-nope" });
    expect(status).toBe(404);
  });

  test("refuses anything but POST", async ({ request }) => {
    const response = await request.get("/api/orders");
    expect(response.status()).toBe(405);
  });
});

test.describe("the webhook is signature-verified and idempotent", () => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  test.skip(!secret, "RAZORPAY_WEBHOOK_SECRET is not set in this environment");

  test("a signed capture marks the booking paid and takes a seat", async ({ request }) => {
    const seatsBefore = await readSeats(request);
    const { body } = await createOrder(request);
    const order = body.order as CreatedOrder;

    const paymentId = `pay_test_${Date.now()}`;
    const event = capturedEvent(order.orderId, paymentId);

    const first = await request.post("/api/webhooks/razorpay", {
      headers: {
        "content-type": "application/json",
        "x-razorpay-signature": signWebhook(event, secret as string),
      },
      data: event,
    });
    expect(first.status()).toBe(200);
    expect((await first.json()).handled).toBe(true);

    const status = await request.get(`/api/bookings/${order.bookingId}/status`);
    expect((await status.json()).status).toBe("paid");

    const seatsAfter = await readSeats(request);
    expect(seatsAfter).toBe(seatsBefore - 1);

    // The second identical delivery. Razorpay retries anything that does not answer 2xx, and the
    // browser's verify call races this one, so this is the ordinary case rather than the odd one.
    const second = await request.post("/api/webhooks/razorpay", {
      headers: {
        "content-type": "application/json",
        "x-razorpay-signature": signWebhook(event, secret as string),
      },
      data: event,
    });
    expect(second.status()).toBe(200);
    expect((await second.json()).idempotent).toBe(true);

    const seatsAfterSecond = await readSeats(request);
    expect(seatsAfterSecond).toBe(seatsAfter);
  });

  test("a forged signature changes nothing", async ({ request }) => {
    const { body } = await createOrder(request);
    const order = body.order as CreatedOrder;
    const event = capturedEvent(order.orderId, `pay_forged_${Date.now()}`);

    const response = await request.post("/api/webhooks/razorpay", {
      headers: { "content-type": "application/json", "x-razorpay-signature": "deadbeef" },
      data: event,
    });
    expect(response.status()).toBe(400);

    const status = await request.get(`/api/bookings/${order.bookingId}/status`);
    expect((await status.json()).status).toBe("created");
  });

  test("a signed body that was tampered with after signing is rejected", async ({ request }) => {
    const { body } = await createOrder(request);
    const order = body.order as CreatedOrder;
    const event = capturedEvent(order.orderId, "pay_original");
    const signature = signWebhook(event, secret as string);
    const tampered = event.replace("pay_original", "pay_swapped");

    const response = await request.post("/api/webhooks/razorpay", {
      headers: { "content-type": "application/json", "x-razorpay-signature": signature },
      data: tampered,
    });
    expect(response.status()).toBe(400);
  });

  test("refuses anything but POST", async ({ request }) => {
    const response = await request.get("/api/webhooks/razorpay");
    expect(response.status()).toBe(405);
  });
});

test.describe("the confirmation page", () => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  test.skip(!secret, "RAZORPAY_WEBHOOK_SECRET is not set in this environment");

  test("renders a paid booking with its batch and its calendar file", async ({ page, request }) => {
    const { body } = await createOrder(request);
    const order = body.order as CreatedOrder;
    const event = capturedEvent(order.orderId, `pay_confirm_${Date.now()}`);
    await request.post("/api/webhooks/razorpay", {
      headers: {
        "content-type": "application/json",
        "x-razorpay-signature": signWebhook(event, secret as string),
      },
      data: event,
    });

    const response = await page.goto(`/booking/${order.bookingId}`);
    expect(response?.status()).toBe(200);
    /* "confirmed", not "booked": the checkout takes a ₹5,000 advance now, and on a real course a
       seat that is confirmed is not a course that is paid for. */
    await expect(page.getByRole("heading", { name: /Your seat is confirmed/ })).toBeVisible();
    await expect(page.getByText("What happens next")).toBeVisible();

    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots ?? "").toContain("noindex");

    const ics = await request.get(`/booking/${order.bookingId}/calendar.ics`);
    expect(ics.status()).toBe(200);
    expect(ics.headers()["content-type"]).toContain("text/calendar");
    const body_text = await ics.text();
    expect(body_text).toContain("BEGIN:VCALENDAR");
    expect(body_text).toContain("BEGIN:VEVENT");
    // RFC 5545 wants CRLF, and several calendar clients refuse a file with bare LF.
    expect(body_text).toContain("\r\n");
  });

  test("an unpaid booking has no calendar file to download", async ({ request }) => {
    const { body } = await createOrder(request);
    const order = body.order as CreatedOrder;
    const ics = await request.get(`/booking/${order.bookingId}/calendar.ics`);
    expect(ics.status()).toBe(404);
  });

  test("an unknown booking is a 404", async ({ page }) => {
    const response = await page.goto("/booking/does-not-exist");
    expect(response?.status()).toBe(404);
  });
});

test.describe("the sold-out state", () => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  test.skip(!secret, "RAZORPAY_WEBHOOK_SECRET is not set in this environment");

  test("appears once the last seat is paid for, and no further order can be created", async ({
    page,
    request,
  }) => {
    // One seat on this batch, so one paid booking fills it.
    const { status, body } = await createOrder(request, { instanceId: SOLDOUT_INSTANCE });
    /* Assert before dereferencing. A refused order used to surface as "Cannot read properties of
       undefined (reading 'orderId')", which says nothing about why the server said no — and the
       reason is in the body. */
    expect(status, `the first order on the sold-out batch was refused: ${JSON.stringify(body)}`).toBe(
      200,
    );
    const order = body.order as CreatedOrder;

    const event = capturedEvent(order.orderId, `pay_soldout_${Date.now()}`);
    const captured = await request.post("/api/webhooks/razorpay", {
      headers: {
        "content-type": "application/json",
        "x-razorpay-signature": signWebhook(event, secret as string),
      },
      data: event,
    });
    expect(captured.status()).toBe(200);

    // The server refuses a second order rather than taking money for a seat that is gone.
    const second = await createOrder(request, { instanceId: SOLDOUT_INSTANCE });
    expect(second.status).toBe(409);
    expect(second.body.soldOut).toBe(true);

    // And the page says so, with a way forward rather than a dead end.
    await page.goto(`/book/${SOLDOUT_INSTANCE}`);
    await expect(page.getByRole("heading", { name: /This batch is full/ })).toBeVisible();
    await expect(page.getByText(/waiting list/i).first()).toBeVisible();
  });
});

/** Seats left on the seeded batch, read through the page the site itself renders. */
async function readSeats(request: APIRequestContext): Promise<number> {
  const response = await request.get(`/book/${TEST_INSTANCE}`);
  const html = await response.text();
  const match = /Seats left<\/dt>.*?>(\d+)</s.exec(html);
  if (!match?.[1]) throw new Error("Could not read the seat count from the checkout page");
  return Number(match[1]);
}
