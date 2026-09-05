import "server-only";

/**
 * The Razorpay adapter. Everything gateway-specific lives here; the routes see only
 * `PaymentProvider`.
 */
import Razorpay from "razorpay";
import { verifyPaymentSignature, verifyWebhookSignature } from "./signature";
import type { CreateOrderInput, CreatedOrder, PaymentProvider } from "./provider";

export function createRazorpayProvider({
  keyId,
  keySecret,
  publicKeyId,
}: {
  keyId: string;
  keySecret: string;
  publicKeyId: string;
}): PaymentProvider {
  const client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();

  return {
    name: "razorpay",
    publicKeyId,
    canVerifyWebhooks: Boolean(webhookSecret),

    async createOrder({
      amountInPaise,
      currency,
      receipt,
      notes,
    }: CreateOrderInput): Promise<CreatedOrder> {
      const order = await client.orders.create({
        amount: amountInPaise,
        currency,
        // Razorpay caps the receipt at 40 characters and rejects a longer one outright.
        receipt: receipt.slice(0, 40),
        notes,
        /*
         * The order is captured automatically on success. The alternative, authorise-then-capture,
         * needs a second call the academy would have to remember to make, and an authorised
         * payment that is never captured is refunded by Razorpay days later with the student
         * believing they have a seat.
         */
        payment_capture: true,
      });

      return {
        orderId: order.id,
        amountInPaise: Number(order.amount),
        currency: String(order.currency),
      };
    },

    verifyPayment({ orderId, paymentId, signature }) {
      return verifyPaymentSignature({ orderId, paymentId, signature, secret: keySecret });
    },

    verifyWebhook({ rawBody, signature }) {
      if (!webhookSecret) return false;
      return verifyWebhookSignature({ rawBody, signature, secret: webhookSecret });
    },
  };
}
