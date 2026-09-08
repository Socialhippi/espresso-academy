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
import { LevelLadder } from "@/components/course/LevelLadder";
import {
  courseFeeExGst,
  getCertifications,
  getCourses,
  getFaqsByCategories,
  getLevels,
  getSkillAreas,
  hasLiveOffer,
  levelBadge,
  skillAreaLabel,
  type Course,
  type Level,
  type SkillArea,
} from "@/lib/content";
import { EX_GST, feeInclGst, formatDuration, formatFeeAmount, INCL_GST } from "@/lib/format";
import { pageMetadata } from "@/lib/seo/metadata";
import { courseListNode, faqNode, graph, webPageNode } from "@/lib/seo/schema";

const DESCRIPTION =
  "Three courses at the Bengaluru campus: the four-day Italian Barista Course, IBC Advanced Barista and IBC Advanced Roasting. Dates, seats and what each day covers.";

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

const IBC_BASIC = "/courses/italian-barista-course-basic";

/**
 * The three routes through the catalogue.
 *
 * Revision 2 of content/facts.md cut the catalogue from eight courses to three, and the third
 * route used to send "I just love coffee" to a filter of open-level courses that no longer exist.
 * Latte art and brewing are still taught; they are days 4 and 2 of the IBC Basic, so that is where
 * the link goes.
 */
const howToChoose = [
  {
    title: "If you want a barista job",
    body: "Take the IBC Basic. Four days, one module a day, from green coffee and roasting through brewing and espresso to latte art, ending in an assessed exam and the Italian Barista Certificate at Basic Barista. It assumes you have never touched a machine.",
    href: IBC_BASIC,
    cta: "See the four days",
  },
  {
    title: "If you already work on a bar",
    body: "IBC Advanced Barista is two days on varietals, extraction, recipes and a speed test. IBC Advanced Roasting is two days on curves, defects and cupping. Take either, or both: neither requires the other, and both are capped at 4 seats.",
    href: "/courses?level=advanced",
    cta: "See both Advanced courses",
  },
  {
    title: "If you just love coffee",
    body: "Latte art and brewing are not sold on their own. Latte art is day 4 of the IBC Basic and brewing is day 2, so you learn them inside the whole four days rather than in an afternoon.",
    href: `${IBC_BASIC}#day-4`,
    cta: "See the latte art day",
  },
];

/**
 * One fee, as it appears in both the stacked list and the table.
 *
 * Defined once because the two renderings of the same row are the classic place for a number to
 * drift. The offer is stated in words next to the struck-through price: a crossed-out figure on
 * its own is a sales trick, and the reason it is crossed out is a fact from content/facts.md.
 */
