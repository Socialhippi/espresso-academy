/** A trainer. Role and philosophy stay empty until the academy sends them; both render as TBC. */
import { defineArrayMember, defineField, defineType } from "sanity";

export const trainer = defineType({
  name: "trainer",
  title: "Trainer",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "role", type: "string", description: "Leave empty until confirmed." }),
    defineField({
      name: "credentials",
      type: "array",
      of: [defineArrayMember({ type: "credential" })],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "bio",
      type: "text",
      rows: 4,
      description: "Third person, 80 words or fewer, only facts from content/facts.md.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "philosophy",
      title: "In their own words",
      type: "text",
      rows: 3,
      description: "From a short interview. Empty renders a TBC panel.",
    }),
    defineField({ name: "image", type: "brandImage" }),
    defineField({
      name: "sameAs",
      title: "Profile URLs",
      type: "array",
      of: [defineArrayMember({ type: "url" })],
      description: "Used in Person JSON-LD.",
    }),
  ],
  preview: { select: { title: "name", subtitle: "role", media: "image" } },
});
