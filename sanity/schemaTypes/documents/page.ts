/** A content page assembled from the section library. /for-cafes is one of these. */
import { defineField, defineType } from "sanity";
import { pageSectionMembers } from "../objects/sections";

export const page = defineType({
  name: "page",
  title: "Page",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "intro",
      type: "text",
      rows: 3,
      description: "The sentence under the H1.",
    }),
    defineField({
      name: "sections",
      type: "array",
      of: pageSectionMembers,
      validation: (rule) => rule.required().min(1),
    }),
    defineField({ name: "seo", type: "seoFields" }),
  ],
  preview: { select: { title: "title", subtitle: "slug.current" } },
});
