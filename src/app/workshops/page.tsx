import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { TbcPill } from "@/components/site/TbcPill";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { PageHero } from "@/components/sections/Hero";
import { FinalCta } from "@/components/sections/FinalCta";
import { CourseCard } from "@/components/course/CourseCard";
import { BatchRow, BatchRowHeader } from "@/components/course/BatchRow";
import { WaitlistInline } from "@/components/course/WaitlistInline";
import { getNextInstances, getWorkshops } from "@/lib/content";
import { pageMetadata } from "@/lib/seo/metadata";
import { graph, webPageNode } from "@/lib/seo/schema";

const DESCRIPTION =
  "Short coffee workshops in Bengaluru for enthusiasts and cafe teams: one sitting, no prerequisite, book a seat online. Dates and fees as the academy confirms them.";

export const metadata: Metadata = pageMetadata({
  title: "Coffee Workshops in Bengaluru",
  description: DESCRIPTION,
  path: "/workshops",
});

/**
 * Workshops: the short, no-prerequisite end of the offer.
 *
 * Calendar-first, unlike `/courses`, which leads with the ladder. Somebody looking for a workshop
 * is looking for a Saturday they are free on, not for a qualification pathway, so the dates come
 * first and the descriptions come after.
 *
 * Nothing here is a separate content type: a workshop is a `course` with `isWorkshop` ticked, so
 * the academy promotes one by ticking a box rather than by asking a developer for a page.
 */
export default async function WorkshopsPage() {
  const workshops = await getWorkshops();
  const workshopSlugs = new Set(workshops.map((workshop) => workshop.slug));
  const dated = (await getNextInstances()).filter(({ course }) => workshopSlugs.has(course.slug));

  return (
    <>
      <PageHero
        above={<Breadcrumbs items={[{ label: "Workshops", href: "/workshops" }]} />}
        eyebrow="Workshops"
        title="Short coffee workshops in Bengaluru"
        intro={
          <p>
            One sitting, no prerequisite, nothing to prepare. Come for an afternoon, leave able to
            do something you could not do that morning. Every workshop runs at the RMV 2nd Stage
            campus.
          </p>
        }
        actions={
          <>
            <ButtonLink href="/courses" variant="secondary">
              See the full courses
            </ButtonLink>
            <ButtonLink href="/for-cafes" variant="tertiary" size="inline">
              Booking for a team?
            </ButtonLink>
          </>
        }
      />

      <section className="section-y-sm" aria-labelledby="dates-heading">
        <Container>
          <SectionHeading number="01" eyebrow="Dates" title="What is coming up" id="dates-heading" />

          {dated.length > 0 ? (
            <div className="mt-8 table-scroll">
              <table className="w-full min-w-2xl border-collapse text-left">
                <caption className="sr-only">Scheduled workshops, soonest first</caption>
                <thead>
                  <BatchRowHeader variant="workshop" />
                </thead>
                <tbody>
                  {dated.map(({ course, instance }) => (
                    <BatchRow
                      key={instance.id}
                      course={course}
                      instance={instance}
                      variant="workshop"
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* TODO(client): no course carries isWorkshop yet, and no batch carries a date, so
               this is the state the page renders today. It becomes a table the moment the academy
               ticks the box on a course and gives one of its batches a date. */
            <div className="mt-8 border border-white-2 bg-white-3 p-6 md:p-10">
              <div className="flex flex-wrap items-center gap-3">
                <TbcPill label="Dates TBC" />
              </div>
              <h3 className="mt-4 type-h3 text-black">No workshop is scheduled yet</h3>
              <p className="mt-4 measure type-body text-grey">
                The academy announces a workshop once the date is fixed rather than listing one
                that might move. Leave your number and you will hear before it appears here.
              </p>
              <div className="mt-8">
                <WaitlistInline course="Workshops" />
              </div>
            </div>
          )}
        </Container>
      </section>

      {workshops.length > 0 && (
        <section className="section-y-sm bg-white-3" aria-labelledby="workshops-heading">
          <Container>
            <SectionHeading
              number="02"
              eyebrow="Workshops"
              title="What each one covers"
              id="workshops-heading"
            />
            <ul className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {workshops.map((workshop, index) => (
                <li key={workshop.slug}>
                  <CourseCard course={workshop} priority={index === 0} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <section className="section-y-sm" aria-labelledby="teams-heading">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <SectionHeading
                number={workshops.length > 0 ? "03" : "02"}
                eyebrow="Teams"
                title="Booking for more than one person"
                id="teams-heading"
              />
            </div>
            <div className="lg:col-span-7">
              <p className="measure type-body text-grey">
                A cafe team, a birthday, a company away-day. The academy runs these as their own
                session rather than seating everyone in a public workshop, so the content is aimed
                at what your group actually does.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <ButtonLink href="/for-cafes" variant="primary">
                  Ask about a group session
                </ButtonLink>
                <WhatsAppButton event="whatsapp_click_workshops">Ask on WhatsApp</WhatsAppButton>
              </div>
              <p className="mt-6 type-small text-grey">
                Not sure a workshop is the right thing?{" "}
                <Link
                  href="/courses"
                  className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                >
                  Compare it with the full courses
                </Link>
                .
              </p>
            </div>
          </div>
        </Container>
      </section>

      <FinalCta
        number={workshops.length > 0 ? "04" : "03"}
        title="Tell us what you want to learn"
        body={
          <p>
            The academy builds workshops around what people keep asking for. Say what you want to
            be able to do and they will tell you whether one is coming.
          </p>
        }
      />

      <JsonLd
        id="workshops-jsonld"
        data={graph([webPageNode("/workshops", "Short coffee workshops in Bengaluru", DESCRIPTION)])}
      />
    </>
  );
}
