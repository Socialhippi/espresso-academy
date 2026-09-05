/**
 * A certification the courses lead to. `status` decides how the site labels the certificate cell
 * on a course page: "confirmed" prints "Certificate", "wording-pending" prints "Programme",
 * because content/facts.md forbids implying an SCA certification the academy cannot yet claim.
 */
import { defineArrayMember, defineField, defineType } from "sanity";

export const certification = defineType({
  name: "certification",
  title: "Certification",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "shortName", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "issuer", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "summary", type: "text", rows: 4, validation: (rule) => rule.required() }),
    defineField({
      name: "levels",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "recognitionNote",
      title: "Honesty clause",
      type: "text",
      rows: 3,
      description: "A certificate helps you get an interview; your skills get you the job.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "status",
      type: "string",
      initialValue: "wording-pending",
      options: {
        list: [
          { title: "Confirmed: the academy issues this certificate", value: "confirmed" },
          { title: "Wording pending: describe it as a programme", value: "wording-pending" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "seo", type: "seoFields" }),
  ],
  preview: { select: { title: "name", subtitle: "issuer" } },
});
