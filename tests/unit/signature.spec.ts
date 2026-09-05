import { createHmac } from "node:crypto";
import { expect, test } from "@playwright/test";
import {
  safeEqual,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "@/lib/payments/signature";

/**
 * Signature verification, against vectors computed here rather than against the implementation.
 *
 * These two functions are the whole of CLAUDE.md non-negotiable 12 on the payment side. A test
 * that called the same helper to produce the expected value would pass whatever the helper did.
 */

const SECRET = "test_secret_do_not_use_anywhere";

function hmac(payload: string, secret = SECRET): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

test.describe("payment signature (the one Checkout.js returns)", () => {
  const orderId = "order_ABC123";
  const paymentId = "pay_XYZ789";

  test("accepts the signature Razorpay would send", () => {
    const signature = hmac(`${orderId}|${paymentId}`);
    expect(verifyPaymentSignature({ orderId, paymentId, signature, secret: SECRET })).toBe(true);
  });

  test("rejects a signature for a different order", () => {
    const signature = hmac(`order_OTHER|${paymentId}`);
    expect(verifyPaymentSignature({ orderId, paymentId, signature, secret: SECRET })).toBe(false);
  });

  test("rejects a signature for a different payment", () => {
    const signature = hmac(`${orderId}|pay_OTHER`);
    expect(verifyPaymentSignature({ orderId, paymentId, signature, secret: SECRET })).toBe(false);
  });

  test("rejects a signature made with a different secret", () => {
    const signature = hmac(`${orderId}|${paymentId}`, "someone_elses_secret");
    expect(verifyPaymentSignature({ orderId, paymentId, signature, secret: SECRET })).toBe(false);
  });

  test("rejects the order and payment swapped, which is the obvious forgery to try", () => {
    const signature = hmac(`${paymentId}|${orderId}`);
    expect(verifyPaymentSignature({ orderId, paymentId, signature, secret: SECRET })).toBe(false);
  });

  test("rejects an empty or missing signature rather than throwing", () => {
    expect(verifyPaymentSignature({ orderId, paymentId, signature: "", secret: SECRET })).toBe(false);
    expect(verifyPaymentSignature({ orderId, paymentId, signature: "x", secret: "" })).toBe(false);
  });
});

test.describe("webhook signature (the X-Razorpay-Signature header)", () => {
  const rawBody = JSON.stringify({
    event: "payment.captured",
    payload: { payment: { entity: { id: "pay_1", order_id: "order_1" } } },
  });

  test("accepts a correctly signed body", () => {
    expect(
      verifyWebhookSignature({ rawBody, signature: hmac(rawBody), secret: SECRET }),
    ).toBe(true);
  });

  test("rejects a body that was tampered with after signing", () => {
    const signature = hmac(rawBody);
    const tampered = rawBody.replace('"pay_1"', '"pay_ATTACKER"');
    expect(verifyWebhookSignature({ rawBody: tampered, signature, secret: SECRET })).toBe(false);
  });

  test("rejects a re-serialised body, which is why the route reads raw text", () => {
    // Re-serialising reorders nothing here, but it does change whitespace, and that is enough.
    const reserialised = JSON.stringify(JSON.parse(rawBody), null, 2);
    expect(
      verifyWebhookSignature({ rawBody: reserialised, signature: hmac(rawBody), secret: SECRET }),
    ).toBe(false);
  });

  test("rejects an empty body", () => {
    expect(verifyWebhookSignature({ rawBody: "", signature: hmac(""), secret: SECRET })).toBe(false);
  });
});

test.describe("constant-time comparison", () => {
  test("is true only for identical strings", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
  });

  test("does not throw on a length mismatch, which would itself be a timing signal", () => {
    expect(() => safeEqual("short", "a much longer string")).not.toThrow();
    expect(safeEqual("short", "a much longer string")).toBe(false);
  });
});
