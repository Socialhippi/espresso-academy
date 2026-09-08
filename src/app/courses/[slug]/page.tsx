import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, X } from "lucide-react";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { TbcPill } from "@/components/site/TbcPill";
import { LevelBadge } from "@/components/site/LevelBadge";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Placeholder } from "@/components/site/Placeholder";
import { JsonLd } from "@/components/site/JsonLd";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { FinalCta } from "@/components/sections/FinalCta";
import { TrainerCard } from "@/components/sections/TrainerGrid";
import { CourseCard } from "@/components/course/CourseCard";
import { SpecStrip } from "@/components/course/SpecStrip";
import { BatchTable } from "@/components/course/BatchTable";
import { FeeBlock } from "@/components/course/FeeBlock";
import { LevelLadder } from "@/components/course/LevelLadder";
import {
  courseCta,
  getCertification,
  getCourse,
  getCourseSlugs,
  getCourseTrainers,
  getPreviousInLadder,
  getRelatedCourses,
  type Course,
} from "@/lib/content";
import { clampDescription, pageMetadata } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/env";
import { courseNode, faqNode, graph, webPageNode } from "@/lib/seo/schema";

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return (await getCourseSlugs()).map((slug) => ({ slug }));
}

/**
 * seo.md sets both a title pattern and a 50 to 60 character ceiling, and the pattern overflows it
 * for most of these course names. The ceiling wins, because it is what a search result actually
 * shows: take the longest variant of the pattern that still fits.
 */
function courseTitle(course: Course): string {
  const SUFFIX_LENGTH = " | Espresso Academy India".length;
  const candidates = [
    `${course.title} Course in Bengaluru`,
    `${course.title} in Bengaluru`,
    course.title,
    // Last resort for the longest names: the level label is the short form of the same thing.
    `${course.levelLabel} Course in Bengaluru`,
  ];
  return (
    candidates.find((candidate) => candidate.length + SUFFIX_LENGTH <= 60) ??
    `${course.levelLabel} Course in Bengaluru`
  );
}

function courseDescription(course: Course): string {
  const base = `${course.outcome} Taught at the Bengaluru campus, ${course.levelLabel.toLowerCase()}.`;
  const certificate = course.certificateAwardedLabel
    ? ` Leads to the ${course.certificateAwardedLabel.split(",")[0]}.`
    : "";
  /*
   * Append the certificate clause only when the whole sentence still fits. Clamping the joined
   * string instead truncated it mid-clause: /courses/brewing ended on "Leads to.".
   */
  const full = base + certificate;
  return clampDescription(full.length <= 158 ? full : base);
}

export async function generateMetadata({
  params,
}: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) return { title: "Course not found" };

  return pageMetadata({
    title: courseTitle(course),
    description: courseDescription(course),
    path: `/courses/${course.slug}`,
    // This course's own card, from src/app/courses/[slug]/opengraph-image.tsx.
    ogImage: absoluteUrl(`/courses/${course.slug}/opengraph-image`),
  });
}

