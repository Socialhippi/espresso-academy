/**
 * Typed accessors over content/data.ts. Pages and components read content through here and
 * never import the data module directly, so the day this moves to Sanity only this file changes.
 */
import {
  certifications,
  courses,
  faqs,
  levelBadge,
  siteSettings,
  stories,
  trainers,
  type Certification,
  type Course,
  type CourseInstance,
  type FaqItem,
  type Level,
  type SkillArea,
  type Story,
  type Trainer,
} from "@content/data";

export type {
  Certification,
  Course,
  CourseInstance,
  FaqItem,
  Level,
  SkillArea,
  Story,
  Trainer,
};
export { levelBadge, siteSettings };

/** A course instance paired with the course it belongs to. */
export interface DatedInstance {
  course: Course;
  instance: CourseInstance;
  /** Never null: only instances with a start date reach this type. */
  startDate: string;
}

/** Every course, lowest priority number first. */
export function getCourses(): Course[] {
  return [...courses].sort((a, b) => a.priority - b.priority);
}

export function getCourse(slug: string): Course | undefined {
  return courses.find((course) => course.slug === slug);
}

export function getCourseSlugs(): string[] {
  return getCourses().map((course) => course.slug);
}

export function getCoursesByLevel(level: Level): Course[] {
  return getCourses().filter((course) => course.level === level);
}

export function getCoursesBySkillArea(skillArea: SkillArea): Course[] {
  return getCourses().filter((course) => course.skillArea === skillArea);
}

export function getCoursesForCertification(slug: Certification["slug"]): Course[] {
  return getCourses().filter((course) => course.certification === slug);
}

export function getCoursesForTrainer(trainerSlug: string): Course[] {
  return getCourses().filter((course) => course.trainers.includes(trainerSlug));
}

/** The skill areas that actually have a course, in hub order. */
export function getSkillAreas(): SkillArea[] {
  const seen = new Set<SkillArea>();
  for (const course of getCourses()) seen.add(course.skillArea);
  return [...seen];
}

/** The levels that actually have a course, in ladder order. */
export function getLevels(): Level[] {
  const ladder: Level[] = [
    "foundation",
    "intermediate",
    "professional",
    "junior",
    "advanced",
    "open",
  ];
  const present = new Set(getCourses().map((course) => course.level));
  return ladder.filter((level) => present.has(level));
}

export function getTrainers(): Trainer[] {
  return trainers;
}

export function getTrainer(slug: string): Trainer | undefined {
  return trainers.find((trainer) => trainer.slug === slug);
}

export function getTrainerSlugs(): string[] {
  return trainers.map((trainer) => trainer.slug);
}

/** Trainers assigned to a course, in the order the data lists them. */
export function getCourseTrainers(course: Course): Trainer[] {
  return course.trainers
    .map((slug) => getTrainer(slug))
    .filter((trainer): trainer is Trainer => trainer !== undefined);
}

export function getCertifications(): Certification[] {
  return certifications;
}

export function getCertification(slug: string): Certification | undefined {
  return certifications.find((certification) => certification.slug === slug);
}

export function getCertificationSlugs(): Certification["slug"][] {
  return certifications.map((certification) => certification.slug);
}

export function getFaqs(category?: FaqItem["category"]): FaqItem[] {
  return category ? faqs.filter((faq) => faq.category === category) : faqs;
}

export function getFaqsByCategories(categories: FaqItem["category"][]): FaqItem[] {
  return faqs.filter((faq) => categories.includes(faq.category));
}

/** FAQ categories in the order they first appear in the data. */
export function getFaqCategories(): FaqItem["category"][] {
  const seen = new Set<FaqItem["category"]>();
  for (const faq of faqs) seen.add(faq.category);
  return [...seen];
}

/**
 * The next n scheduled instances across all courses, soonest first.
 * Instances without a start date are not scheduled, so they never appear here; a caller that
 * gets an empty array renders the "dates being finalised" state.
 */
export function getNextInstances(n?: number): DatedInstance[] {
  const dated: DatedInstance[] = [];
  for (const course of getCourses()) {
    for (const instance of course.instances) {
      if (instance.startDate) {
        dated.push({ course, instance, startDate: instance.startDate });
      }
    }
  }
  dated.sort((a, b) => a.startDate.localeCompare(b.startDate));
  return typeof n === "number" ? dated.slice(0, n) : dated;
}

/** The soonest scheduled instance for one course, or undefined when none is dated. */
export function getNextInstanceForCourse(course: Course): CourseInstance | undefined {
  return [...course.instances]
    .filter((instance): instance is CourseInstance & { startDate: string } =>
      Boolean(instance.startDate),
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
}

/** False while the client has not supplied a single batch date. */
export function hasAnyDates(): boolean {
  return getNextInstances(1).length > 0;
}

/** Only stories the subject has given permission to publish. Empty until real ones arrive. */
export function getStories(): Story[] {
  return stories.filter((story) => story.permission);
}

/**
 * Courses to show alongside this one: same skill area first, then the adjacent rung of the
 * ladder, then the next highest priority. Never includes the course itself.
 */
export function getRelatedCourses(course: Course, limit = 3): Course[] {
  const picked = new Map<string, Course>();
  const add = (candidate: Course | undefined): void => {
    if (candidate && candidate.slug !== course.slug && !picked.has(candidate.slug)) {
      picked.set(candidate.slug, candidate);
    }
  };

  if (course.nextInLadder) add(getCourse(course.nextInLadder));
  for (const sibling of getCoursesBySkillArea(course.skillArea)) add(sibling);
  for (const sibling of getCourses()) {
    if (sibling.nextInLadder === course.slug) add(sibling);
  }
  for (const sibling of getCourses()) {
    if (picked.size >= limit) break;
    add(sibling);
  }

  return [...picked.values()].slice(0, limit);
}

/** The course whose ladder points at this one, used for the "previous level" link. */
export function getPreviousInLadder(course: Course): Course | undefined {
  return getCourses().find((candidate) => candidate.nextInLadder === course.slug);
}

/** Human label for a skill area, used on filter chips and spec strips. */
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

/** Human label for a delivery format. */
export const formatLabel: Record<NonNullable<Course["format"]>, string> = {
  "in-person": "In person",
  hybrid: "Hybrid",
  online: "Online",
};

/** Human label for an FAQ category, used as the group heading on /faq. */
export const faqCategoryLabel: Record<FaqItem["category"], string> = {
  courses: "Courses",
  fees: "Fees",
  certification: "Certification",
  schedule: "Schedule",
  campus: "Campus",
  careers: "Careers",
};
