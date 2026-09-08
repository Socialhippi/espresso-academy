/**
 * Seeds the documents that exist to show the academy a shape: two guides, one landing page and the
 * for-cafes page.
 *
 * Run with:  pnpm sanity:seed:templates
 *
 * **These carry placeholder body text, and every placeholder paragraph is marked.** The point is
 * not the words, it is the structure: a guide that opens with the answer, asks its questions as
 * H2s, backs one up with a table and closes with an FAQ block; a landing page built from the five
 * permitted sections. The academy replaces the prose and keeps the shape.
 *
 * What is deliberately NOT placeholder: anything that would read as a fact. There is no fee, no
 * date, no duration and no claim about the SCA in here. `content/facts.md` governs the seed exactly
 * as it governs the site, and a placeholder that says "₹25,000" is a made-up fee whether or not it
 * is labelled as an example.
 *
 * Idempotent: deterministic ids and `createOrReplace`, so re-running restores the templates rather
 * than duplicating them. That also means re-running **overwrites** the academy's edits, so once
 * they start writing, stop running it.
 */
import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2026-09-05" });

type Doc = Record<string, unknown> & { _id: string; _type: string };

let keySeed = 0;
/** Sanity needs a stable `_key` on every array item, or the editor cannot reorder them. */
const key = (prefix: string): string => `${prefix}-${(keySeed += 1)}`;

/** A portable-text paragraph. `data-placeholder` has no meaning in the CMS; the marker is the copy. */
function para(text: string, style: "normal" | "h2" | "h3" = "normal"): Record<string, unknown> {
  return {
    _type: "block",
    _key: key("block"),
    style,
    markDefs: [],
    children: [{ _type: "span", _key: key("span"), text, marks: [] }],
  };
}

const PLACEHOLDER_NOTE =
  "PLACEHOLDER. Replace this paragraph with the academy's own answer. Keep the shape: the question is the heading, and the first sentence under it is the answer.";

function guide({
  id,
  title,
  slug,
  excerpt,
  authorId,
  reviewerId,
  seoTitle,
  primaryCourseId,
  primaryCertificationId,
  questions,
  table,
  faq,
}: {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  /**
   * The `<title>`, when the headline is too long for one.
   *
   * seo.md caps a title at 60 characters and the suffix " | Espresso Academy India" is 25 of them,
   * so a headline over 40 characters needs its own. "Which barista course should you start with?"
   * is a good H1 and a bad title; both are true at once, which is what this field is for.
   */
  seoTitle?: string;
  authorId: string;
  /**
   * Optional, and left unset on the seeded guides.
   *
   * Both guides used to name one trainer as author and another as reviewer. The client confirmed
   * on 8 September 2026 that neither is part of the academy's team, and the only trainer left
   * cannot review his own writing: a byline and a review line carrying the same name is a review
   * that did not happen. Better no reviewer than a fictional one.
   */
  reviewerId?: string;
  primaryCourseId?: string;
  primaryCertificationId?: string;
  questions: string[];
  table: { caption: string; columns: string[]; rows: string[][] };
  faq: { q: string; a: string }[];
}): Doc {
  const body: Record<string, unknown>[] = [];

  // Answer-first: a paragraph before the first heading, so a reader who stops has an answer.
  body.push(para(PLACEHOLDER_NOTE));

  questions.forEach((question, index) => {
    body.push(para(question, "h2"));
    body.push(para(PLACEHOLDER_NOTE));
    if (index === 0) {
      body.push({
        _type: "calloutBlock",
        _key: key("callout"),
        tone: "note",
        title: "Where the academy does not know",
        body:
          "PLACEHOLDER. Use a callout when the honest answer is that something is not confirmed yet. Saying so is worth more than a confident guess.",
      });
    }
  });

  body.push({
    _type: "evidenceTableBlock",
    _key: key("table"),
    caption: table.caption,
    columns: table.columns,
    rows: table.rows.map((cells) => ({ _type: "tableRow", _key: key("row"), cells })),
  });

  body.push({
    _type: "faqBlock",
    _key: key("faq"),
    heading: "Common questions",
    items: faq.map((item) => ({
      _type: "faqEntry",
      _key: key("faqitem"),
      q: item.q,
      a: item.a,
    })),
  });

  const now = new Date().toISOString();

  return {
    _id: id,
    _type: "guide",
    title,
    slug: { _type: "slug", current: slug },
    excerpt,
    ...(seoTitle ? { seo: { title: seoTitle } } : {}),
    body,
    author: { _type: "reference", _ref: authorId },
    ...(reviewerId ? { reviewedBy: { _type: "reference", _ref: reviewerId } } : {}),
    publishedAt: now,
    updatedAt: now,
    ...(primaryCourseId ? { primaryCourse: { _type: "reference", _ref: primaryCourseId } } : {}),
    ...(primaryCertificationId
      ? { primaryCertification: { _type: "reference", _ref: primaryCertificationId } }
      : {}),
  };
}