export default async function CoursePage({ params }: PageProps<"/courses/[slug]">) {
  const { slug } = await params;
  const course = await getCourse(slug);
  if (!course) notFound();

  const trainers = await getCourseTrainers(course);
  const related = await getRelatedCourses(course);
  const nextCourse = course.nextInLadder ? await getCourse(course.nextInLadder) : undefined;
  const previousCourse = await getPreviousInLadder(course);
  const certification = course.certification ? await getCertification(course.certification) : undefined;

  /* The faculty section only exists when trainers are assigned, so the numerals are counted
     rather than written in: a gap in the sequence reads as a mistake. */
  let sectionNumber = 0;
  const next = (): string => String(++sectionNumber).padStart(2, "0");

  const cta = courseCta(course, course.instances);

  return (
    <>
      <section className="border-b border-white-2 pt-6 pb-10 md:pt-8 md:pb-16">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Courses", href: "/courses" },
              { label: course.title, href: `/courses/${course.slug}` },
            ]}
          />

          <div className="mt-6 grid gap-10 md:mt-8 nav:grid-cols-12 nav:gap-12">
            <div className="nav:col-span-7">
              <LevelBadge level={course.level} />
              <h1 className="mt-4 type-h1 text-black">{course.title}</h1>
              <p className="mt-5 measure type-body text-grey">{course.outcome}</p>
              {/*
                The primary action follows the batches, not the page template. One open priced
                batch goes straight to its checkout; several scroll to the table; an unpriced or
                undated batch asks. `courseCta` is the same rule the hub cards and the home batch
                rows use, and it is unit-tested per state.
              */}
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                <ButtonLink href={cta.href} variant="primary" data-event={`${cta.event}_hero`}>
                  {cta.label}
                </ButtonLink>
                <WhatsAppButton course={course.title} event="whatsapp_click_course" />
              </div>
            </div>

            <div className="nav:col-span-5">
              <Placeholder slot={`course-${course.slug}`} aspect="photo" />
            </div>
          </div>

          <SpecStrip course={course} className="mt-12 md:mt-16" />
        </Container>
      </section>

      {/* Who it is for, and honestly who it is not. */}
      <section className="section-y" aria-labelledby="fit-heading">
        <Container>
          <SectionHeading number={next()} eyebrow="Fit" title="Is this the right one" id="fit-heading" />
          <div className="mt-10 grid gap-px border border-white-2 bg-white-2 md:grid-cols-2">
            <div className="bg-white p-6 md:p-8">
              <h3 className="type-h3 text-black">Who this is for</h3>
              <ul className="mt-5 flex flex-col gap-4">
                {course.forWhom.map((item) => (
                  <li key={item} className="flex gap-3 type-body text-black">
                    {/* Black, not green: --color-green is an unconfirmed interim hex scoped to the
                        "seats available" state (STATUS client item 20), and decorative ticks on
                        every course page would make a placeholder colour a brand accent. */}
                    <Check className="mt-1 size-5 shrink-0 text-black" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-6 md:p-8">
              <h3 className="type-h3 text-black">Who this is not for</h3>
              <ul className="mt-5 flex flex-col gap-4">
                {course.notForWhom.map((item) => (
                  <li key={item} className="flex gap-3 type-body text-grey">
                    <X className="mt-1 size-5 shrink-0 text-red" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <section className="section-y bg-white-3" aria-labelledby="learn-heading">
        <Container>
          <SectionHeading
            number={next()}
            eyebrow="Syllabus"
            title="What you will learn"
            id="learn-heading"
            description={
              course.days && course.days.length > 0
                ? `${course.days.length} ${course.days.length === 1 ? "day" : "days"}, one module a day. You take the whole course, not a single day of it.`
                : undefined
            }
          />

          {course.days && course.days.length > 0 ? (
            /*
             * A day is an addressable thing, not the nth item in a list. /courses/latte-art and
             * /courses/brewing were retired when revision 2 of facts.md folded them into the IBC,
             * and they now redirect to #day-4 and #day-2 here. Someone who searched for a latte
             * art course lands on the latte art day rather than on a page that mentions it
             * somewhere. `:target` in globals.css already clears the sticky header.
             */
            <ol className="mt-10 grid gap-px border border-white-2 bg-white-2 md:mt-14 lg:grid-cols-2">
              {course.days.map((day) => (
                <li key={day.number} id={`day-${day.number}`} className="bg-white p-6 md:p-8">
                  <p className="type-label text-grey">Day {day.number}</p>
                  <h3 className="mt-2 type-h3 text-black">{day.title}</h3>
                  <ul className="mt-5 flex flex-col gap-3">
                    {day.topics.map((topic) => (
                      <li key={topic} className="flex gap-3 type-body text-grey">
                        {/* A 1px red rule rather than a tick: the ticks in the "who this is for"
                            panel above mean "this applies to you", and reusing them here would
                            make a syllabus look like a checklist of promises. */}
                        <span
                          className="mt-3 h-px w-3 shrink-0 bg-red"
                          aria-hidden="true"
                        />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          ) : (
            /* TODO(client): course.days. No day-by-day outline has been supplied for this course. */
            <div className="mt-10 border border-white-2 bg-white p-6 md:mt-14 md:p-10">
              <div className="flex items-center gap-3">
                <TbcPill label="Syllabus TBC" />
              </div>
              <p className="mt-4 type-h3 text-black">Syllabus being finalised</p>
              <p className="mt-3 measure type-body text-grey">
                The day-by-day outline for this course is not published yet. Ask on WhatsApp and
                the academy will send the current one.
              </p>
              <WhatsAppButton
                className="mt-6"
                size="sm"
                course={course.title}
                message={`Hi, please send the current outline for ${course.title}.`}
                event="whatsapp_click_syllabus"
              >
                Ask on WhatsApp for the outline
              </WhatsAppButton>
            </div>
          )}

          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div className="border border-white-2 bg-white p-6">
              <p className="type-label text-grey">What you get</p>
              {course.certificateAwardedLabel ? (
                <p className="mt-3 type-body text-black">
                  {course.certificateAwardedLabel}
                  {certification && (
                    <>
                      {". "}
                      <Link
                        href={`/certifications/${certification.slug}`}
                        className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                      >
                        What the {certification.shortName} is worth
                      </Link>
                    </>
                  )}
                </p>
              ) : (
                <p className="mt-3 type-body text-black">
                  No certificate is issued for this course. You leave with the skill, not a
                  piece of paper.
                </p>
              )}
              {/* "What the fee includes" is not repeated here: FeeBlock states it beside the
                  fee itself, which is where a reader looks for it, and this card was printing
                  the same label and the same TBC pill a second time on the same page. */}
            </div>

            <div className="border border-white-2 bg-white p-6">
              <p className="type-label text-grey">Before you start</p>
              <p className="mt-3 type-body text-black">
                {course.prerequisites ?? "Prerequisites for this course are not published yet."}
              </p>
              {trainers.length === 0 && (
                /* TODO(client): courses[].trainers is empty for this course. */
                <p className="mt-4 type-small text-grey">
                  The trainer is set per batch and is not listed yet.{" "}
                  <Link
                    href="/trainers"
                    className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                  >
                    Read the trainer profiles
                  </Link>
                  .
                </p>
              )}
              {previousCourse && (
                <p className="mt-3 type-small text-grey">
                  The rung below is{" "}
                  <Link
                    href={`/courses/${previousCourse.slug}`}
                    className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                  >
                    {previousCourse.title}
                  </Link>
                  .
                </p>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* Only a section when there is something to show. With courses[].trainers empty this was a
          numbered full-width band carrying two lines of "not listed yet"; the line now sits with
          the other unknowns in the syllabus card above. */}
      {trainers.length > 0 && (
        <section className="section-y-sm" aria-labelledby="teach-heading">
          <Container>
            <SectionHeading
              number={next()}
              eyebrow="Faculty"
              title="Who teaches it"
              id="teach-heading"
            />
            <ul className="mt-10 grid gap-10 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
              {trainers.map((trainer, index) => (
                <li key={trainer.slug}>
                  <TrainerCard trainer={trainer} priority={index === 0} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <section className="section-y" aria-labelledby="dates-heading">
        <Container>
          {/* The heading runs above both columns. Inside the left one it pushed the batch table
              76px below the fee block beside it, and the md:mt-16 that used to pull the fee block
              down to compensate was a guess at the heading's height rather than a measurement.
              Now both start on the same line and neither has to know about the other. */}
          <SectionHeading
            number={next()}
            eyebrow="Dates"
            title="Next batches"
            id="dates-heading"
          />
          <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-12">
            {/* min-w-0: a grid item defaults to min-width:auto, so it cannot shrink below its
                content's min-content width, and the batch table's is five columns wide. Without
                this the scroll container inside it never gets to scroll and the whole document goes
                19px wide at 360. It only appeared when a batch first got a real date. */}
            <div className="min-w-0 lg:col-span-7">
              <BatchTable course={course} />
            </div>
            <div className="lg:col-span-5">
              <FeeBlock course={course} />
            </div>
          </div>
        </Container>
      </section>

      <section className="section-y-sm" aria-labelledby="ladder-heading">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4">
              <SectionHeading
                number={next()}
                eyebrow="Ladder"
                title="Where this sits"
                id="ladder-heading"
              />
              {nextCourse ? (
                <Link
                  href={`/courses/${nextCourse.slug}`}
                  className="group mt-8 flex items-center justify-between gap-4 border border-white-2 p-5 transition-[color,background-color,border-color] duration-200 hover:border-black"
                >
                  <span>
                    <span className="block type-label text-grey">Next in the ladder</span>
                    <span className="mt-2 block type-h3 text-black group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                      {nextCourse.title}
                    </span>
                  </span>
                  <ArrowRight
                    className="size-6 shrink-0 text-red transition-transform duration-200 ease-out-brand group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              ) : (
                <p className="mt-8 type-body text-grey">
                  This is the top rung of its ladder. After it, the useful next step is a different
                  skill area rather than a higher level.
                </p>
              )}
            </div>
            <div className="lg:col-span-8">
              <LevelLadder current={course.level} />
            </div>
          </div>
        </Container>
      </section>

      {/* Full width, not the 4/8 split: the ladder section directly above already uses it. */}
      <section className="section-y bg-white-3" aria-labelledby="course-faq-heading">
        <Container>
          <SectionHeading
            number={next()}
            eyebrow="Questions"
            title="About this course"
            id="course-faq-heading"
          />
          {/* Capped: at 1200px a question's chevron sits a thousand pixels from its text. */}
          <FaqAccordion
            className="mt-8 max-w-4xl"
            items={course.faq.map((item) => ({ ...item, category: "courses" }))}
          />
        </Container>
      </section>

      {related.length > 0 && (
        <section className="section-y-sm" aria-labelledby="related-heading">
          <Container>
            <SectionHeading
              number={next()}
              eyebrow="Related"
              title="Other courses to look at"
              id="related-heading"
              action={
                <ButtonLink href="/courses" variant="tertiary" size="inline">
                  See all courses
                </ButtonLink>
              }
            />
            <ul className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.slug}>
                  <CourseCard course={item} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <FinalCta
        number={next()}
        title={cta.kind === "book" || cta.kind === "choose" ? "Book your seat" : "Ask about this course"}
        ctaLabel={cta.label}
        href={cta.href}
        event={`${cta.event}_final`}
        course={course.title}
        body={
          /* The body has to follow the button. "The fee and the batch dates are confirmed with you
             before you pay" is true of an enquiry and false of a checkout, where nobody confirms
             anything with anyone. */
          cta.kind === "book" || cta.kind === "choose" ? (
            <p>
              ₹5,000 confirms the seat and the balance is paid at the academy before the first day.
              Read the refund and reschedule policy before you pay, and message on WhatsApp first
              if you are not sure this is the right starting point.
            </p>
          ) : (
            <p>
              Send your name and number with a line about your experience, and ask whether{" "}
              {course.title} is the right starting point. The fee and the batch dates are confirmed
              with you before you pay anything.
            </p>
          )
        }
      />

      <JsonLd
        id="course-jsonld"
        data={graph([
          webPageNode(`/courses/${course.slug}`, course.title, courseDescription(course)),
          await courseNode(course),
          faqNode(
            course.faq.map((item) => ({ ...item, category: "courses" as const })),
            `/courses/${course.slug}`,
          ),
        ])}
      />
    </>
  );
}
