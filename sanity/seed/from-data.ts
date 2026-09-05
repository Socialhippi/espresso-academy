/**
 * Seed the dataset from content/data.ts.
 *
 * Run with:  pnpm sanity:seed
 * (which is `sanity exec sanity/seed/from-data.ts --with-user-token`)
 *
 * Every document gets a deterministic id derived from its slug, and every write is a
 * `createOrReplace`, so running this twice produces the same dataset rather than a second copy of
 * everything. That matters more than it sounds: this is the script a developer reaches for after
 * restoring a dataset export, and a seed that duplicates on re-run is a seed nobody dares re-run.
 *
 * What it deliberately does not do: invent anything. Every null in content/data.ts stays null
 * here, so the site's TBC states survive the migration intact.
 */
import { getCliClient } from "sanity/cli";
import {
  certifications,
  courses,
  faqs,
  siteSettings,
  trainers,
  type Course,
} from "../../content/data";

const client = getCliClient({ apiVersion: "2026-09-05" });

const id = {
  venue: "venue-bengaluru-campus",
  settings: "siteSettings",
  certification: (slug: string) => `certification-${slug}`,
  trainer: (slug: string) => `trainer-${slug}`,
  course: (slug: string) => `course-${slug}`,
  instance: (slug: string) => `instance-${slug}-tbc`,
  faq: (index: number) => `faq-${String(index + 1).padStart(2, "0")}`,
};

const ref = (to: string) => ({ _type: "reference" as const, _ref: to });

/** Sanity needs a stable `_key` on every array item, or the editor cannot reorder them. */
const keyed = <T extends object>(items: T[], prefix: string) =>
  items.map((item, index) => ({ ...item, _key: `${prefix}-${index}` }));

type Doc = Record<string, unknown> & { _id: string; _type: string };

function courseDoc(course: Course): Doc {
  return {
    _id: id.course(course.slug),
    _type: "course",
    title: course.title,
    slug: { _type: "slug", current: course.slug },
    priority: course.priority,
    skillArea: course.skillArea,
    level: course.level,
    levelLabel: course.levelLabel,
    isWorkshop: false,
    outcome: course.outcome,
    forWhom: course.forWhom,
    notForWhom: course.notForWhom,
    modules: course.modules ?? undefined,
    includes: course.includes ?? undefined,
    prerequisites: course.prerequisites ?? undefined,
    certification: course.certification ? ref(id.certification(course.certification)) : undefined,
    certificateAwardedLabel: course.certificateAwardedLabel ?? undefined,
    format: course.format ?? undefined,
    durationDays: course.durationDays ?? undefined,
    durationHours: course.durationHours ?? undefined,
    feeInclGst: course.feeInclGst ?? undefined,
    emiAvailable: course.emiAvailable ?? undefined,
    seatsMax: course.seatsMax ?? undefined,
    trainers: keyed(
      course.trainers.map((slug) => ref(id.trainer(slug))),
      `${course.slug}-trainer`,
    ),
    nextInLadder: course.nextInLadder ? ref(id.course(course.nextInLadder)) : undefined,
    faq: keyed(
      course.faq.map((entry) => ({
        _type: "faqEntry",
        q: entry.q,
        a: entry.a,
        link: entry.link ? { _type: "linkRef", ...entry.link } : undefined,
      })),
      `${course.slug}-faq`,
    ),
    heroAlt: course.heroAlt,
  };
}

/**
 * One batch per course, with no date and status `tbc`. The site already renders that as
 * "dates being finalised", and it gives the academy a row to edit rather than a blank list to
 * work out how to start.
 */
function instanceDoc(course: Course): Doc {
  return {
    _id: id.instance(course.slug),
    _type: "courseInstance",
    course: ref(id.course(course.slug)),
    status: "tbc",
    // seatsMax is required by the schema, and the academy has not published a seat count.
    // 1 is the schema's floor and the most conservative thing that is not a made-up number:
    // it renders as "1 seat" nowhere, because a tbc batch shows no seat count at all.
    seatsMax: course.seatsMax ?? 1,
    seatsBooked: 0,
    venue: ref(id.venue),
    notes:
      "Created by the seed. Set the dates, the seats and the status when the academy confirms the batch.",
  };
}

