import "server-only";

/**
 * The site's content layer.
 *
 * Build 1 read `content/data.ts` synchronously. This reads Sanity, so every accessor that touches
 * the network is now `async`; the return shapes are unchanged, which is why the components did not
 * have to be rewritten with the data source. `content/data.ts` remains in the repo as the seed of
 * record for `sanity/seed/from-data.ts` and is no longer imported from `src/`.
 *
 * Three things stay synchronous on purpose:
 *
 * - the label maps at the bottom, which are presentation, not content;
 * - the helpers that operate on an object a caller already has (`getNextInstanceForCourse`);
 * - the types.
 *
 * Every fetch is tagged. `/api/revalidate` turns a Sanity publish into a `revalidateTag` call, so
 * an edit is live in seconds without the site polling for it. The one-hour `revalidate` underneath
 * is a floor, not the mechanism: it only matters if the webhook is ever misconfigured.
 */
import { cache } from "react";
import { readClient } from "@/lib/sanity/client";
import { containsPlaceholder, stripPlaceholder } from "@/lib/placeholder";
import type { SanityImage } from "@/lib/sanity/image";
import {
  certificationsQuery,
  courseBySlugQuery,
  coursesQuery,
  courseSlugsQuery,
  datedInstancesQuery,
  faqsQuery,
  guideBySlugQuery,
  guideSlugsQuery,
  guidesQuery,
  landingPageBySlugQuery,
  landingPageSlugsQuery,
  pageBySlugQuery,
  siteSettingsQuery,
  storiesQuery,
  trainerBySlugQuery,
  trainersQuery,
} from "@/lib/sanity/queries";

/* ---------------------------------------------------------------------------------------------
 * Types. These were in content/data.ts; they live here now because src/ no longer imports it.
 * ------------------------------------------------------------------------------------------- */

export type Level = "foundation" | "intermediate" | "professional" | "junior" | "advanced" | "open";
export type Format = "in-person" | "hybrid" | "online";
export type SkillArea =
  | "barista-skills"
  | "latte-art"
  | "brewing"
  | "roasting-cupping"
  | "sensory"
  | "green-coffee"
  | "mixology"
  | "cafe-management";

export type CertificationSlug = "italian-barista-certificate" | "sca-coffee-skills-program";

export interface Certification {
  slug: CertificationSlug;
  name: string;
  shortName: string;
  issuer: string;
  summary: string;
  levels: string[];
  recognitionNote: string;
  status: "confirmed" | "wording-pending";
}

export interface Trainer {
  slug: string;
  name: string;
  role: string | null;
  credentials: { name: string; issuer: string | null }[];
  bio: string;
  philosophy: string | null;
  image: SanityImage | null;
  sameAs: string[];
}

export interface Venue {
  id: string;
  name: string;
  city: string;
  mapsUrl: string | null;
  address: {
    line1: string;
    line2: string | null;
    city: string;
    postalCode: string;
    region: string;
    country: string;
  } | null;
}

export type InstanceStatus = "open" | "waitlist" | "soldout" | "completed" | "tbc";

export interface CourseInstance {
  /** The Sanity document id. It is also the path segment of /book/[instanceId]. */
  id: string;
  startDate: string | null;
  endDate: string | null;
  schedule: string | null;
  status: InstanceStatus;
  seatsMax: number | null;
  seatsBooked: number;
  /** Derived in GROQ as seatsMax - seatsBooked. Null while the academy has not set seatsMax. */
  seatsAvailable: number | null;
  /** Overrides the course fee for this batch only, in whole rupees. */
  priceOverride: number | null;
  venue: Venue | null;
}

export interface CourseFaq {
  q: string;
  a: string;
  link?: { label: string; href: string } | null;
}

export interface Course {
  /** The Sanity document id. Needed when a booking references the course. */
  id: string;
  slug: string;
  title: string;
  skillArea: SkillArea;
  level: Level;
  levelLabel: string;
  isWorkshop: boolean;
  certification: CertificationSlug | null;
  certificateAwardedLabel: string | null;
  format: Format | null;
  durationDays: number | null;
  durationHours: number | null;
  feeInclGst: number | null;
  emiAvailable: boolean | null;
  seatsMax: number | null;
  outcome: string;
  forWhom: string[];
  notForWhom: string[];
  modules: string[] | null;
  includes: string[] | null;
  prerequisites: string | null;
  trainers: string[];
  nextInLadder: string | null;
  faq: CourseFaq[];
  /** Fetched with the course through `references(^._id)`, soonest dated batch first. */
  instances: CourseInstance[];
  heroImage: SanityImage | null;
  heroAlt: string;
  priority: number;
}

