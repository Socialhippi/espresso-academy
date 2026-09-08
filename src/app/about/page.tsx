import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { TbcPill } from "@/components/site/TbcPill";
import { Placeholder } from "@/components/site/Placeholder";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { PageHero } from "@/components/sections/Hero";
import { TrainerGrid } from "@/components/sections/TrainerGrid";
import { FinalCta } from "@/components/sections/FinalCta";
import { getTrainers, getSiteSettings } from "@/lib/content";
import { cn } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo/metadata";
import { graph, webPageNode } from "@/lib/seo/schema";

const DESCRIPTION =
  "Espresso Academy was founded in Florence 19 years ago and has over 30 branches worldwide. The Bengaluru campus opened in 2023. Inside the academy.";

export const metadata: Metadata = pageMetadata({
  title: "About the Bengaluru Coffee Academy",
  description: DESCRIPTION,
  path: "/about",
});

/** Three statements about the set-up. No claim beyond content/facts.md; gaps stay TBC. */
const method = [
  {
    number: "01",
    title: "Taught at the Bengaluru campus",
    body: "Every course runs at the RMV 2nd Stage campus, near Ramaiah Hospital. The session format for each course, including the hours on a machine, is confirmed with you before you book.",
  },
  {
    number: "02",
    title: "The Florence link",
    body: "Espresso Academy has taught coffee in Florence since 2007. Espresso Academy India is an Official Partner of Espresso Academy, Florence, and the Italian Barista Certificate (IBC) is issued in Italy by Espresso Academy and sent to its authorised partner schools.",
  },
  {
    number: "03",
    title: "One certificate, three courses",
    /* facts.md, Courses: the eight-course catalogue is gone. Roasting, brewing, barista training
       and latte art are the four days of the IBC Basic, not four courses. */
    body: "The Italian Barista Certificate is the only certificate the academy issues, and all three courses lead to it. The IBC Basic is four days: roasting and cupping, brewing, barista training, latte art, one a day. Above it sit two Advanced courses of two days each, one for the bar and one for the roaster.",
  },
];

const galleryslots = [
  "about-campus-1",
  "about-campus-2",
  "about-campus-3",
  "about-campus-4",
  "about-campus-5",
  "about-campus-6",
];

