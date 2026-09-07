/**
 * An enquiry: a lead, a waitlist join or a cafe request.
 *
 * The submission itself is read-only; `status`, `assignedTo` and `notes` are the academy's
 * working fields. Sanity is written first and the response to the student depends only on that
 * write, so a lead is never lost because an email provider was slow.
 */
import { defineField, defineType } from "sanity";

export const enquiry = defineType({
  name: "enquiry",
  title: "Enquiry",
  type: "document",
  fields: [
    defineField({
      name: "type",
      type: "string",
      readOnly: true,
      options: {
        list: [
          { title: "Student", value: "student" },
          { title: "Waitlist", value: "waitlist" },
          { title: "Cafe or team", value: "cafe" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "name", type: "string", readOnly: true }),
    defineField({ name: "phone", type: "string", readOnly: true }),
    defineField({ name: "email", type: "string", readOnly: true }),
    defineField({ name: "course", type: "reference", to: [{ type: "course" }], readOnly: true }),
    defineField({ name: "instance", title: "Batch", type: "reference", to: [{ type: "courseInstance" }], readOnly: true }),
    defineField({ name: "message", type: "text", rows: 4, readOnly: true }),
    defineField({ name: "source", type: "attributionSource" }),
    defineField({
      name: "status",
      type: "string",
      initialValue: "new",
      options: {
        list: [
          { title: "New", value: "new" },
          { title: "Contacted", value: "contacted" },
          { title: "Converted", value: "converted" },
          { title: "Closed", value: "closed" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "assignedTo", type: "string", description: "Who is following this up." }),
    defineField({ name: "notes", type: "text", rows: 3 }),
    defineField({ name: "createdAt", type: "datetime", readOnly: true }),
    /*
     * Set by the server when the lead was stored but the email about it was not sent. Read-only:
     * it is a record of what happened, not a field to manage. `scripts/lead-failures.mjs` counts
     * these nightly so a quiet integration failure cannot run for a week unnoticed.
     */
    defineField({
      name: "deliveryFailed",
      title: "Delivery failed",
      type: "boolean",
      readOnly: true,
      description: "The academy was not emailed about this enquiry. It is safe here regardless.",
    }),
    defineField({
      name: "deliveryFailedParts",
      title: "Which parts failed",
      type: "array",
      of: [{ type: "string" }],
      readOnly: true,
    }),
  ],
  preview: {
    select: { name: "name", type: "type", status: "status", course: "course.title", createdAt: "createdAt" },
    prepare: ({ name, type, status, course, createdAt }) => ({
      title: `${name ?? "Enquiry"} · ${type ?? ""}`,
      subtitle: [status, course, createdAt ? new Date(createdAt as string).toLocaleDateString("en-IN") : null]
        .filter(Boolean)
        .join(" · "),
    }),
  },
  orderings: [{ name: "newest", title: "Newest first", by: [{ field: "createdAt", direction: "desc" }] }],
});
