/**
 * A guide: the long-form answer pages the site is meant to be quoted from.
 *
 * `author` and `reviewedBy` are separate on purpose. A page that says who wrote it and who checked
 * it, with the date, is the difference between an article and a claim, and it is what the Article
 * structured data on the page asserts.
 */
import { defineField, defineType } from "sanity";

export const guide = defineType({
  name: "guide",
  title: "Guide",
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
      name: "excerpt",
      type: "text",
      rows: 3,
      description: "The answer, in one or two sentences. Shown on the hub and used as the description.",
      validation: (rule) => rule.required().max(320),
    }),
    defineField({ name: "body", type: "guideBody" }),
    defineField({ name: "author", type: "reference", to: [{ type: "trainer" }], validation: (rule) => rule.required() }),
    defineField({
      name: "reviewedBy",
      title: "Reviewed by",
      type: "reference",
      to: [{ type: "trainer" }],
      description: "Who checked the facts. Shown on the page with the date.",
    }),
    defineField({ name: "publishedAt", type: "datetime", validation: (rule) => rule.required() }),
    defineField({ name: "updatedAt", type: "datetime" }),
    defineField({ name: "primaryCourse", type: "reference", to: [{ type: "course" }] }),
    defineField({ name: "primaryCertification", type: "reference", to: [{ type: "certification" }] }),
    defineField({ name: "heroImage", type: "brandImage" }),
    defineField({ name: "seo", type: "seoFields" }),
  ],
  preview: { select: { title: "title", subtitle: "excerpt", media: "heroImage" } },
  orderings: [{ name: "publishedDesc", title: "Newest first", by: [{ field: "publishedAt", direction: "desc" }] }],
});
