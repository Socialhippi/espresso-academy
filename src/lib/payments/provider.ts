import "server-only";

/**
 * The payment gateway, behind an interface.
 *
 * The academy is launching on Razorpay at 2% + GST. Cashfree is running a 0% domestic promotion to
 * March 2027 and PhonePe PG a promotional 0%, either of which is worth several percent of every
 * fee once the volumes are real. That evaluation is the client's to make, and it should not cost a
 * rewrite of four route handlers when they make it: the routes talk to this interface, and a second
 * gateway is a second file implementing it.
 *
 * What the interface deliberately does not expose: an amount from the caller's side of the wire.
 * `createOrder` takes `amountInPaise`, and the only thing that computes that is the server, from
 * the fee it read out of Sanity (CLAUDE.md non-negotiable 11).
 */

export interface CreateOrderInput {
  /** Whole paise. The server computes this; it is never read from a request body. */
  amountInPaise: number;
  currency: "INR";
  /** Our own reference, echoed back on the webhook. Max 40 characters at Razorpay. */
  receipt: string;
  /** Small key/value pairs the gateway stores with the order and returns on the webhook. */
  notes: Record<string, string>;
}

export interface CreatedOrder {
  orderId: string;
  amountInPaise: number;
  currency: string;
}

export interface PaymentProvider {
  readonly name: "razorpay";
  /** The publishable key the browser needs to open the checkout. */
  readonly publicKeyId: string;
  createOrder(input: CreateOrderInput): Promise<CreatedOrder>;
  /** Verifies the signature the browser returns after a successful checkout. */
  verifyPayment(input: { orderId: string; paymentId: string; signature: string }): boolean;
  /** Verifies an inbound webhook delivery. Raw body, not re-serialised JSON. */
  verifyWebhook(input: { rawBody: string; signature: string }): boolean;
  /** True when a webhook secret is configured; without one the webhook route answers 503. */
  readonly canVerifyWebhooks: boolean;
}

let cached: PaymentProvider | null = null;
let resolved = false;

/**
 * The configured provider, or null when the keys are absent.
 *
 * Null is a supported state, not an error: `/book` renders its enquire-and-WhatsApp variant and no
 * Book button appears anywhere on the site. A missing key must never produce a checkout that
 * fails at the last step.
 */
export async function getPaymentProvider(): Promise<PaymentProvider | null> {
  if (resolved) return cached;

  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() || keyId;

  if (!keyId || !keySecret || !publicKeyId) {
    cached = null;
    resolved = true;
    return null;
  }

  const { createRazorpayProvider } = await import("@/lib/payments/razorpay");
  cached = createRazorpayProvider({ keyId, keySecret, publicKeyId });
  resolved = true;
  return cached;
}

/** True when a checkout can actually be opened. Used to decide whether to render a Book button. */
export async function isPaymentConfigured(): Promise<boolean> {
  return (await getPaymentProvider()) !== null;
}

/** Test seam: forget the memoised provider so a changed env is picked up. */
export function resetProviderCache(): void {
  cached = null;
  resolved = false;
}

/* The conversion lives in src/lib/batch.ts so the unit suite can reach it without pulling
   `server-only` in. Re-exported here because this is where a route handler looks for it. */
export { rupeesToPaise } from "@/lib/batch";