export interface FaqItem {
  q: string;
  a: string;
  category: "courses" | "fees" | "certification" | "schedule" | "campus" | "careers";
  link?: { label: string; href: string } | null;
}

export interface Story {
  id: string;
  name: string;
  course: string | null;
  outcome: string | null;
  quote: string;
  image: SanityImage | null;
  permission: boolean;
}

export interface SiteSettings {
  name: string;
  legalName: string | null;
  tagline: string | null;
  partnerLine: string;
  foundedFlorence: number;
  launchedBengaluru: number;
  address: {
    line1: string;
    line2: string | null;
    city: string;
    postalCode: string;
    region: string;
    country: string;
    plotNumberConfirmed: boolean;
    mapsUrl: string | null;
  };
  phonePrimary: string;
  phoneSecondary: string | null;
  whatsappNumber: string;
  whatsappConfirmed: boolean;
  whatsappText: string | null;
  email: string | null;
  hours: string | null;
  replyPromise: string | null;
  instagram: string | null;
  florencePartnerPage: string | null;
  razorpayDisplayName: string | null;
  /** Portable text. Empty leaves /refund-policy in its marked placeholder state. */
  refundPolicy: { _type: string; _key?: string }[] | null;
  metaPixelIdOverride: string | null;
  announcements: string[] | null;
}

/** A portable-text body as the queries return it. */
export type PortableBlocks = { _type: string; _key?: string }[];

export interface GuideAuthor {
  slug: string;
  name: string;
  role: string | null;
  credentials?: { name: string; issuer: string | null }[];
}

export interface Guide {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  updatedAt: string | null;
  author: GuideAuthor | null;
  reviewedBy: GuideAuthor | null;
  primaryCourse: { slug: string; title: string } | null;
  primaryCertification: { slug: string; name: string } | null;
  heroImage: SanityImage | null;
  seo: { title?: string | null; description?: string | null } | null;
  /** Only on the single-guide query; the hub does not fetch bodies. */
  body?: PortableBlocks;
}

/** A section from the constrained library. Discriminated by `_type` at the render site. */
export interface PageSection {
  _type: string;
  _key: string;
  [field: string]: unknown;
}

export interface ContentPage {
  slug: string;
  title: string;
  intro: string | null;
  sections: PageSection[];
  seo: { title?: string | null; description?: string | null } | null;
}

export interface LandingPage {
  slug: string;
  title: string;
  campaign: string | null;
  course: { slug: string; title: string; feeInclGst: number | null } | null;
  sections: PageSection[];
}

/** A course instance paired with the course it belongs to. */
export interface DatedInstance {
  course: Course;
  instance: CourseInstance;
  /** Never null: only instances with a start date reach this type. */
  startDate: string;
}

/* ---------------------------------------------------------------------------------------------
 * Fetching
 * ------------------------------------------------------------------------------------------- */

/**
 * One hour. Not the mechanism by which an edit goes live (that is the publish webhook calling
 * revalidateTag), just the floor if the webhook is ever wrong.
 */
const REVALIDATE_SECONDS = 3600;

/**
 * A document type, or one document of that type.
 *
 * `/api/revalidate` sends both on every publish: the type, so a list page refreshes, and
 * `type:slug`, so one document's own page refreshes without invalidating every sibling.
 */
type DocumentType =
  | "course"
  | "courseInstance"
  | "trainer"
  | "certification"
  | "faqItem"
  | "story"
  | "siteSettings"
  | "guide"
  | "page"
  | "landingPage"
  | "redirect";

type Tag = DocumentType | `${DocumentType}:${string}`;

async function query<T>(groq: string, params: Record<string, unknown>, tags: Tag[]): Promise<T> {
  return readClient.fetch<T>(groq, params, {
    next: { revalidate: REVALIDATE_SECONDS, tags },
  });
}

/** An empty array from an editor who cleared a field means "nothing to show", same as unset. */
function nullIfEmpty<T>(value: T[] | null | undefined): T[] | null {
  return value && value.length > 0 ? value : null;
}

function normaliseCourse(raw: Course): Course {
  return {
    ...raw,
    isWorkshop: raw.isWorkshop ?? false,
    forWhom: raw.forWhom ?? [],
    notForWhom: raw.notForWhom ?? [],
    modules: nullIfEmpty(raw.modules),
    includes: nullIfEmpty(raw.includes),
    trainers: (raw.trainers ?? []).filter((slug): slug is string => Boolean(slug)),
    faq: raw.faq ?? [],
  };
}

