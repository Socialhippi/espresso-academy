import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { TbcPill } from "@/components/site/TbcPill";
import { LevelBadge } from "@/components/site/LevelBadge";
import { JsonLd } from "@/components/site/JsonLd";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { PageHero } from "@/components/sections/Hero";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { FinalCta } from "@/components/sections/FinalCta";
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

export default async function CoursesPage({ searchParams }: PageProps<"/courses">) {
  const params = await searchParams;
  const levels = getLevels();
  const skillAreas = getSkillAreas();
  const activeLevel = parseLevel(firstValue(params.level), levels);
  const activeArea = parseArea(firstValue(params.area), skillAreas);

  const allCourses = getCourses();
  const courses = allCourses.filter(
    (course) =>
      (activeLevel === null || course.level === activeLevel) &&
      (activeArea === null || course.skillArea === activeArea),
  );

  const faqs = getFaqsByCategories(["courses", "fees"]);
  const certifications = getCertifications();

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
        eyebrow="Courses"
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
            <p className="mt-4">
              No fee or batch date is published yet. Where a course shows TBC below, the number is
              not confirmed, so ask the academy for the current figure.
            </p>
          </>
        }
        actions={
          <ButtonLink href="/calendar" variant="secondary">
            See the batch calendar
          </ButtonLink>
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

          <h2 id="course-list-heading" className="mt-10 type-label text-grey" aria-live="polite">
            {courses.length} of {allCourses.length} courses
            {filterSummary ? `: ${filterSummary}` : ""}
          </h2>

          {courses.length === 0 ? (
            <div className="mt-6 border border-white-2 bg-white-3 p-6 md:p-10">
              <p className="type-h3 text-black">Nothing matches that combination yet</p>
              <p className="mt-3 measure type-body text-grey">
                Clear the filters to see every course, or ask the academy whether it runs what you
                are looking for.
              </p>
              <ButtonLink href="/courses" variant="primary" size="sm" className="mt-6">
                Show all courses
              </ButtonLink>
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

      <section className="section-y bg-white-3" aria-labelledby="choose-heading">
        <Container>
          <SectionHeading
            number="01"
            eyebrow="How to choose"
            title="Which one is yours"
            id="choose-heading"
          />
          <div className="mt-10 grid gap-px border border-white-2 bg-white-2 md:mt-14 md:grid-cols-3">
            <div className="bg-white p-6 md:p-8">
              <h3 className="type-h3 text-black">If you want a barista job</h3>
              <p className="mt-3 type-small text-grey">
                Start with IBC Junior or Barista Skills Foundation. IBC Junior leads to the Italian
                Barista Certificate (IBC), issued by Espresso Academy, Florence. Barista Skills
                Foundation is training aligned to the SCA Coffee Skills Program. Neither assumes
                you have used a machine before.
              </p>
              <p className="mt-4">
                <Link
                  href="/courses?level=foundation"
                  className="type-label text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                >
                  See foundation courses
                </Link>
              </p>
            </div>
            <div className="bg-white p-6 md:p-8">
              <h3 className="type-h3 text-black">If you run or are opening a cafe</h3>
              <p className="mt-3 type-small text-grey">
                Barista Skills Intermediate and Professional are the upper two rungs. Roasting and
                Cupping covers the roasting and cupping side, and the faculty hold Q Grader and CQI
                Q Processing credentials. Whether the academy runs cafe or team training is not
                published, so ask.
              </p>
              <p className="mt-4">
                <Link
                  href="/contact?topic=cafe"
                  className="type-label text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                >
                  Ask about team training
                </Link>
              </p>
            </div>
            <div className="bg-white p-6 md:p-8">
              <h3 className="type-h3 text-black">If you just love coffee</h3>
              <p className="mt-3 type-small text-grey">
                Latte Art and Brewing are listed at all levels, so you do not need to work in a
                cafe first. The fee, duration and dates for both are not published yet.
              </p>
              <p className="mt-4">
                <Link
                  href="/courses?level=open"
                  className="type-label text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                >
                  See open-level courses
                </Link>
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="section-y" aria-labelledby="ladder-heading">
        <Container>
          <div className="grid gap-10 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-4">
              <SectionHeading
                number="02"
                eyebrow="Levels"
                title="The two ladders"
                id="ladder-heading"
                description="Foundation to Professional on the SCA side, Junior to Advanced on the IBC side. They run in parallel."
              />
            </div>
            <div className="md:col-span-8">
              <LevelLadder current={activeLevel ?? undefined} />
            </div>
          </div>
        </Container>
      </section>

      <section className="section-y-sm" aria-labelledby="fees-heading">
        <Container>
          <SectionHeading number="03" eyebrow="Fees" title="What each course costs" id="fees-heading" />
          <div className="mt-8 table-scroll">
            <table className="w-full min-w-2xl border-collapse text-left">
              <caption className="sr-only">
                Fee, level and duration for every course at the Bengaluru campus
              </caption>
              <thead>
                <tr className="border-b border-white-2">
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
                        className="text-black underline decoration-white-2 underline-offset-4 hover:text-red hover:decoration-red"
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
          {/* TODO(client): no fee is published for any course. Every cell above is a TBC pill. */}
          <p className="mt-4 measure type-small text-grey">
            Fees are stated incl. GST. No fee is published yet, so every figure above is waiting
            on the academy. Whether a certification body charges its own fee on top is not
            published either, so ask before you pay.
          </p>
        </Container>
      </section>

      <section className="section-y bg-white-3" aria-labelledby="certs-heading">
        <Container>
          <SectionHeading
            number="04"
            eyebrow="Certificates"
            title="What you walk out with"
            id="certs-heading"
          />
          <ul className="mt-10 grid gap-8 md:mt-14 md:grid-cols-2">
            {certifications.map((certification) => (
              <li key={certification.slug} className="border border-white-2 bg-white p-6 md:p-8">
                <h3 className="type-h3 text-black">{certification.name}</h3>
                <p className="mt-2 type-label text-grey">Issued by {certification.issuer}</p>
                <p className="mt-4 measure type-small text-grey">{certification.summary}</p>
                <p className="mt-6">
                  <Link
                    href={`/certifications/${certification.slug}`}
                    className="type-label text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
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
          <div className="grid gap-10 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-4">
              <SectionHeading
                number="05"
                eyebrow="Questions"
                title="Courses and fees"
                id="courses-faq-heading"
              />
            </div>
            <div className="md:col-span-8">
              <FaqAccordion items={faqs} />
            </div>
          </div>
        </Container>
      </section>

      <FinalCta
        number="06"
        title="Not sure which one fits"
        body={
          <p>
            Send your background in one message and ask where to start. The fee and the batch
            dates are confirmed with you before you pay for anything.
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
