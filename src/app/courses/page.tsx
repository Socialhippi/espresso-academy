import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { TbcPill } from "@/components/site/TbcPill";
import { LevelBadge } from "@/components/site/LevelBadge";
import { JsonLd } from "@/components/site/JsonLd";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageHero } from "@/components/sections/Hero";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { FinalCta } from "@/components/sections/FinalCta";
import { Placeholder } from "@/components/site/Placeholder";
import { CourseCard } from "@/components/course/CourseCard";
import { CourseFilters } from "@/components/course/CourseFilters";
import { LevelLadder } from "@/components/course/LevelLadder";
import {
  getCertifications,
  getCourses,
  getFaqsByCategories,
  getLevels,
  getSkillAreas,
  levelBadge,
  skillAreaLabel,
  type Level,
  type SkillArea,
} from "@/lib/content";
import { formatDuration, formatFeeAmount } from "@/lib/format";
import { pageMetadata } from "@/lib/seo/metadata";
import { courseListNode, faqNode, graph, webPageNode } from "@/lib/seo/schema";

const DESCRIPTION =
  "Every barista, latte art, brewing, roasting and cupping course at the Bengaluru campus, with the level and the certificate for each. Fees and dates are TBC.";

/** Canonical is always /courses: a filtered view is the same set, narrowed (.claude/rules/seo.md). */
export const metadata: Metadata = pageMetadata({
  title: "Barista & Coffee Courses in Bengaluru",
  description: DESCRIPTION,
  path: "/courses",
});

function parseLevel(value: string | undefined, allowed: Level[]): Level | null {
  return value && (allowed as string[]).includes(value) ? (value as Level) : null;
}

