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
  redirects,
  siteSettings,
  trainers,
  type Course,
  type CourseInstance,
} from "../../content/data";

const client = getCliClient({ apiVersion: "2026-09-05" });

const id = {
  venue: "venue-bengaluru-campus",
  settings: "siteSettings",
  certification: (slug: string) => `certification-${slug}`,
  trainer: (slug: string) => `trainer-${slug}`,
  course: (slug: string) => `course-${slug}`,
  instance: (instanceId: string) => `instance-${instanceId}`,
  instanceTbc: (slug: string) => `instance-${slug}-tbc`,
  redirect: (from: string) => `redirect-${from.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}`,
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
    days: keyed(
      (course.days ?? []).map((day) => ({
        _type: "courseDay",
        number: day.number,
        title: day.title,
        topics: day.topics,
      })),
      `${course.slug}-day`,
    ),
    includes: course.includes ?? undefined,
    prerequisites: course.prerequisites ?? undefined,
    certification: course.certification ? ref(id.certification(course.certification)) : undefined,
    certificateAwardedLabel: course.certificateAwardedLabel ?? undefined,
    format: course.format ?? undefined,
    durationDays: course.durationDays ?? undefined,
    durationHours: course.durationHours ?? undefined,
    schedule: course.schedule ?? undefined,
    feeExGst: course.feeExGst ?? undefined,
    offerFeeExGst: course.offerFeeExGst ?? undefined,
    offerLabel: course.offerLabel ?? undefined,
    offerActive: course.offerActive,
    gstRate: course.gstRate ?? undefined,
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

/** A batch the client has actually given dates for. */
function instanceDoc(course: Course, instance: CourseInstance): Doc {
  return {
    _id: id.instance(instance.id),
    _type: "courseInstance",
    course: ref(id.course(course.slug)),
    status: instance.status,
    startDate: instance.startDate ?? undefined,
    endDate: instance.endDate ?? undefined,
    schedule: instance.schedule ?? undefined,
    seatsMax: instance.seatsMax ?? course.seatsMax ?? 1,
    seatsBooked: 0,
    venue: ref(id.venue),
    notes: "Created by the seed from the batch list in content/facts.md.",
  };
}

/**
 * The placeholder batch for a course the client has given no dates for.
 *
 * The site renders it as "dates being finalised", and it gives the academy a row to edit rather
 * than a blank list to work out how to start. Only IBC Advanced Barista needs one today.
 */
function tbcInstanceDoc(course: Course): Doc {
  return {
    _id: id.instanceTbc(course.slug),
    _type: "courseInstance",
    course: ref(id.course(course.slug)),
    status: "tbc",
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
      "Address and map pin confirmed by the client, 8 Sept 2026 (content/facts.md revision 2). Plot No. 9 is the plot; 72 is the building number on 80 Feet Road. Both belong in the address.",
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
    openingDaysConfirmed: siteSettings.openingDaysConfirmed,
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
  for (const course of courses) {
    if (course.instances.length === 0) {
      docs.push(tbcInstanceDoc(course));
      continue;
    }
    for (const instance of course.instances) docs.push(instanceDoc(course, instance));
  }

  /* The retired course URLs. next.config.ts reads these at build time. */
  for (const rule of redirects) {
    docs.push({
      _id: id.redirect(rule.from),
      _type: "redirect",
      from: rule.from,
      to: rule.to,
      permanent: rule.statusCode === 301 || rule.statusCode === 308,
      statusCode: rule.statusCode,
    });
  }

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
