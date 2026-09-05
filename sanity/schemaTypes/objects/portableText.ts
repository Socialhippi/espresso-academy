/**
 * The body of a guide.
 *
 * The block set is deliberately small and answer-shaped, because these pages exist to be quoted:
 * a question as an H2, an answer-first paragraph under it, a table when the answer is a
 * comparison, and an FAQ block that becomes FAQPage structured data. There is no free-form HTML
 * and no image-with-text-over-it, both of which the design rules forbid.
 */
import { defineArrayMember, defineField, defineType } from "sanity";

/** A short aside. Never red text on a dark ground: the renderer picks the pair, not the editor. */
export const calloutBlock = defineType({
  name: "calloutBlock",
  title: "Callout",
  type: "object",
  fields: [
    defineField({
      name: "tone",
      type: "string",
      initialValue: "note",
      options: {
        list: [
          { title: "Note", value: "note" },
          { title: "Watch out", value: "warning" },
        ],
        layout: "radio",
      },
    }),
    defineField({ name: "title", type: "string" }),
    defineField({ name: "body", type: "text", rows: 3, validation: (rule) => rule.required() }),
  ],
  preview: { select: { title: "title", subtitle: "body" } },
});

/** A comparison table. Rows are pipe-free strings; the renderer builds the scroll container. */
export const evidenceTableBlock = defineType({
  name: "evidenceTableBlock",
  title: "Evidence table",
  type: "object",
  fields: [
    defineField({ name: "caption", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "columns",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      validation: (rule) => rule.required().min(2).max(5),
    }),
    defineField({
      name: "rows",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "tableRow",
          fields: [
            defineField({
              name: "cells",
              type: "array",
              of: [defineArrayMember({ type: "string" })],
              validation: (rule) => rule.required().min(2),
            }),
          ],
          preview: {
            select: { cells: "cells" },
            prepare: ({ cells }) => ({ title: (cells as string[] | undefined)?.join(" · ") ?? "Row" }),
          },
        }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: { select: { title: "caption" } },
});

/** A run of questions rendered as an accordion and emitted as FAQPage JSON-LD. */
export const faqBlock = defineType({
  name: "faqBlock",
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
      title: heading ?? "Questions",
      subtitle: `${(items as unknown[] | undefined)?.length ?? 0} questions`,
    }),
  },
});

export const guideBody = defineType({
  name: "guideBody",
  title: "Body",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      // H1 is the page title; a body that could set its own would break the heading order.
      styles: [
        { title: "Paragraph", value: "normal" },
        { title: "Question (H2)", value: "h2" },
        { title: "Sub-heading (H3)", value: "h3" },
        { title: "Quote", value: "blockquote" },
      ],
      lists: [
        { title: "Bulleted", value: "bullet" },
        { title: "Numbered", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Bold", value: "strong" },
          { title: "Italic", value: "em" },
        ],
        annotations: [
          {
            name: "link",
            type: "object",
            title: "Link",
            fields: [
              defineField({
                name: "href",
                type: "string",
                validation: (rule) => rule.required(),
              }),
            ],
          },
        ],
      },
    }),
    defineArrayMember({ type: "brandImage" }),
    defineArrayMember({ type: "calloutBlock" }),
    defineArrayMember({ type: "evidenceTableBlock" }),
    defineArrayMember({ type: "faqBlock" }),
  ],
});

export const portableTextObjects = [calloutBlock, evidenceTableBlock, faqBlock, guideBody];
