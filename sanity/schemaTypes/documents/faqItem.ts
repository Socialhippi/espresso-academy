/** A site-wide question, grouped by category on /faq and reused on hubs. */
import { defineField, defineType } from "sanity";

export const faqItem = defineType({
  name: "faqItem",
  title: "Question",
  type: "document",
  fields: [
    defineField({ name: "q", title: "Question", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "a", title: "Answer", type: "text", rows: 4, validation: (rule) => rule.required() }),
    defineField({
      name: "category",
      type: "string",
      options: {
        list: [
          { title: "Courses", value: "courses" },
          { title: "Fees", value: "fees" },
          { title: "Certification", value: "certification" },
          { title: "Schedule", value: "schedule" },
          { title: "Campus", value: "campus" },
          { title: "Careers", value: "careers" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "link", type: "linkRef" }),
    defineField({
      name: "order",
      type: "number",
      description: "Lowest first within a category.",
      initialValue: 1,
    }),
  ],
  preview: { select: { title: "q", subtitle: "category" } },
  orderings: [{ name: "order", title: "Order", by: [{ field: "order", direction: "asc" }] }],
});