function FeeCell({ course }: { course: Course }) {
  const fee = courseFeeExGst(course);
  if (fee === null) return <TbcPill />;
  const total = feeInclGst({ exGst: fee, gstRate: course.gstRate });
  const offer = hasLiveOffer(course) && course.offerLabel;

  return (
    /* A column, not a wrapping row. With the total and the struck standard fee both present this
       cell carries four figures, and inline they wrapped mid-price at 1024. */
    <span className="flex flex-col gap-1">
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span className="type-numeral text-h3-lg text-black">{formatFeeAmount(fee)}</span>
        <span className="type-small text-grey">{EX_GST}</span>
      </span>
      {total !== null && (
        <span className="type-small text-black">
          {formatFeeAmount(total)} {INCL_GST}
        </span>
      )}
      {offer && (
        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          {/* The suffix belongs on the struck price too. Without it the hub read "₹26,700 + GST"
              beside a bare "₹35,600", which invites the reader to compare a pre-tax figure with
              something they cannot identify. */}
          <span className="sr-only">Usual price</span>
          <s className="type-small text-grey">
            {formatFeeAmount(course.feeExGst)} {EX_GST}
          </s>
          <span className="inline-flex items-center rounded-xs bg-red-tint px-2 py-0.5 type-label text-black">
            {course.offerLabel}
          </span>
        </span>
      )}
    </span>
  );
}

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
      courseFeeExGst(course) !== null ||
      course.durationDays !== null ||
      course.durationHours !== null,
  );

  const filtered = activeLevel !== null || activeArea !== null;
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
        eyebrow="Three courses, one certificate"
        title="Barista and coffee courses in Bengaluru"
        intro={
          <>
            <p>
              The academy runs the Italian Barista Course at the RMV 2nd Stage campus. Four days at
              Basic, then two Advanced courses of two days each, one for the bar and one for the
              roaster. All three lead to the{" "}
              <Link
                href="/certifications/italian-barista-certificate"
                className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
              >
                Italian Barista Certificate
              </Link>
              , which is issued in Italy by Espresso Academy, Florence.
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
          {/*
            No filter chips. They were built for eight courses across two ladders; over three
            courses a chip bar is more controls than content, and every card is above the fold on a
            phone. The ?level= and ?area= parameters still narrow the list, because the level ladder
            links to one, so a narrowed view says so and offers the way back.
          */}
          {/* The heading has to describe what is under it. At ?level=advanced the whole-catalogue
              standfirst sat directly above two cards, telling a reader that three courses were the
              whole catalogue while showing them two. */}
          <SectionHeading
            number="01"
            eyebrow="The courses"
            title={filtered ? `${filterSummary}` : "Every course at the campus"}
            id="course-list-heading"
            description={
              filtered
                ? undefined
                : "Three courses, and that is the whole catalogue. Latte art, brewing and roasting are days inside the IBC Basic rather than courses you can buy on their own."
            }
          />
          {filtered && (
            <p className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="type-label text-grey">
                {courses.length} of {allCourses.length} courses
              </span>
              <Link
                href="/courses"
                className="inline-flex min-h-11 items-center type-body text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
              >
                Show all {allCourses.length}
              </Link>
            </p>
          )}

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
                description="Three routes through three courses. Pick the one that sounds like where you are now, not where you want to end up."
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
                      {/* type-body, not type-label: design.md puts a 16px floor under red text
                          and these three are the only calls to action in the section. */}
                      <Link
                        href={route.href}
                        className="mt-3 inline-flex min-h-11 items-center type-body text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
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

      {/* Full width. The section above it is already a 4/8 split, and the ladder's badges want the
          horizontal room. */}
      <section className="section-y" aria-labelledby="ladder-heading">
        <Container>
          <SectionHeading
            number="03"
            eyebrow="Levels"
            title="Where each course sits"
            id="ladder-heading"
            description="One ladder. IBC Basic first, then either Advanced course, or both. Neither Advanced course requires the other."
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
                description="Quoted before GST, the way the academy quotes it, with the total including GST at 18% under each one. ₹5,000 holds a seat on any of the three and comes off the fee."
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
                 * place the site owed one and did not give it. It comes back whole, with no code
                 * change, as soon as one fee or one duration lands.
                 */
                <div className="mt-4 border border-white-2 bg-white p-6 md:p-8">
                  <p className="type-h3 text-black">No fee is published yet</p>
                  <p className="mt-3 measure type-body text-grey">
                    Not for any of the {allCourses.length} courses. Rather than print a number the
                    academy has not confirmed, this page shows nothing. Ask on WhatsApp and you
                    will get the current fee for the course you want.
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
                      {/* items-baseline, not items-center. The fee cell grew from one line to
                          four when the incl-GST total and the struck standard fee arrived, and a
                          centred "FEE" label floated down beside the third of them. */}
                      <div className="flex items-baseline gap-2">
                        <dt className="type-label text-grey">Fee</dt>
                        <dd>
                          <FeeCell course={course} />
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
                  {/* Not sticky. The scrollport is overflow-x only, so `sticky top-0` never
                      fired; it was written when this table had eight rows and lost its head to a
                      vertical scroll that does not exist here. */}
                  <thead>
                    <tr className="border-b border-white-2 bg-white-3">
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
                        Fee
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
                          <FeeCell course={course} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                </>
              )}
              <p className="mt-4 measure type-small text-grey">
                The Italian Barista Certificate is part of the course fee. Nothing separate is
                charged for it.
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