async function main(): Promise<void> {
  const docs: Doc[] = [];

  /* ---- Guide one: which course to start with ---- */
  docs.push(
    guide({
      id: "guide-which-course-to-start-with",
      title: "Which barista course should you start with?",
      seoTitle: "Which Barista Course to Start With",
      slug: "which-course-to-start-with",
      excerpt:
        "PLACEHOLDER. One or two sentences that answer the question in the title outright, before anyone scrolls. This is what a search result and an assistant will quote.",
      authorId: "trainer-nageswara-rao-k",
      primaryCourseId: "course-italian-barista-course-basic",
      questions: [
        "Do you need any experience to start?",
        "What is the difference between the IBC and the SCA route?",
        "How do you know which level you are at?",
        "What happens if you pick the wrong one?",
      ],
      table: {
        caption: "The two certificate routes, side by side",
        columns: ["", "Italian Barista Certificate", "SCA Coffee Skills Program"],
        rows: [
          ["Issued by", "Espresso Academy, Florence", "Specialty Coffee Association"],
          ["Levels", "Basic, Advanced Barista, Advanced Roasting", "Foundation, Intermediate, Professional"],
          ["Where the diploma comes from", "Italy, sent to partner schools", "The SCA, on an assessed module"],
          ["Taught at this academy", "Yes, all three courses", "No SCA course is offered"],
        ],
      },
      faq: [
        {
          q: "Can you go straight to the Advanced level?",
          a: "PLACEHOLDER. Answer in two or three sentences, and say plainly when the answer is that it depends on an assessment the academy has not published yet.",
        },
        {
          q: "Does the certificate expire?",
          a: "PLACEHOLDER. Replace with the academy's answer.",
        },
      ],
    }),
  );

  /* ---- Guide two: what a barista course actually covers ---- */
  docs.push(
    guide({
      id: "guide-what-a-barista-course-covers",
      title: "What does a barista course actually cover?",
      seoTitle: "What a Barista Course Covers",
      slug: "what-a-barista-course-covers",
      excerpt:
        "PLACEHOLDER. Answer the title in one or two sentences. Somebody deciding whether to spend a weekend on this wants to know what they will be able to do afterwards.",
      authorId: "trainer-nageswara-rao-k",
      primaryCertificationId: "certification-sca-coffee-skills-program",
      questions: [
        "How much of it is hands-on?",
        "What equipment will you be using?",
        "What can you do on the last day that you could not on the first?",
        "Is there an assessment?",
      ],
      table: {
        caption: "What a day is made of",
        columns: ["Part of the day", "What happens"],
        rows: [
          ["PLACEHOLDER", "Replace these rows with the academy's own outline."],
          ["PLACEHOLDER", "Keep the table when the answer is a comparison; delete it when it is not."],
        ],
      },
      faq: [
        {
          q: "Do you need your own equipment?",
          a: "PLACEHOLDER. Replace with the academy's answer.",
        },
        {
          q: "How many people are in a class?",
          a: "PLACEHOLDER. Replace with the academy's answer. Do not state a number until the academy confirms one.",
        },
      ],
    }),
  );

  /* ---- The for-cafes page ---- */
  docs.push({
    _id: "page-for-cafes",
    _type: "page",
    title: "Training for cafes and teams",
    slug: { _type: "slug", current: "for-cafes" },
    intro:
      "PLACEHOLDER. One sentence under the H1 saying what the academy does for a cafe team. The page renders a hand-written fallback with this same shape until this document is edited.",
    sections: [
      {
        _type: "offerSection",
        _key: key("section"),
        eyebrow: "How it works",
        heading: "Built around your bar",
        body: "PLACEHOLDER. Replace with the academy's own description of how a team session is scoped.",
        points: [
          "PLACEHOLDER: what the academy needs to know to quote",
          "PLACEHOLDER: where it can run",
          "PLACEHOLDER: what the team leaves with",
        ],
      },
      {
        _type: "faqSection",
        _key: key("section"),
        heading: "What cafe owners ask",
        items: [
          {
            _type: "faqEntry",
            _key: key("faqitem"),
            q: "How many people can attend?",
            a: "PLACEHOLDER. Replace with the academy's answer. Do not state a number until it is confirmed.",
          },
          {
            _type: "faqEntry",
            _key: key("faqitem"),
            q: "Can it run at our cafe rather than at the campus?",
            a: "PLACEHOLDER. Replace with the academy's answer.",
          },
        ],
      },
      {
        _type: "formSection",
        _key: key("section"),
        heading: "Ask for a proposal",
        body: "PLACEHOLDER. Two lines telling a cafe owner what to include so the academy can quote.",
        variant: "cafe",
      },
    ],
  });

  /* ---- One example landing page ---- */
  docs.push({
    _id: "landingPage-example-campaign",
    _type: "landingPage",
    title: "PLACEHOLDER: the promise this campaign makes",
    slug: { _type: "slug", current: "example-campaign" },
    campaign: "example-campaign",
    noindex: true,
    course: { _type: "reference", _ref: "course-italian-barista-course-basic" },
    sections: [
      {
        _type: "heroSection",
        _key: key("section"),
        eyebrow: "PLACEHOLDER",
        heading: "PLACEHOLDER: what the reader gets",
        body: "PLACEHOLDER. One paragraph. A campaign page says one thing; if it says three, it says none.",
        primaryCta: { _type: "linkRef", label: "Ask about a seat", href: "#enquire" },
      },
      {
        _type: "offerSection",
        _key: key("section"),
        eyebrow: "What you get",
        heading: "PLACEHOLDER: the offer",
        points: [
          "PLACEHOLDER: what is included",
          "PLACEHOLDER: what is included",
          "PLACEHOLDER: what is included",
        ],
      },
      {
        _type: "proofSection",
        _key: key("section"),
        heading: "Why the academy",
        // The only real values in this document, and every one traces to content/facts.md.
        facts: [
          { _type: "proofFact", _key: key("fact"), value: "2007", label: "Coffee education in Florence since 2007" },
          { _type: "proofFact", _key: key("fact"), value: "2023", label: "Teaching in Bengaluru since 2023" },
          { _type: "proofFact", _key: key("fact"), value: "Partner", label: "Official Partner of Espresso Academy, Florence" },
          { _type: "proofFact", _key: key("fact"), value: "Italy", label: "IBC diplomas are issued in Italy" },
        ],
      },
      {
        _type: "formSection",
        _key: key("section"),
        heading: "Ask about a seat",
        body: "PLACEHOLDER. One line. The form is the page's only job.",
        variant: "student",
      },
      {
        _type: "faqSection",
        _key: key("section"),
        heading: "Before you ask",
        items: [
          {
            _type: "faqEntry",
            _key: key("faqitem"),
            q: "PLACEHOLDER: the objection this campaign has to answer",
            a: "PLACEHOLDER. Answer it in two sentences.",
          },
        ],
      },
    ],
  });

  const transaction = client.transaction();
  for (const doc of docs) transaction.createOrReplace(doc);
  await transaction.commit({ visibility: "async" });

  console.log(`Seeded ${docs.length} template documents:`);
  for (const doc of docs) console.log(`  ${doc._type.padEnd(12)} ${doc._id}`);
  console.log(
    "\nEvery body paragraph is marked PLACEHOLDER. No fee, date, duration or claim is stated.",
  );
  console.log("Re-running overwrites edits, so stop running it once the academy starts writing.");
}

main().catch((error: unknown) => {
  console.error("Template seed failed:", error);
  process.exit(1);
});