export default async function AboutPage() {
  const [trainers, settings] = await Promise.all([getTrainers(), getSiteSettings()]);

  return (
    <>
      <PageHero
        above={<Breadcrumbs items={[{ label: "About", href: "/about" }]} />}
        eyebrow="About"
        title="Florence since 2007. Bengaluru since 2023."
        intro={
          <p>
            Espresso Academy was founded in Florence 19 years ago, in{" "}
            {settings.foundedFlorence}, and has over 30 branches worldwide. Espresso Academy India
            launched in Bengaluru in {settings.launchedBengaluru} and is an {settings.partnerLine};
            it teaches under the supervision of Espresso Academy Florence. The campus is in
            Bengaluru, and Bengaluru is the only campus this site speaks for.
          </p>
        }
        actions={
          <>
            <ButtonLink href="/courses" variant="primary">
              See the courses
            </ButtonLink>
            <ButtonLink href="/contact" variant="secondary">
              Visit the campus
            </ButtonLink>
          </>
        }
        aside={
          <dl className="grid grid-cols-2 gap-x-8 gap-y-6">
            {[
              { term: "Founded, Florence", value: String(settings.foundedFlorence), word: false },
              /* facts.md line 79: "17 branches worldwide" is superseded. "Over 30" is the
                 client's own figure and the numeral carries the "over". */
              { term: "Branches worldwide", value: "30+", word: false },
              { term: "Launched, Bengaluru", value: String(settings.launchedBengaluru), word: false },
              { term: "Campus", value: "RMV 2nd Stage", word: true },
            ].map((fact) => (
              <div key={fact.term} className="border-t border-white-2 pt-4">
                <dt className="type-label text-grey">{fact.term}</dt>
                <dd
                  className={
                    fact.word
                      ? "mt-2 type-body font-medium text-black"
                      : "mt-2 type-numeral text-h2 text-black"
                  }
                >
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        }
      />

      <section className="section-y" aria-labelledby="method-heading">
        <Container>
          {/* The heading runs above the band rather than beside it, and the band runs the full
              twelve columns. Inside an 8-of-12 span these three columns were 230px wide, about
              21 characters a line at 17px, which is a newspaper column and not body copy. Putting
              the heading on its own line also breaks the 4/8 split this page uses twice more. */}
          <SectionHeading
            number="01"
            eyebrow="The set-up"
            title="How the academy is put together"
            id="method-heading"
          />
          {/* A three-column band, not a stack of numbered rows: /courses uses the row form for
              its how-to-choose section, and repeating a composition across pages is the same
              template tell as repeating a component. */}
          <ol className="mt-10 grid gap-px border border-white-2 bg-white-2 md:mt-14 lg:grid-cols-3">
            {method.map((step) => (
              <li key={step.number} className="bg-white p-6 lg:p-8">
                <span className="type-numeral text-h3-lg text-grey" aria-hidden="true">
                  {step.number}
                </span>
                <h3 className="mt-3 type-h3 text-black">{step.title}</h3>
                <p className="mt-3 type-body text-grey">{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="section-y-sm bg-white-3" aria-labelledby="campus-heading">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <SectionHeading
                number="02"
                eyebrow="Campus"
                title="Where you will be"
                id="campus-heading"
              />
              <address className="mt-8 type-body text-black not-italic">
                {settings.address.line1}
                <br />
                {settings.address.line2}
                <br />
                {settings.address.city} {settings.address.postalCode}
              </address>
              {/* Both numbers belong in the first line: 9 is the plot, 72 is the building number
                  on 80 Feet Road (content/facts.md line 15). The map pin is the client's own. */}
              <p className="mt-4 type-small text-grey">
                The campus is on 80 Feet Road in RMV 2nd Stage, near Ramaiah Hospital.
              </p>
              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                {/* The map link is optional in the schema: without a confirmed pin there is
                    nothing honest to link to, and a wrong pin is worse than no button. */}
                {settings.address.mapsUrl ? (
                  <ButtonLink href={settings.address.mapsUrl} variant="secondary" size="sm" external>
                    Open in Google Maps
                  </ButtonLink>
                ) : null}
                <ButtonLink href="/contact" variant="tertiary" size="inline">
                  Phone numbers and directions
                </ButtonLink>
              </div>

              <p className="mt-10 type-label text-grey">The rooms and the kit</p>
              <p className="mt-3 type-body text-grey">
                Comfortable learning spaces and fully equipped professional labs. Day 1 of the IBC
                Basic roasts on a Bullet roaster, which you use yourself rather than watch.
              </p>
              {/* TODO(client): facts.md, Facility. The Bullet is the one piece of equipment the
                  client has named. The espresso machine and grinder are still unstated, and a
                  brand is exactly the kind of detail a reader will hold us to. */}
              <p className="mt-4 flex flex-wrap items-center gap-3 type-small text-grey">
                <TbcPill label="Machines TBC" />
                <span>The espresso machine and grinder list is being confirmed.</span>
              </p>
            </div>

            <div className="lg:col-span-7">
              <Placeholder slot="contact-campus" aspect="photo" />
            </div>
          </div>
        </Container>
      </section>

      <section className="section-y" aria-labelledby="gallery-heading">
        <Container>
          <SectionHeading
            number="03"
            eyebrow="Gallery"
            title="Inside the academy"
            id="gallery-heading"
            description="Photographs from the campus. The files are being prepared, so these are labelled placeholders rather than stock images."
          />
          {/* A mosaic, not an even grid: the trainer grid directly below is already three even
              columns, and two equal grids back to back is the layout repetition the de-template
              pass exists to remove. */}
          <ul className="mt-10 grid gap-4 md:grid-cols-6">
            {galleryslots.map((slot, index) => (
              <li
                key={slot}
                /* Only three frames on a phone: six stacked placeholders above the three trainer
                   cards turned 42% of the page into identical empty boxes. All six return with
                   the photography, where they are worth the scroll. */
                className={cn(
                  index === 0 ? "md:col-span-4 md:row-span-2" : "md:col-span-2",
                  index > 2 && "max-md:hidden",
                )}
              >
                <Placeholder
                  slot={slot}
                  aspect={index === 0 ? "wide" : "photo"}
                  className={index === 0 ? "md:h-full" : undefined}
                />
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="section-y-sm bg-white-3" aria-labelledby="team-heading">
        <Container>
          <SectionHeading
            number="04"
            eyebrow="The team"
            title="Who teaches here"
            id="team-heading"
            /* Both lines are the client's own, confirmed in facts.md revision 2. The faculty line
               is a description of credentials the trainer profiles then evidence one by one, which
               is the right order: the claim first, the proof under it. */
            description="Certified Q graders and processors, authorised trainers, and experienced hands-on professionals. International instructors visit the academy regularly."
            action={
              <ButtonLink href="/trainers" variant="tertiary" size="inline">
                Read the trainer profiles
              </ButtonLink>
            }
          />
          <p className="mt-6 measure type-body text-grey">
            Behind the teaching are seasoned food, beverage and hospitality professionals, and
            Coorg&rsquo;s next generation of coffee planters.
          </p>
          <TrainerGrid trainers={trainers} className="mt-10 md:mt-14" />
        </Container>
      </section>

      {/* The honesty paragraph, required by .claude/rules/content.md wherever certificates come up. */}
      <section className="section-y" aria-labelledby="honesty-heading">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4">
              <SectionHeading
                number="05"
                eyebrow="Straight answer"
                title="About the certificates"
                id="honesty-heading"
              />
            </div>
            <div className="lg:col-span-8">
              <p className="measure type-h3 text-black">
                A certificate helps you get an interview. Your skills get you the job.
              </p>
              <p className="mt-5 measure type-body text-grey">
                {/* facts.md line 11: the reach belongs to the issuer and is attributed to it.
                    "Globally accepted" is on the list of claims the site may not make. */}
                The Italian Barista Certificate (IBC) is issued in Italy by Espresso Academy,
                Florence, which has over 30 branches worldwide, and sent to its authorised partner
                schools. What that is worth to a particular employer in your city is a question
                worth asking that employer, and us.
              </p>
              <p className="mt-4 measure type-body text-grey">
                The academy does not run an SCA course. One of the trainers listed here is an SCA
                Authorised Trainer and assessed SCA modules run on batches the academy confirms,
                but if the SCA pathway is specifically what you want, say so before you book.
              </p>
              <p className="mt-4 measure type-body text-grey">
                The academy does not claim to be the first, the only or the best coffee school in
                India, and no placement rate, student count or rating is published here. Ask
                whether a course fits your experience and you will get a straight answer, including
                when the answer is no.{" "}
                <Link
                  href="/certifications"
                  className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                >
                  Compare the two certificates
                </Link>
                .
              </p>
            </div>
          </div>
        </Container>
      </section>

      <FinalCta
        number="06"
        title="Come and see the place"
        ctaLabel="Ask about visiting"
        href="/contact"
        body={
          <p>
            You are welcome to visit the campus before you book anything. The academy is open 10
            am to 7 pm, and which days it opens is being confirmed, so message first and ask when a
            class is running.
          </p>
        }
      />

      <JsonLd
        id="about-jsonld"
        data={graph([
          webPageNode("/about", "Florence since 2007. Bengaluru since 2023.", DESCRIPTION),
        ])}
      />
    </>
  );
}
