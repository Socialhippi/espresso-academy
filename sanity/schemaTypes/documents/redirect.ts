/**
 * A redirect, read by next.config.ts at build time. Kept in Sanity so the academy can retire a
 * URL without a deploy from a developer; it does need a rebuild, which the runbook explains.
 */
import { defineField, defineType } from "sanity";

export const redirect = defineType({
  name: "redirect",
  title: "Redirect",
  type: "document",
  fields: [
    defineField({
      name: "from",
      type: "string",
      description: "Site-relative, for example /old-course.",
      validation: (rule) =>
        rule.required().custom((value) =>
          typeof value === "string" && value.startsWith("/") ? true : "Start with /",
        ),
    }),
    defineField({
      name: "to",
      type: "string",
      description: "Site-relative or absolute.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "permanent",
      type: "boolean",
      initialValue: true,
      description: "Permanent sends 308 and is cached by browsers. Temporary sends 307.",
    }),
  ],
  preview: {
    select: { title: "from", subtitle: "to", permanent: "permanent" },
    prepare: ({ title, subtitle, permanent }) => ({
      title,
      subtitle: `${permanent ? "308" : "307"} → ${subtitle}`,
    }),
  },
});
