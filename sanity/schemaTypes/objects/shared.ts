/**
 * Objects reused across several document types.
 *
 * Every rule here exists because the site renders the value verbatim: an alt text that is two
 * characters long is worse than no image, and a fee stored in paise would be multiplied by 100 a
 * second time at order creation.
 */
import { defineArrayMember, defineField, defineType } from "sanity";

/** An image with a required, length-checked alt. There is no decorative image in this design. */
export const brandImage = defineType({
  name: "brandImage",
  title: "Image",
  type: "image",
  options: { hotspot: true },
  fields: [
    defineField({
      name: "alt",
      title: "Alt text",
      type: "string",
      description:
        "What the photograph shows, for a screen reader and for search. 10 to 125 characters.",
      validation: (rule) => rule.required().min(10).max(125),
    }),
  ],
});

/** One line of a trainer's credentials. Issuer is optional: not every credential has one. */
export const credential = defineType({
  name: "credential",
  title: "Credential",
  type: "object",
  fields: [
    defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "issuer", type: "string" }),
  ],
  preview: {
    select: { title: "name", subtitle: "issuer" },
  },
});

/** A labelled internal link. Never "click here": the label is the anchor text. */
export const linkRef = defineType({
  name: "linkRef",
  title: "Link",
  type: "object",
  fields: [
    defineField({ name: "label", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "href",
      type: "string",
      description: "A site-relative path, for example /courses or /certifications/…",
      validation: (rule) =>
        rule.required().custom((value) =>
          typeof value === "string" && value.startsWith("/")
            ? true
            : "Use a site-relative path starting with /",
        ),
    }),
  ],
  preview: { select: { title: "label", subtitle: "href" } },
});

/** A question and its answer, with an optional deep link. Used inline on courses and guides. */
/**
 * One day of a course: a number, a title and the topics covered.
 *
 * The number is stored rather than derived from the array index because it is the anchor a
 * redirect lands on (/courses/latte-art now points at #day-4), and an anchor that moves when an
 * editor reorders the array is an anchor that breaks a link somebody already published.
 */
export const courseDay = defineType({
  name: "courseDay",
  title: "Day",
  type: "object",
  fields: [
    defineField({
      name: "number",
      title: "Day number",
      type: "number",
      description: "1 for the first day. Used as the #day-N anchor, so it must not change once published.",
      validation: (rule) => rule.required().integer().min(1),
    }),
    defineField({ name: "title", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "topics",
      type: "array",
      of: [defineArrayMember({ type: "string" })],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: { number: "number", title: "title", topics: "topics" },
    prepare: ({ number, title, topics }) => ({
      title: `Day ${number ?? "?"}: ${title ?? ""}`,
      subtitle: `${(topics ?? []).length} topics`,
    }),
  },
});

export const faqEntry = defineType({
  name: "faqEntry",
  title: "Question",
  type: "object",
  fields: [
    defineField({ name: "q", title: "Question", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "a", title: "Answer", type: "text", rows: 4, validation: (rule) => rule.required() }),
    defineField({ name: "link", type: "linkRef" }),
  ],
  preview: { select: { title: "q" } },
});

/** Per-page search metadata. Both are optional: the site derives sensible defaults. */
export const seoFields = defineType({
  name: "seoFields",
  title: "Search appearance",
  type: "object",
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: "title",
      type: "string",
      description: "50 to 60 characters including the site suffix. Leave empty to derive it.",
      validation: (rule) => rule.max(60),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 3,
      description: "140 to 160 characters. Leave empty to derive it.",
      validation: (rule) => rule.max(180),
    }),
  ],
});

/**
 * Where a lead or a booking came from. Written by the server from the request, never by an
 * editor, which is why every field is read-only in the Studio.
 */
export const attributionSource = defineType({
  name: "attributionSource",
  title: "Source",
  type: "object",
  readOnly: true,
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({ name: "utm_source", type: "string" }),
    defineField({ name: "utm_medium", type: "string" }),
    defineField({ name: "utm_campaign", type: "string" }),
    defineField({ name: "gclid", type: "string" }),
    defineField({ name: "fbclid", type: "string" }),
    defineField({ name: "referrer", type: "string" }),
    defineField({ name: "landingPage", type: "string" }),
  ],
});

/** The campus address, kept as one object so the site and the JSON-LD cannot disagree. */
export const postalAddress = defineType({
  name: "postalAddress",
  title: "Address",
  type: "object",
  fields: [
    defineField({ name: "line1", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "line2", type: "string" }),
    defineField({ name: "city", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "postalCode", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "region", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "country", type: "string", initialValue: "IN", validation: (rule) => rule.required() }),
    defineField({
      name: "plotNumberConfirmed",
      title: "Plot number confirmed by the academy",
      type: "boolean",
      initialValue: false,
      description:
        "The brochure and the current website disagree about the plot number. Until this is ticked the site does not treat the address as verified.",
    }),
    defineField({ name: "mapsUrl", title: "Google Maps URL", type: "url" }),
  ],
});

/** A rule the site enforces in several places: a slug that is unique within its type. */
export const slugField = defineField({
  name: "slug",
  type: "slug",
  options: { source: "title", maxLength: 96 },
  validation: (rule) => rule.required(),
});

export const sharedObjects = [
  brandImage,
  credential,
  linkRef,
  courseDay,
  faqEntry,
  seoFields,
  attributionSource,
  postalAddress,
];

/** Re-exported so array fields can build members without importing `sanity` again. */
export { defineArrayMember };
