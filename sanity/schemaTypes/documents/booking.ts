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
      title: "Amount (₹)",
      type: "number",
      readOnly: true,
      description: "Whole rupees, as computed by the server from the batch or course fee.",
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
    defineField({ name: "notes", type: "text", rows: 3, description: "The only free field. Anything the academy needs to remember about this booking." }),
  ],
  preview: {
    select: { name: "name", status: "status", amount: "amount", course: "course.title", overbooked: "overbooked" },
    prepare: ({ name, status, amount, course, overbooked }) => ({
      title: `${name ?? "Booking"}${overbooked ? " ⚠ overbooked" : ""}`,
      subtitle: `${status ?? ""} · ₹${amount ?? "?"} · ${course ?? ""}`,
    }),
  },
  orderings: [{ name: "newest", title: "Newest first", by: [{ field: "createdAt", direction: "desc" }] }],
});