/**
 * `cache` dedupes within one render pass: a course page that asks for the course, then the
 * related courses, then the ladder, makes one request rather than three.
 */
export const getCourses = cache(async (): Promise<Course[]> => {
  const courses = await query<Course[]>(coursesQuery, {}, ["course", "courseInstance"]);
  return courses.map(normaliseCourse);
});

export const getCourse = cache(async (slug: string): Promise<Course | undefined> => {
  const course = await query<Course | null>(courseBySlugQuery, { slug }, ["course", "courseInstance"]);
  return course ? normaliseCourse(course) : undefined;
});

export const getCourseSlugs = cache(async (): Promise<string[]> => {
  return query<string[]>(courseSlugsQuery, {}, ["course"]);
});

export async function getCoursesByLevel(level: Level): Promise<Course[]> {
  return (await getCourses()).filter((course) => course.level === level);
}

export async function getCoursesBySkillArea(skillArea: SkillArea): Promise<Course[]> {
  return (await getCourses()).filter((course) => course.skillArea === skillArea);
}

export async function getCoursesForCertification(slug: CertificationSlug): Promise<Course[]> {
  return (await getCourses()).filter((course) => course.certification === slug);
}

export async function getCoursesForTrainer(trainerSlug: string): Promise<Course[]> {
  return (await getCourses()).filter((course) => course.trainers.includes(trainerSlug));
}

/** Courses that run as a short workshop rather than as a rung of the ladder. */
export async function getWorkshops(): Promise<Course[]> {
  return (await getCourses()).filter((course) => course.isWorkshop);
}

/** The skill areas that actually have a course, in hub order. */
export async function getSkillAreas(): Promise<SkillArea[]> {
  const seen = new Set<SkillArea>();
  for (const course of await getCourses()) seen.add(course.skillArea);
  return [...seen];
}

/** The levels that actually have a course, in ladder order. */
export async function getLevels(): Promise<Level[]> {
  const ladder: Level[] = [
    "foundation",
    "intermediate",
    "professional",
    "junior",
    "advanced",
    "open",
  ];
  const present = new Set((await getCourses()).map((course) => course.level));
  return ladder.filter((level) => present.has(level));
}

export const getTrainers = cache(async (): Promise<Trainer[]> => {
  const trainers = await query<Trainer[]>(trainersQuery, {}, ["trainer"]);
  return trainers.map((trainer) => ({
    ...trainer,
    credentials: trainer.credentials ?? [],
    sameAs: trainer.sameAs ?? [],
  }));
});

export const getTrainer = cache(async (slug: string): Promise<Trainer | undefined> => {
  const trainer = await query<Trainer | null>(trainerBySlugQuery, { slug }, ["trainer"]);
  if (!trainer) return undefined;
  return { ...trainer, credentials: trainer.credentials ?? [], sameAs: trainer.sameAs ?? [] };
});

export async function getTrainerSlugs(): Promise<string[]> {
  return (await getTrainers()).map((trainer) => trainer.slug);
}

/** Trainers assigned to a course, in the order the course lists them. */
export async function getCourseTrainers(course: Course): Promise<Trainer[]> {
  const all = await getTrainers();
  return course.trainers
    .map((slug) => all.find((trainer) => trainer.slug === slug))
    .filter((trainer): trainer is Trainer => trainer !== undefined);
}

export const getCertifications = cache(async (): Promise<Certification[]> => {
  return query<Certification[]>(certificationsQuery, {}, ["certification"]);
});

export async function getCertification(slug: string): Promise<Certification | undefined> {
  return (await getCertifications()).find((certification) => certification.slug === slug);
}

export async function getCertificationSlugs(): Promise<CertificationSlug[]> {
  return (await getCertifications()).map((certification) => certification.slug);
}

export const getAllFaqs = cache(async (): Promise<FaqItem[]> => {
  return query<FaqItem[]>(faqsQuery, {}, ["faqItem"]);
});

export async function getFaqs(category?: FaqItem["category"]): Promise<FaqItem[]> {
  const faqs = await getAllFaqs();
  return category ? faqs.filter((faq) => faq.category === category) : faqs;
}

export async function getFaqsByCategories(categories: FaqItem["category"][]): Promise<FaqItem[]> {
  return (await getAllFaqs()).filter((faq) => categories.includes(faq.category));
}

