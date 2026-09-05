/**
 * A course. Maps 1:1 to `Course` in content/data.ts, plus `isWorkshop`, `heroImage` and `seo`.
 *
 * Every field the client has not confirmed stays empty and the site renders a TBC state for it.
 * The publish rules below are the two the academy asked for in writing: a course page that names
 * no trainer and answers no questions is not ready to be public.
 */
import { defineArrayMember, defineField, defineType } from "sanity";

const LEVELS = [
  { title: "Foundation", value: "foundation" },
  { title: "Intermediate", value: "intermediate" },
  { title: "Professional", value: "professional" },
  { title: "IBC Junior", value: "junior" },
  { title: "IBC Advanced", value: "advanced" },
  { title: "Open level", value: "open" },
];

const SKILL_AREAS = [
  { title: "Barista skills", value: "barista-skills" },
  { title: "Latte art", value: "latte-art" },
  { title: "Brewing", value: "brewing" },
  { title: "Roasting and cupping", value: "roasting-cupping" },
  { title: "Sensory", value: "sensory" },
  { title: "Green coffee", value: "green-coffee" },
  { title: "Mixology", value: "mixology" },
  { title: "Cafe management", value: "cafe-management" },
];

export const course = defineType({
  name: "course",
  title: "Course",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "commercial", title: "Fee and format" },
    { name: "teaching", title: "Teaching" },
    { name: "search", title: "Search" },
  ],
  fields: [
    defineField({ name: "title", type: "string", group: "content", validation: (rule) => rule.required() }),
    defineField({
      name: "slug",
      type: "slug",
      group: "content",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "priority",
      title: "Order on the hub",
      type: "number",
      group: "content",
      description: "Lowest first.",
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({
      name: "skillArea",
      type: "string",
      group: "content",
      options: { list: SKILL_AREAS },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "level",
      type: "string",
      group: "content",
      options: { list: LEVELS },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "levelLabel",
      title: "Level, as printed on the page",
      type: "string",
      group: "content",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "isWorkshop",
      title: "Short workshop",
      type: "boolean",
      group: "content",
      initialValue: false,
      description: "Ticked, it appears on /workshops rather than only in the course ladder.",
    }),
    defineField({
      name: "outcome",
      title: "Outcome sentence",
      type: "text",
      rows: 2,
      group: "content",
      description: "One sentence, outcome-led. No claim that is not in content/facts.md.",
      validation: (rule) => rule.required().max(220),
    }),
    defineField({
      name: "forWhom",
      title: "Who this is for",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "string" })],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "notForWhom",
      title: "Who this is not for",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "string" })],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "modules",
      title: "What you will learn",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "string" })],
      description: "Leave empty until the syllabus is confirmed; the page shows a TBC panel.",
    }),
    defineField({
      name: "includes",
      title: "What the fee includes",
      type: "array",
      group: "commercial",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({
      name: "prerequisites",
      type: "text",
      rows: 2,
      group: "content",
      description: "Shown on the checkout as a confirmation the student has to tick.",
    }),
    defineField({
      name: "certification",
      type: "reference",
      group: "content",
      to: [{ type: "certification" }],
    }),
    defineField({
      name: "certificateAwardedLabel",
      title: "Certificate awarded, exact wording",
      type: "string",
      group: "content",
      description:
        'Never "SCA-certified course" while AST status is unconfirmed. Use "training aligned to the SCA Coffee Skills Program".',
    }),
    defineField({
      name: "format",
      type: "string",
      group: "commercial",
      options: {
        list: [
          { title: "In person", value: "in-person" },
          { title: "Hybrid", value: "hybrid" },
          { title: "Online", value: "online" },
        ],
      },
    }),
    defineField({ name: "durationDays", title: "Duration (days)", type: "number", group: "commercial", validation: (rule) => rule.positive() }),
    defineField({ name: "durationHours", title: "Duration (hours)", type: "number", group: "commercial", validation: (rule) => rule.positive() }),
    defineField({
      name: "feeInclGst",
      title: "Fee incl. GST (₹)",
      type: "number",
      group: "commercial",
      description:
        "Whole rupees, not paise. The server multiplies by 100 when it creates a Razorpay order, and never reads an amount from the browser.",
      validation: (rule) => rule.integer().positive(),
    }),
    defineField({ name: "emiAvailable", title: "EMI available", type: "boolean", group: "commercial" }),
    defineField({
      name: "seatsMax",
      title: "Default seats per batch",
      type: "number",
      group: "commercial",
      description: "A batch can override this. Used as the initial value when a batch is created.",
      validation: (rule) => rule.integer().min(1),
    }),
    defineField({
      name: "trainers",
      type: "array",
      group: "teaching",
      of: [defineArrayMember({ type: "reference", to: [{ type: "trainer" }] })],
    }),
    defineField({
      name: "nextInLadder",
      title: "Next course in the ladder",
      type: "reference",
      group: "teaching",
      to: [{ type: "course" }],
    }),
    defineField({
      name: "faq",
      title: "Course questions",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "faqEntry" })],
    }),
    defineField({ name: "heroImage", type: "brandImage", group: "content" }),
    defineField({
      name: "heroAlt",
      title: "Fallback alt text",
      type: "string",
      group: "content",
      description: "Used on the branded placeholder until a photograph exists.",
      validation: (rule) => rule.required().min(10).max(125),
    }),
    defineField({ name: "seo", type: "seoFields", group: "search" }),
  ],
  /**
   * Publish gates. `Rule.custom` runs on the whole document, which is the only place a rule can
   * see two fields at once.
   */
  validation: (rule) =>
    rule.custom((doc) => {
      const trainers = (doc as { trainers?: unknown[] } | undefined)?.trainers ?? [];
      const faq = (doc as { faq?: unknown[] } | undefined)?.faq ?? [];
      if (trainers.length < 1) return "Assign at least one trainer before publishing.";
      if (faq.length < 4) return "Answer at least four questions before publishing.";
      return true;
    }),
  preview: {
    select: { title: "title", subtitle: "levelLabel", media: "heroImage" },
  },
  orderings: [
    { name: "priority", title: "Hub order", by: [{ field: "priority", direction: "asc" }] },
    { name: "title", title: "Title", by: [{ field: "title", direction: "asc" }] },
  ],
});
