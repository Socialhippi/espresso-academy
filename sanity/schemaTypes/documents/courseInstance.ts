/**
 * A batch: one scheduled run of a course at a venue.
 *
 * `seatsBooked` is maintained by the payment webhook inside a transaction guarded by this
 * document's revision id, never by an editor and never by the browser. Seats available is derived
 * in the query (`seatsMax - seatsBooked`) rather than stored, so there is one number to be wrong
 * about instead of two.
 */
import { defineField, defineType } from "sanity";

export const courseInstance = defineType({
  name: "courseInstance",
  title: "Batch",
  type: "document",
  fields: [
    defineField({
      name: "course",
      type: "reference",
      to: [{ type: "course" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "status",
      type: "string",
      initialValue: "tbc",
      options: {
        list: [
          { title: "Open", value: "open" },
          { title: "Waitlist", value: "waitlist" },
          { title: "Sold out", value: "soldout" },
          { title: "Completed", value: "completed" },
          { title: "Dates to be confirmed", value: "tbc" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "startDate",
      title: "Start date",
      type: "date",
      options: { dateFormat: "DD MMM YYYY" },
      description: "Leave empty while the date is unconfirmed; the site shows a TBC state.",
      validation: (rule) =>
        rule.custom((value, context) => {
          const status = (context.document as { status?: string } | undefined)?.status;
          if (!value || status === "completed") return true;
          const today = new Date().toISOString().slice(0, 10);
          return value >= today ? true : "A batch that has not been marked completed cannot start in the past.";
        }),
    }),
    defineField({ name: "endDate", title: "End date", type: "date", options: { dateFormat: "DD MMM YYYY" } }),
    defineField({
      name: "schedule",
      type: "string",
      description: 'For example "Mon to Fri, 10am to 4pm".',
    }),
    defineField({ name: "venue", type: "reference", to: [{ type: "venue" }] }),
    defineField({
      name: "seatsMax",
      title: "Seats",
      type: "number",
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({
      name: "seatsBooked",
      title: "Seats booked",
      type: "number",
      initialValue: 0,
      readOnly: true,
      description: "Maintained by the payment webhook. Read-only here on purpose.",
      validation: (rule) => rule.integer().min(0),
    }),
    defineField({
      name: "priceOverride",
      title: "Fee for this batch incl. GST (₹)",
      type: "number",
      description: "Overrides the course fee for this batch only. Whole rupees.",
      validation: (rule) => rule.integer().positive(),
    }),
    defineField({ name: "notes", type: "text", rows: 3 }),
  ],
  preview: {
    select: {
      course: "course.title",
      startDate: "startDate",
      status: "status",
      seatsMax: "seatsMax",
      seatsBooked: "seatsBooked",
    },
    prepare({ course, startDate, status, seatsMax, seatsBooked }) {
      const when = startDate
        ? new Date(`${startDate}T00:00:00Z`).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          })
        : "Date TBC";
      const seats = typeof seatsMax === "number" ? `${seatsBooked ?? 0}/${seatsMax} booked` : "seats TBC";
      return {
        title: `${course ?? "Course"} — ${when}`,
        subtitle: `${status ?? "tbc"} · ${seats}`,
      };
    },
  },
  orderings: [
    { name: "startAsc", title: "Soonest first", by: [{ field: "startDate", direction: "asc" }] },
    { name: "startDesc", title: "Latest first", by: [{ field: "startDate", direction: "desc" }] },
  ],
});