/** FAQ categories in the order they first appear. */
export async function getFaqCategories(): Promise<FaqItem["category"][]> {
  const seen = new Set<FaqItem["category"]>();
  for (const faq of await getAllFaqs()) seen.add(faq.category);
  return [...seen];
}

/** Only stories the subject has given permission to publish. The query already filters. */
export const getStories = cache(async (): Promise<Story[]> => {
  return query<Story[]>(storiesQuery, {}, ["story"]);
});

/**
 * The next n scheduled instances across all courses, soonest first. An instance without a start
 * date is not scheduled, so it never appears here and the caller renders the "dates being
 * finalised" state instead.
 */
export const getNextInstances = cache(async (n?: number): Promise<DatedInstance[]> => {
  const rows = await query<(CourseInstance & { course: Course })[]>(datedInstancesQuery, {}, [
    "courseInstance",
    "course",
  ]);
  const dated: DatedInstance[] = [];
  for (const row of rows) {
    const { course, ...instance } = row;
    if (!course || !instance.startDate) continue;
    dated.push({ course: normaliseCourse(course), instance, startDate: instance.startDate });
  }
  return typeof n === "number" ? dated.slice(0, n) : dated;
});

/** False while the academy has not published a single batch date. */
export async function hasAnyDates(): Promise<boolean> {
  return (await getNextInstances(1)).length > 0;
}

/*
 * The seeded templates carry "PLACEHOLDER." paragraphs on purpose, and they were rendering. A
 * guide whose answer reads "PLACEHOLDER. One or two sentences that answer the question in the
 * title outright" is worse than a guide with no answer, because the page still claims to have one.
 * Stripping here rather than at each render site means it holds for every caller.
 */
function withoutPlaceholders(guide: Guide): Guide {
  const kept = guide.body?.filter((block) => !containsPlaceholder(block));

  /*
   * A body has to keep at least one paragraph to be worth rendering.
   *
   * The seeded guides carry four question headings and a comparison table with no marker in them,
   * and only the answers are marked PLACEHOLDER. Filtering block by block therefore left four
   * questions with nothing underneath any of them — a page that looks like it answers four
   * questions and answers none, which is worse than saying it is being written. So the body
   * survives only if some prose does.
   */
  const hasProse = kept?.some((block) => {
    const candidate = block as { _type?: string; style?: string };
    return candidate._type === "block" && (candidate.style ?? "normal") === "normal";
  });

  return {
    ...guide,
    excerpt: stripPlaceholder(guide.excerpt) ?? "",
    ...(guide.body ? { body: hasProse ? (kept ?? []) : [] } : {}),
  };
}

export const getGuides = cache(async (): Promise<Guide[]> => {
  return (await query<Guide[]>(guidesQuery, {}, ["guide"])).map(withoutPlaceholders);
});

export const getGuide = cache(async (slug: string): Promise<Guide | undefined> => {
  const guide = await query<Guide | null>(guideBySlugQuery, { slug }, ["guide", `guide:${slug}`]);
  return guide ? withoutPlaceholders(guide) : undefined;
});

export async function getGuideSlugs(): Promise<string[]> {
  return query<string[]>(guideSlugsQuery, {}, ["guide"]);
}

export const getPage = cache(async (slug: string): Promise<ContentPage | undefined> => {
  const page = await query<ContentPage | null>(pageBySlugQuery, { slug }, ["page", `page:${slug}`]);
  if (!page) return undefined;

  /*
   * A seeded page is a real document whose prose is still the brief its writer was given. Dropping
   * the unwritten sections, and the whole document when nothing survives, hands the route back to
   * the hand-written fallback it already ships — which is publishable copy rather than an
   * apology. /for-cafes was showing "PLACEHOLDER. One sentence saying what the academy does for a
   * cafe team" under its H1.
   */
  const sections = page.sections.filter((section) => !containsPlaceholder(section));
  const intro = stripPlaceholder(page.intro);
  if (!intro && sections.length === 0) return undefined;
  return { ...page, intro, sections };
});

