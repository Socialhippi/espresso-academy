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
    /*
     * Next's `permanent` flag only offers 308 and 307. Both preserve the request method, which is
     * the correct modern behaviour, but a retired course URL is a GET that search engines have
     * indexed and the academy asked for 301 by name. This field wins over `permanent` when it is
     * set, so the ordinary case stays a one-tick boolean and the exceptions are explicit.
     */
    defineField({
      name: "statusCode",
      title: "Status code",
      type: "number",
      description: "Optional. Overrides the permanent flag. 301 and 302 are the classic pair; 307 and 308 preserve the method.",
      options: {
        list: [
          { title: "301 Moved Permanently", value: 301 },
          { title: "302 Found", value: 302 },
          { title: "307 Temporary Redirect", value: 307 },
          { title: "308 Permanent Redirect", value: 308 },
        ],
      },
    }),
  ],
  preview: {
    select: { title: "from", subtitle: "to", permanent: "permanent", statusCode: "statusCode" },
    prepare: ({ title, subtitle, permanent, statusCode }) => ({
      title,
      subtitle: `${statusCode ?? (permanent ? 308 : 307)} → ${subtitle}`,
    }),
  },
});
