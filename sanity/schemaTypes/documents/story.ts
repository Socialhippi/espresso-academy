/**
 * A student story. `permission` gates publication: every query filters on it, so a story without
 * written permission is invisible to the site no matter what else is filled in.
 */
import { defineField, defineType } from "sanity";

export const story = defineType({
  name: "story",
  title: "Student story",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "course", type: "reference", to: [{ type: "course" }] }),
    defineField({ name: "outcome", type: "string", description: "Where they are now, in their words." }),
    defineField({ name: "quote", type: "text", rows: 4, validation: (rule) => rule.required() }),
    defineField({ name: "image", type: "brandImage" }),
    defineField({
      name: "permission",
      title: "Written permission received",
      type: "boolean",
      initialValue: false,
      description:
        "The site shows nothing until this is ticked. content/facts.md forbids publishing a testimonial without permission.",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "outcome", permission: "permission", media: "image" },
    prepare: ({ title, subtitle, permission, media }) => ({
      title,
      subtitle: `${permission ? "Published" : "No permission yet"}${subtitle ? ` · ${subtitle}` : ""}`,
      media,
    }),
  },
});
