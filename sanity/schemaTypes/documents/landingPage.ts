/**
 * A campaign landing page. Always noindex: these exist for paid traffic, they duplicate the
 * course pages by design, and an indexed duplicate would compete with the page it was copied from.
 * The field is present and locked rather than absent, so the reason is visible in the Studio.
 */
import { defineField, defineType } from "sanity";
import { landingSectionMembers } from "../objects/sections";

export const landingPage = defineType({
  name: "landingPage",
  title: "Landing page",
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
      name: "campaign",
      type: "string",
      description: "The campaign this page is for, matching the utm_campaign you will send.",
    }),
    defineField({ name: "course", type: "reference", to: [{ type: "course" }] }),
    defineField({
      name: "sections",
      type: "array",
      of: landingSectionMembers,
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "noindex",
      type: "boolean",
      initialValue: true,
      readOnly: true,
      description: "Always on. A campaign page must not compete with the course page it copies.",
    }),
  ],
  preview: { select: { title: "title", subtitle: "campaign" } },
});