export const getLandingPage = cache(async (slug: string): Promise<LandingPage | undefined> => {
  const page = await query<LandingPage | null>(landingPageBySlugQuery, { slug }, [
    "landingPage",
    `landingPage:${slug}`,
  ]);
  if (!page) return undefined;

  /*
   * Same rule as /for-cafes and the guides. A campaign page is noindexed and reachable only by its
   * own URL, which is exactly why it was missed: nothing crawls it and nobody browses to it. It
   * still shipped a document title of "PLACEHOLDER: the promise this campaign makes" into the
   * browser tab, the Open Graph card and the H1 — on the one page type whose whole job is to be
   * pasted into an ad.
   */
  return {
    ...page,
    title: stripPlaceholder(page.title) ?? page.course?.title ?? "Espresso Academy India",
    sections: page.sections.filter((section) => !containsPlaceholder(section)),
  };
});

export async function getLandingPageSlugs(): Promise<string[]> {
  return query<string[]>(landingPageSlugsQuery, {}, ["landingPage"]);
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const settings = await query<SiteSettings | null>(siteSettingsQuery, {}, ["siteSettings"]);
  if (!settings) {
    throw new Error(
      "No siteSettings document in Sanity. Run `pnpm sanity:seed` to create it from content/data.ts.",
    );
  }
  return settings;
});

/* ---------------------------------------------------------------------------------------------
 * Helpers over objects a caller already holds. Synchronous by design.
 * ------------------------------------------------------------------------------------------- */

/** The soonest scheduled instance for one course, or undefined when none is dated. */
export function getNextInstanceForCourse(course: {
  instances?: CourseInstance[];
}): CourseInstance | undefined {
  return [...(course.instances ?? [])]
    .filter((instance): instance is CourseInstance & { startDate: string } =>
      Boolean(instance.startDate),
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
}

/* Seat, fee and bookability rules live in src/lib/batch.ts, which imports nothing and carries no
   `server-only`, so the unit suite can exercise them directly rather than through a rendered page.
   Re-exported here so every caller keeps one import. */
export { batchAction, courseCta, feeForInstance, rupeesToPaise, seatsLeft } from "@/lib/batch";
export type { CourseCta } from "@/lib/batch";

/**
 * Courses to show alongside this one: same skill area first, then the adjacent rung of the ladder,
 * then the next highest priority. Never includes the course itself.
 */
export async function getRelatedCourses(course: Course, limit = 3): Promise<Course[]> {
  const all = await getCourses();
  const picked = new Map<string, Course>();
  const add = (candidate: Course | undefined): void => {
    if (candidate && candidate.slug !== course.slug && !picked.has(candidate.slug)) {
      picked.set(candidate.slug, candidate);
    }
  };

  if (course.nextInLadder) add(all.find((candidate) => candidate.slug === course.nextInLadder));
  for (const sibling of all) {
    if (sibling.skillArea === course.skillArea) add(sibling);
  }
  for (const sibling of all) {
    if (sibling.nextInLadder === course.slug) add(sibling);
  }
  for (const sibling of all) {
    if (picked.size >= limit) break;
    add(sibling);
  }

  return [...picked.values()].slice(0, limit);
}

/** The course whose ladder points at this one, used for the "previous level" link. */
export async function getPreviousInLadder(course: Course): Promise<Course | undefined> {
  return (await getCourses()).find((candidate) => candidate.nextInLadder === course.slug);
}

/* ---------------------------------------------------------------------------------------------
 * Presentation maps. Not content: these are how the site words a stored value.
 * ------------------------------------------------------------------------------------------- */

export const levelBadge: Record<Level, { label: string; className: string }> = {
  foundation: { label: "Foundation", className: "bg-mustard text-black" },
  intermediate: { label: "Intermediate", className: "bg-blue text-white" },
  professional: { label: "Professional", className: "bg-purple text-white" },
  junior: { label: "IBC Junior", className: "bg-mustard text-black" },
  advanced: { label: "IBC Advanced", className: "bg-blue text-white" },
  open: { label: "Open level", className: "bg-white-2 text-black" },
};

export const skillAreaLabel: Record<SkillArea, string> = {
  "barista-skills": "Barista skills",
  "latte-art": "Latte art",
  brewing: "Brewing",
  "roasting-cupping": "Roasting and cupping",
  sensory: "Sensory",
  "green-coffee": "Green coffee",
  mixology: "Mixology",
  "cafe-management": "Cafe management",
};

export const formatLabel: Record<Format, string> = {
  "in-person": "In person",
  hybrid: "Hybrid",
  online: "Online",
};

export const faqCategoryLabel: Record<FaqItem["category"], string> = {
  courses: "Courses",
  fees: "Fees",
  certification: "Certification",
  schedule: "Schedule",
  campus: "Campus",
  careers: "Careers",
};