async function main(): Promise<void> {
  const docs: Doc[] = [];

  docs.push({
    _id: id.venue,
    _type: "venue",
    name: `${siteSettings.name}, ${siteSettings.address.city} campus`,
    city: siteSettings.address.city,
    mapsUrl: siteSettings.address.mapsUrl,
    address: {
      _type: "postalAddress",
      line1: siteSettings.address.line1,
      line2: siteSettings.address.line2,
      city: siteSettings.address.city,
      postalCode: siteSettings.address.postalCode,
      region: siteSettings.address.region,
      country: siteSettings.address.country,
      plotNumberConfirmed: siteSettings.address.plotNumberConfirmed,
      mapsUrl: siteSettings.address.mapsUrl,
    },
    notes:
      "The brochure prints a different plot number and the current map pin points at Siddarth Plaza. Confirm both with the academy before launch.",
  });

  docs.push({
    _id: id.settings,
    _type: "siteSettings",
    name: siteSettings.name,
    legalName: siteSettings.legalName ?? undefined,
    tagline: siteSettings.tagline ?? undefined,
    partnerLine: siteSettings.partnerLine,
    foundedFlorence: siteSettings.foundedFlorence,
    launchedBengaluru: siteSettings.launchedBengaluru,
    address: {
      _type: "postalAddress",
      line1: siteSettings.address.line1,
      line2: siteSettings.address.line2,
      city: siteSettings.address.city,
      postalCode: siteSettings.address.postalCode,
      region: siteSettings.address.region,
      country: siteSettings.address.country,
      plotNumberConfirmed: siteSettings.address.plotNumberConfirmed,
      mapsUrl: siteSettings.address.mapsUrl,
    },
    phonePrimary: siteSettings.phonePrimary,
    phoneSecondary: siteSettings.phoneSecondary,
    whatsappNumber: siteSettings.whatsappNumber,
    whatsappConfirmed: siteSettings.whatsappConfirmed,
    whatsappText: undefined,
    email: siteSettings.email ?? undefined,
    hours: siteSettings.hours ?? undefined,
    replyPromise: siteSettings.replyPromise ?? undefined,
    instagram: siteSettings.instagram,
    florencePartnerPage: siteSettings.florencePartnerPage,
    razorpayDisplayName: siteSettings.name,
    metaPixelIdOverride: undefined,
  });

  for (const certification of certifications) {
    docs.push({
      _id: id.certification(certification.slug),
      _type: "certification",
      name: certification.name,
      shortName: certification.shortName,
      slug: { _type: "slug", current: certification.slug },
      issuer: certification.issuer,
      summary: certification.summary,
      levels: certification.levels,
      recognitionNote: certification.recognitionNote,
      status: certification.status,
    });
  }

  for (const trainer of trainers) {
    docs.push({
      _id: id.trainer(trainer.slug),
      _type: "trainer",
      name: trainer.name,
      slug: { _type: "slug", current: trainer.slug },
      role: trainer.role ?? undefined,
      credentials: keyed(
        trainer.credentials.map((credential) => ({
          _type: "credential",
          name: credential.name,
          issuer: credential.issuer ?? undefined,
        })),
        `${trainer.slug}-cred`,
      ),
      bio: trainer.bio,
      philosophy: trainer.philosophy ?? undefined,
      sameAs: trainer.sameAs,
    });
  }

  for (const course of courses) docs.push(courseDoc(course));
  for (const course of courses) docs.push(instanceDoc(course));

  faqs.forEach((faq, index) => {
    docs.push({
      _id: id.faq(index),
      _type: "faqItem",
      q: faq.q,
      a: faq.a,
      category: faq.category,
      link: faq.link ? { _type: "linkRef", ...faq.link } : undefined,
      order: index + 1,
    });
  });

  /**
   * One transaction. A half-seeded dataset, with courses referencing trainers that do not exist
   * yet, is worse than no seed at all: the Studio would show broken references and the site would
   * render a course with no faculty.
   */
  const transaction = client.transaction();
  for (const doc of docs) transaction.createOrReplace(doc);
  await transaction.commit({ visibility: "async" });

  const counts = docs.reduce<Record<string, number>>((acc, doc) => {
    acc[doc._type] = (acc[doc._type] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`Seeded ${docs.length} documents into ${client.config().dataset}:`);
  for (const [type, count] of Object.entries(counts).sort()) {
    console.log(`  ${String(count).padStart(3)}  ${type}`);
  }
  console.log(
    "\nEvery TBC in content/data.ts is still a TBC here. Nothing was invented to fill a gap.",
  );
}

main().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
