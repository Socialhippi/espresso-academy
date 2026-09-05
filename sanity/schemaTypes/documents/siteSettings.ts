/**
 * The singleton. Everything the site says about itself in more than one place lives here, so the
 * footer, the JSON-LD, the WhatsApp link and the confirmation email cannot disagree.
 *
 * The fields that are `null` today are the client's open questions; each renders a visible TBC
 * state rather than a plausible-looking default.
 */
import { defineArrayMember, defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Settings",
  type: "document",
  groups: [
    { name: "identity", title: "Identity", default: true },
    { name: "contact", title: "Contact" },
    { name: "commerce", title: "Payments and policy" },
    { name: "tracking", title: "Tracking" },
  ],
  fields: [
    defineField({ name: "name", type: "string", group: "identity", validation: (rule) => rule.required() }),
    defineField({ name: "legalName", type: "string", group: "identity", description: "The registered entity. Empty renders TBC in the footer." }),
    defineField({ name: "tagline", type: "string", group: "identity", description: 'Only if the academy confirms "Happy Coffee People" is current.' }),
    defineField({ name: "partnerLine", type: "string", group: "identity", validation: (rule) => rule.required() }),
    defineField({ name: "foundedFlorence", type: "number", group: "identity", validation: (rule) => rule.required().integer() }),
    defineField({ name: "launchedBengaluru", type: "number", group: "identity", validation: (rule) => rule.required().integer() }),
    defineField({ name: "address", type: "postalAddress", group: "contact", validation: (rule) => rule.required() }),
    defineField({
      name: "phonePrimary",
      type: "string",
      group: "contact",
      description: "E.164, for example +919448106100.",
      validation: (rule) => rule.required().regex(/^\+\d{10,15}$/, { name: "E.164" }),
    }),
    defineField({
      name: "phoneSecondary",
      type: "string",
      group: "contact",
      validation: (rule) => rule.regex(/^\+\d{10,15}$/, { name: "E.164" }),
    }),
    defineField({
      name: "whatsappNumber",
      type: "string",
      group: "contact",
      description: "Digits with the country code and no plus, for example 919448106100.",
      validation: (rule) => rule.required().regex(/^\d{10,15}$/, { name: "digits" }),
    }),
    defineField({
      name: "whatsappConfirmed",
      title: "WhatsApp number confirmed",
      type: "boolean",
      group: "contact",
      initialValue: false,
    }),
    defineField({
      name: "whatsappText",
      title: "WhatsApp message template",
      type: "text",
      rows: 3,
      group: "contact",
      description:
        "Pre-filled when someone taps a WhatsApp button. {course} and {batch} are replaced when they are known.",
    }),
    defineField({ name: "email", type: "string", group: "contact", description: "Empty renders TBC." }),
    defineField({ name: "hours", type: "string", group: "contact", description: "Empty renders TBC." }),
    defineField({
      name: "replyPromise",
      type: "string",
      group: "contact",
      description: 'For example "We reply on WhatsApp within 2 hours, 10am to 7pm". Empty renders a neutral line.',
    }),
    defineField({ name: "instagram", type: "url", group: "contact" }),
    defineField({ name: "florencePartnerPage", type: "url", group: "identity" }),
    defineField({
      name: "razorpayDisplayName",
      title: "Name shown in the payment window",
      type: "string",
      group: "commerce",
      description: "What a student sees on the Razorpay checkout and on their card statement line.",
    }),
    defineField({
      name: "refundPolicy",
      title: "Refund and reschedule policy",
      type: "guideBody",
      group: "commerce",
      description:
        "Shown on /refund-policy and linked from the checkout. Empty leaves the page in its placeholder state.",
    }),
    defineField({
      name: "metaPixelIdOverride",
      title: "Meta Pixel ID override",
      type: "string",
      group: "tracking",
      description: "Overrides NEXT_PUBLIC_META_PIXEL_ID. Leave empty to use the environment value.",
    }),
    defineField({
      name: "announcements",
      title: "Site-wide notices",
      type: "array",
      group: "identity",
      of: [defineArrayMember({ type: "string" })],
      description: "Rarely used. One short line, shown above the header.",
      validation: (rule) => rule.max(1),
    }),
  ],
  preview: { prepare: () => ({ title: "Settings" }) },
});
