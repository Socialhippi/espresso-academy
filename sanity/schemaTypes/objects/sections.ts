/**
 * The section library.
 *
 * A `page` is not a free canvas: it is a list drawn from these five shapes. The constraint is the
 * point. Every section here already has a reviewed layout in src/components, so an editor cannot
 * build a page that fails the design rules, and a new page needs no design review of its own.
 */
import { defineArrayMember, defineField, defineType } from "sanity";

export const heroSection = defineType({
  name: "heroSection",
  title: "Hero",
  type: "object",
  fields: [
    defineField({ name: "eyebrow", type: "string" }),
    defineField({ name: "heading", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "body", type: "text", rows: 3 }),
    defineField({ name: "primaryCta", type: "linkRef" }),
    defineField({ name: "image", type: "brandImage" }),
  ],
  preview: { select: { title: "heading" }, prepare: ({ title }) => ({ title: `Hero — ${title}` }) },
});

export const richTextSection = defineType({
  name: "richTextSection",
  title: "Text",
  type: "object",
  fields: [
    defineField({ name: "eyebrow", type: "string" }),
    defineField({ name: "heading", type: "string" }),
    defineField({ name: "body", type: "guideBody", validation: (rule) => rule.required() }),
  ],
  preview: { select: { title: "heading" }, prepare: ({ title }) => ({ title: `Text — ${title ?? ""}` }) },
});

export const offerSection = defineType({
  name: "offerSection",
  title: "Offer",
  type: "object",
  fields: [
    defineField({ name: "eyebrow", type: "string" }),
    defineField({ name: "heading", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "body", type: "text", rows: 3 }),
    defineField({
      name: "points",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      validation: (rule) => rule.min(1).max(6),
    }),
    defineField({ name: "cta", type: "linkRef" }),
  ],
  preview: { select: { title: "heading" }, prepare: ({ title }) => ({ title: `Offer — ${title}` }) },
});

export const proofSection = defineType({
  name: "proofSection",
  title: "Proof",
  type: "object",
  fields: [
    defineField({ name: "heading", type: "string" }),
    defineField({
      name: "facts",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "proofFact",
          fields: [
            defineField({ name: "value", type: "string", validation: (rule) => rule.required() }),
            defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
          ],
          preview: { select: { title: "value", subtitle: "label" } },
        }),
      ],
      validation: (rule) => rule.min(2).max(5),
    }),
  ],
  preview: { select: { title: "heading" }, prepare: ({ title }) => ({ title: `Proof — ${title ?? ""}` }) },
});

export const formSection = defineType({
  name: "formSection",
  title: "Form",
  type: "object",
  fields: [
    defineField({ name: "heading", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "body", type: "text", rows: 3 }),
    defineField({
      name: "variant",
      type: "string",
      initialValue: "student",
      options: {
        list: [
          { title: "Student enquiry", value: "student" },
          { title: "Cafe or team", value: "cafe" },
        ],
        layout: "radio",
      },
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { select: { title: "heading", subtitle: "variant" } },
});

export const faqSection = defineType({
  name: "faqSection",
  title: "Questions",
  type: "object",
  fields: [
    defineField({ name: "heading", type: "string", initialValue: "Common questions" }),
    defineField({
      name: "items",
      type: "array",
      of: [defineArrayMember({ type: "faqEntry" })],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: { heading: "heading", items: "items" },
    prepare: ({ heading, items }) => ({
      title: `Questions — ${heading ?? ""}`,
      subtitle: `${(items as unknown[] | undefined)?.length ?? 0} questions`,
    }),
  },
});

export const sectionObjects = [
  heroSection,
  richTextSection,
  offerSection,
  proofSection,
  formSection,
  faqSection,
];

/** The five section types a landing page may use, in the order the brief names them. */
export const landingSectionMembers = [
  defineArrayMember({ type: "heroSection" }),
  defineArrayMember({ type: "offerSection" }),
  defineArrayMember({ type: "proofSection" }),
  defineArrayMember({ type: "formSection" }),
  defineArrayMember({ type: "faqSection" }),
];

/** A content page may also use prose. */
export const pageSectionMembers = [
  defineArrayMember({ type: "heroSection" }),
  defineArrayMember({ type: "richTextSection" }),
  defineArrayMember({ type: "offerSection" }),
  defineArrayMember({ type: "proofSection" }),
  defineArrayMember({ type: "formSection" }),
  defineArrayMember({ type: "faqSection" }),
];