function parseArea(value: string | undefined, allowed: SkillArea[]): SkillArea | null {
  return value && (allowed as string[]).includes(value) ? (value as SkillArea) : null;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** The three routes through the course list. Facts only; every gap is named as unpublished. */
const howToChoose = [
  {
    title: "If you want a barista job",
    body: "Start with IBC Junior or Barista Skills Foundation. IBC Junior leads to the Italian Barista Certificate (IBC), issued by Espresso Academy, Florence. Barista Skills Foundation is training aligned to the SCA Coffee Skills Program. Neither assumes you have used a machine before.",
    href: "/courses?level=foundation",
    cta: "See foundation courses",
  },
  {
    title: "If you run or are opening a cafe",
    body: "Barista Skills Intermediate and Professional are the upper two rungs. Roasting and Cupping covers the roasting and cupping side, and the faculty hold Q Grader and CQI Q Processing credentials. Ask about training a whole team and the academy will scope it with you.",
    href: "/contact?topic=cafe",
    cta: "Ask about team training",
  },
  {
    title: "If you just love coffee",
    body: "Latte Art and Brewing are open to any level, so you do not need to work in a cafe first. The fee, duration and dates for both are not published yet.",
    href: "/courses?level=open",
    cta: "See open-level courses",
  },
];

export default async function CoursesPage({ searchParams }: PageProps<"/courses">) {
  const params = await searchParams;
  const levels = await getLevels();
  const skillAreas = await getSkillAreas();
  const activeLevel = parseLevel(firstValue(params.level), levels);
  const activeArea = parseArea(firstValue(params.area), skillAreas);

  const allCourses = await getCourses();
  const courses = allCourses.filter(
    (course) =>
      (activeLevel === null || course.level === activeLevel) &&
      (activeArea === null || course.skillArea === activeArea),
  );

  const faqs = await getFaqsByCategories(["courses", "fees"]);
  const certifications = await getCertifications();

  /* The fee section renders its list only when there is something in it to read. */
  const anyFeeOrDuration = allCourses.some(
    (course) =>
      course.feeInclGst !== null ||
      course.durationDays !== null ||
      course.durationHours !== null,
  );

  const filterSummary = [
    activeLevel ? levelBadge[activeLevel].label : null,
    activeArea ? skillAreaLabel[activeArea] : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <PageHero
        above={<Breadcrumbs items={[{ label: "Courses", href: "/courses" }]} />}
        eyebrow="Eight courses, two ladders"
        title="Barista and coffee courses in Bengaluru"
        intro={
          <>
            <p>
              The academy teaches at the RMV 2nd Stage campus across barista skills, latte art,
              brewing, and roasting and cupping. Two certificate ladders run through them. The{" "}
              <Link
                href="/certifications/italian-barista-certificate"
                className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
              >
                Italian Barista Certificate
              </Link>{" "}
              is issued in Italy by Espresso Academy, Florence, at Junior and Advanced level. The
              other courses are{" "}
              <Link
                href="/certifications/sca-coffee-skills-program"
                className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
              >
                training aligned to the SCA Coffee Skills Program
              </Link>{" "}
              at Foundation, Intermediate and Professional level.
            </p>
          </>
        }
        actions={
          <>
            <ButtonLink href="/enquire" variant="primary" data-event="enquire_click_courses">
              Ask which course fits
            </ButtonLink>
            <ButtonLink href="/calendar" variant="secondary">
              See the batch calendar
            </ButtonLink>
          </>
        }
        /* Portrait while it sits above the words, 3:2 once it sits beside them: a 4:5 frame in the
           five-column aside runs 588px tall at 1280 and overshoots the copy by ~190px, which is the
           same void it was meant to avoid, moved to the other side. Matches the homepage hero. */
        aside={
          <Placeholder slot="courses-hub" aspect="portrait" priority className="md:aspect-photo" />
        }
      />

      <section className="section-y-sm" aria-labelledby="course-list-heading">
        <Container>
          <CourseFilters
            levels={levels}
            skillAreas={skillAreas}
            activeLevel={activeLevel}
            activeArea={activeArea}
          />

          {/* The card grid is the page's main content and was the only band with no numbered
              opener, so the section numbering started at 01 on a secondary block. */}
          <SectionHeading
            number="01"
            eyebrow="The courses"
            title="Every course at the campus"
            id="course-list-heading"
            className="mt-12"
            description="No fee or batch date is published yet. Where a course shows TBC, the number is not confirmed, so ask the academy for the current figure."
          />
          <p className="mt-8 type-label text-grey" aria-live="polite">
            {courses.length} of {allCourses.length} courses
            {filterSummary ? `: ${filterSummary}` : ""}
          </p>

          {courses.length === 0 ? (
            <div className="mt-6 border border-white-2 bg-white-3 p-6 md:p-10">
              <p className="type-h3 text-black">Nothing matches that combination yet</p>
              <p className="mt-3 measure type-body text-grey">
                Clear the filters to see every course, or ask the academy whether it runs what you
                are looking for.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <ButtonLink href="/courses" variant="primary" size="sm">
                  Show all courses
                </ButtonLink>
                <WhatsAppButton size="sm" event="whatsapp_click_no_results" />
              </div>
            </div>
          ) : (
            <ul className="mt-6 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course, index) => (
                <li key={course.slug}>
                  <CourseCard course={course} priority={index === 0} />
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>

      {/*
        Deliberately not a three-up card grid. That is what AudienceDoors is on the homepage, and
        repeating the same module a section after the card grid above is the clearest template tell
        on the site. The guidance is the same; the composition is heading-left, rows-right.
      */}
      <section className="bg-white-3 section-y" aria-labelledby="choose-heading">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4">
              <SectionHeading
                number="02"
                eyebrow="How to choose"
                title="Which one is yours"
                id="choose-heading"
                description="Three routes through the same eight courses. Pick the one that sounds like where you are now, not where you want to end up."
                className="lg:sticky lg:top-28"
              />
            </div>
            <div className="lg:col-span-8">
              <ol className="divide-y divide-white-2 border-y border-white-2">
                {howToChoose.map((route, index) => (
                  <li key={route.href} className="flex gap-6 py-6 md:gap-8">
                    <span className="type-numeral text-h3-lg text-grey" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="block type-h3 text-black">{route.title}</span>
                      <span className="mt-2 block measure type-body text-grey">{route.body}</span>
                      <Link
                        href={route.href}
                        className="mt-3 inline-flex min-h-11 items-center type-label text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                      >
                        {route.cta}
                      </Link>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Container>
      </section>

      {/* Full width. The section above it is already a 4/8 split, and the ladder's five badges
          want the horizontal room. */}
      <section className="section-y" aria-labelledby="ladder-heading">
        <Container>
          <SectionHeading
            number="03"
            eyebrow="Levels"
            title="The two ladders"
            id="ladder-heading"
            description="Foundation to Professional on the SCA side, Junior to Advanced on the IBC side. They run in parallel."
          />
          <LevelLadder current={activeLevel ?? undefined} className="mt-10" />
        </Container>
      </section>

      <section className="bg-white-3 section-y-sm" aria-labelledby="fees-heading">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4">
              <SectionHeading
                number="04"
                eyebrow="Fees"
                title="What each course costs"
                id="fees-heading"
                description="Stated incl. GST, always, and confirmed before you pay. Nothing here is published yet."
                className="lg:sticky lg:top-28"
              />
            </div>
            {/* min-w-0: a grid item defaults to min-width:auto, which lets it grow to its content
                and takes the scroll container inside it along, so the table pushed the whole
                document sideways at 390. */}
            <div className="min-w-0 lg:col-span-8">
              {!anyFeeOrDuration ? (
                /*
                 * design.md's states rule is "empty state copy + WhatsApp", and this is the one
                 * place the site owed one and did not give it. With every cell null the list was
                 * eight rows of two identical grey pills, roughly 1300px at 390, restating the
                 * course titles and level badges the card grid above already shows in full, to
                 * prove the point the section description makes in one sentence. It comes back
                 * whole, with no code change, as soon as one fee or one duration lands.
                 */
                <div className="mt-4 border border-white-2 bg-white p-6 md:p-8">
                  <p className="type-h3 text-black">No fee is published yet</p>
                  <p className="mt-3 measure type-body text-grey">
                    Not for any of the {allCourses.length} courses. Rather than print a number the
                    academy has not confirmed, this page shows nothing. Ask on WhatsApp and you
                    will get the current fee for the course you want, incl. GST.
                  </p>
                  <div className="mt-6">
                    <WhatsAppButton event="whatsapp_click_fees" />
                  </div>
                </div>
              ) : (
                <>
              {/*
                Below md the table's four columns do not fit: Course and Level filled a 390px
                screen and Duration and Fee, the two that carry the section's whole point, sat
                entirely behind a sideways scroll. Stacked rows there, the table from md up where
                it fits without scrolling. Same data, same order, both from allCourses.
              */}
              <ul className="mt-4 divide-y divide-white-2 border-y border-white-2 md:hidden">
                {allCourses.map((course) => (
                  <li key={course.slug} className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <Link
                        href={`/courses/${course.slug}`}
                        className="inline-flex min-h-11 items-center type-body font-medium text-black underline decoration-white-2 underline-offset-4"
                      >
                        {course.title}
                      </Link>
                      <LevelBadge level={course.level} className="mt-3 shrink-0" />
                    </div>
                    <dl className="mt-2 flex flex-wrap gap-x-8 gap-y-2">
                      <div className="flex items-center gap-2">
                        <dt className="type-label text-grey">Duration</dt>
                        <dd className="type-small text-grey">
                          {course.durationDays === null && course.durationHours === null ? (
                            <TbcPill />
                          ) : (
                            formatDuration(course.durationDays, course.durationHours)
                          )}
                        </dd>
                      </div>
                      <div className="flex items-center gap-2">
                        <dt className="type-label text-grey">Fee incl. GST</dt>
                        <dd>
                          {course.feeInclGst === null ? (
                            <TbcPill />
                          ) : (
                            <span className="type-numeral text-h3-lg text-black">
                              {formatFeeAmount(course.feeInclGst)}
                            </span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>

              <div className="table-scroll mt-4 max-md:hidden md:mt-8">
                <table className="w-full min-w-lg border-collapse text-left">
                  <caption className="sr-only">
                    Fee, level and duration for every course at the Bengaluru campus
                  </caption>
                  {/* Sticky: the head scrolls away otherwise, and every row then shows two
                      identical grey TBC pills with nothing to tell the columns apart. */}
                  <thead>
                    <tr className="sticky top-0 z-10 border-b border-white-2 bg-white-3">
                      <th scope="col" className="py-3 pr-4 type-label text-grey">
                        Course
                      </th>
                      <th scope="col" className="py-3 pr-4 type-label text-grey">
                        Level
                      </th>
                      <th scope="col" className="py-3 pr-4 type-label text-grey">
                        Duration
                      </th>
                      <th scope="col" className="py-3 type-label text-grey">
                        Fee incl. GST
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCourses.map((course) => (
                      <tr key={course.slug} className="border-b border-white-2">
                        <th scope="row" className="py-4 pr-4 type-body font-medium">
                          <Link
                            href={`/courses/${course.slug}`}
                            className="inline-flex min-h-11 items-center text-black underline decoration-white-2 underline-offset-4 hover:text-red hover:decoration-red"
                          >
                            {course.title}
                          </Link>
                        </th>
                        <td className="py-4 pr-4">
                          <LevelBadge level={course.level} />
                        </td>
                        <td className="py-4 pr-4 type-small text-grey">
                          {course.durationDays === null && course.durationHours === null ? (
                            <TbcPill />
                          ) : (
                            formatDuration(course.durationDays, course.durationHours)
                          )}
                        </td>
                        <td className="py-4">
                          {course.feeInclGst === null ? (
                            <TbcPill />
                          ) : (
                            <span className="type-numeral text-h3-lg text-black">
                              {formatFeeAmount(course.feeInclGst)}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                </>
              )}
              {/* TODO(client): no fee is published for any course. Every cell is a TBC pill. */}
              <p className="mt-4 measure type-small text-grey">
                Whether a certification body charges its own fee on top of the course fee is not
                published either, so ask before you pay.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="section-y" aria-labelledby="certs-heading">
        <Container>
          <SectionHeading
            number="05"
            eyebrow="Certificates"
            title="What you walk out with"
            id="certs-heading"
          />
          <ul className="mt-10 grid gap-8 md:mt-14 md:grid-cols-2">
            {certifications.map((certification) => (
              <li key={certification.slug} className="flex flex-col border border-white-2 bg-white p-6 md:p-8">
                <h3 className="type-h3 text-black">{certification.name}</h3>
                <p className="mt-2 type-label text-grey">Issued by {certification.issuer}</p>
                <p className="mt-4 measure type-small text-grey">{certification.summary}</p>
                <p className="mt-auto pt-6">
                  <Link
                    href={`/certifications/${certification.slug}`}
                    className="inline-flex min-h-11 items-center type-body text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                  >
                    Read about the {certification.shortName}
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="section-y-sm" aria-labelledby="courses-faq-heading">
        <Container>
          {/* Full width, heading above. Sections 02 and 04 are both heading-left / content-right,
              and a third one here with nothing in the left column made one composition carry three
              of this page's six bands. The answers carry their own measure, so the rows can run
              the full width. */}
          <SectionHeading
            number="06"
            eyebrow="Questions"
            title="Courses and fees"
            id="courses-faq-heading"
          />
          <FaqAccordion items={faqs} className="mt-10 max-w-4xl md:mt-14" />
        </Container>
      </section>

      <FinalCta
        number="07"
        title="Not sure which one fits"
        body={
          <p>
            Send your background in one message and ask where to start. The fee and the batch dates
            are confirmed with you before you pay for anything.
          </p>
        }
      />

      <JsonLd
        id="courses-jsonld"
        data={graph([
          webPageNode("/courses", "Barista and coffee courses in Bengaluru", DESCRIPTION),
          courseListNode(allCourses, "/courses"),
          faqNode(faqs, "/courses"),
        ])}
      />
    </>
  );
}
