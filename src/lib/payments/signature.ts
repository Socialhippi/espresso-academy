/**
 * Signature verification, on its own, with no SDK and no network.
 *
 * Separate from the adapter so it can be unit-tested against known vectors: these two functions
 * are the whole of non-negotiable 12 on the payment side, and a test that has to instantiate an
 * SDK client to exercise them is a test nobody runs.
 *
 * Both use a constant-time comparison. An HMAC check that returns early on the first differing
 * byte leaks, in its timing, how much of a forged signature was right, which is enough to
 * reconstruct one given enough attempts.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

function hmacHex(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Constant-time string comparison that does not throw on a length mismatch. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  // timingSafeEqual throws unless the lengths match, and the throw itself is a timing signal.
  // Comparing each against a fixed-length digest of itself keeps the work constant.
  if (left.length !== right.length) {
    // Still do the work, so a wrong-length signature costs the same as a wrong-value one.
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

/**
 * The signature Razorpay Checkout hands back to the browser on success.
 * Payload is `order_id|payment_id`, keyed with the API secret.
 */
export function verifyPaymentSignature({
  orderId,
  paymentId,
  signature,
  secret,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret: string;
}): boolean {
  if (!orderId || !paymentId || !signature || !secret) return false;
  return safeEqual(hmacHex(`${orderId}|${paymentId}`, secret), signature);
}

/**
 * The `X-Razorpay-Signature` header on a webhook delivery.
 * Payload is the raw request body, byte for byte, keyed with the webhook secret. It must be the
 * raw text: re-serialising the parsed JSON reorders keys and the signature stops matching.
 */
export function verifyWebhookSignature({
  rawBody,
  signature,
  secret,
}: {
  rawBody: string;
  signature: string;
  secret: string;
}): boolean {
  if (!rawBody || !signature || !secret) return false;
  return safeEqual(hmacHex(rawBody, secret), signature);
}
