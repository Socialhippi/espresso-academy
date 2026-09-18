/**
 * A booking: the record of a payment that either happened or did not.
 *
 * Everything except `status` and `notes` is read-only in the Studio. A booking is a mirror of
 * something that happened at a payment gateway; an editor changing an amount or a payment id
 * after the fact would make the two disagree and there would be no way to tell which was right.
 * A refund is issued in the Razorpay dashboard and reflected here by setting the status.
 */
import { defineField, defineType } from "sanity";

export const booking = defineType({
  name: "booking",
  title: "Booking",
  type: "document",
  fields: [
    defineField({ name: "instance", title: "Batch", type: "reference", to: [{ type: "courseInstance" }], readOnly: true }),
    defineField({ name: "course", type: "reference", to: [{ type: "course" }], readOnly: true }),
    defineField({ name: "name", type: "string", readOnly: true }),
    defineField({ name: "phone", type: "string", readOnly: true }),
    defineField({ name: "email", type: "string", readOnly: true }),
    defineField({
      name: "amount",
      title: "Amount taken (₹)",
      type: "number",
      readOnly: true,
      description:
        "Whole rupees, before GST, as computed by the server from the batch or course fee. On the ordinary path this is the ₹5,000 advance, not the whole fee.",
    }),
    /*
     * The three fields below exist because "amount" alone stopped being the whole story when the
     * checkout moved to the academy's advance model. A booking has to record what the fee was on
     * the day it was taken, not just what was charged: the fee can change, the offer can end, and
     * a student who paid an advance in September is owed the balance that was quoted then.
     */
    defineField({
      name: "paymentType",
      title: "What was paid",
      type: "string",
      readOnly: true,
      initialValue: "advance",
      options: {
        list: [
          { title: "Advance, balance due at the academy", value: "advance" },
          { title: "Full fee, paid online", value: "full" },
        ],
        layout: "radio",
      },
    }),
    defineField({
      name: "courseFeeExGst",
      title: "Course fee at the time of booking (₹, before GST)",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "balanceDueExGst",
      title: "Balance due at the academy (₹, before GST)",
      type: "number",
      readOnly: true,
      description: "Course fee minus the amount taken. Stated on the confirmation page and email.",
    }),
    defineField({
      name: "gstRate",
      title: "GST rate at the time of booking (%)",
      type: "number",
      readOnly: true,
      description: "Empty means the rate was not confirmed when this booking was taken.",
    }),
    defineField({ name: "currency", type: "string", readOnly: true, initialValue: "INR" }),
    defineField({ name: "razorpayOrderId", title: "Razorpay order id", type: "string", readOnly: true }),
    defineField({
      name: "razorpayPaymentId",
      title: "Razorpay payment id",
      type: "string",
      readOnly: true,
      description: "Unique. It is what makes the webhook idempotent.",
    }),
    defineField({
      name: "status",
      type: "string",
      initialValue: "created",
      options: {
        list: [
          { title: "Created, not paid", value: "created" },
          { title: "Paid", value: "paid" },
          { title: "Failed", value: "failed" },
          { title: "Refunded", value: "refunded" },
          { title: "Cancelled", value: "cancelled" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "prerequisiteAccepted", type: "boolean", readOnly: true }),
    defineField({
      name: "overbooked",
      type: "boolean",
      readOnly: true,
      initialValue: false,
      description:
        "Set when the payment succeeded after the last seat went. The academy resolves it by hand; the student is never blocked at the gateway.",
    }),
    defineField({ name: "source", type: "attributionSource" }),
    defineField({ name: "createdAt", type: "datetime", readOnly: true }),
    defineField({ name: "paidAt", type: "datetime", readOnly: true }),
    defineField({
      name: "notifiedAt",
      title: "Notified at",
      type: "datetime",
      readOnly: true,
      description:
        "When the confirmation actually went out. Set by whichever of the verify call and the payment.captured webhook claims it first, and only kept when at least one email was delivered — so an empty value on a paid booking means nobody was told, and it is safe to resend.",
    }),
    defineField({ name: "notes", type: "text", rows: 3, description: "The only free field. Anything the academy needs to remember about this booking." }),
  ],
  preview: {
    select: {
      name: "name",
      status: "status",
      amount: "amount",
      balance: "balanceDueExGst",
      course: "course.title",
      overbooked: "overbooked",
    },
    prepare: ({ name, status, amount, balance, course, overbooked }) => ({
      title: `${name ?? "Booking"}${overbooked ? " ⚠ overbooked" : ""}`,
      /* The balance is in the subtitle because the roster is where the academy checks who still
         owes money on the morning of a batch. */
      subtitle: `${status ?? ""} · ₹${amount ?? "?"} paid${
        typeof balance === "number" && balance > 0 ? `, ₹${balance} + GST due` : ""
      } · ${course ?? ""}`,
    }),
  },
  orderings: [{ name: "newest", title: "Newest first", by: [{ field: "createdAt", direction: "desc" }] }],
});
