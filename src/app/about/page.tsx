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
import { getTrainers, siteSettings } from "@/lib/content";
import { pageMetadata } from "@/lib/seo/metadata";
import { graph, webPageNode } from "@/lib/seo/schema";

const DESCRIPTION =
  "Espresso Academy has taught coffee in Florence since 2007 and in Bengaluru since 2023, as the Official Partner of Espresso Academy, Florence. Here is how it teaches.";

export const metadata: Metadata = pageMetadata({
  title: "About the Academy",
  description: DESCRIPTION,
  path: "/about",
});

/** The method. Each step describes how the courses are run; no claim beyond content/facts.md. */
const method = [
  {
    number: "01",
    title: "Machine time, not slides",
    body: "The courses are built around time on a professional machine. You are pulling shots in the first session, not watching someone else pull them.",
  },
  {
    number: "02",
    title: "The Florence method",
    body: "Espresso Academy has taught coffee in Florence since 2007. The Bengaluru campus teaches to the same method, and the Italian Barista Certificate is issued in Italy and sent here.",
  },
  {
    number: "03",
    title: "Assessed, not attended",
    body: "Certificates are awarded on assessment. That is what makes them worth something to an employer, and it is why we say plainly when a course is not the right starting point for you.",
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

export default function AboutPage() {
  const trainers = getTrainers();

  return (
    <>
      <PageHero
        above={<Breadcrumbs items={[{ label: "About", href: "/about" }]} />}
        eyebrow="About"
        title="A Florence coffee school, teaching in Bengaluru"
        intro={
          <p>
            Espresso Academy was founded in Florence and has focused on coffee education since{" "}
            {siteSettings.foundedFlorence}. Espresso Academy India launched in Bengaluru in{" "}
            {siteSettings.launchedBengaluru} and is the {siteSettings.partnerLine.toLowerCase()}.
            Espresso Academy also lists a partner in New Delhi, so what we claim is Bengaluru, not
            India.
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
      />

      <section className="section-y-sm" aria-labelledby="method-heading">
        <Container>
          <div className="grid gap-10 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-4">
              <SectionHeading
                number="01"
                eyebrow="The method"
                title="How the teaching works"
                id="method-heading"
              />
            </div>
            <div className="md:col-span-8">
              <ol className="divide-y divide-white-2 border-y border-white-2">
                {method.map((step) => (
                  <li key={step.number} className="flex gap-6 py-6">
                    <span className="type-numeral text-h3-lg text-red" aria-hidden="true">
                      {step.number}
                    </span>
                    <span>
                      <span className="block type-h3 text-black">{step.title}</span>
                      <span className="mt-2 block measure type-body text-grey">{step.body}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Container>
      </section>

      <section className="section-y-sm bg-white-3" aria-labelledby="campus-heading">
        <Container>
          <div className="grid gap-10 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-5">
              <SectionHeading
                number="02"
                eyebrow="Campus"
                title="Where you will be"
                id="campus-heading"
              />
              <address className="mt-8 type-body text-black not-italic">
                {siteSettings.address.line1}
                <br />
                {siteSettings.address.line2}
                <br />
                {siteSettings.address.city} {siteSettings.address.postalCode}
              </address>
              {/* TODO(client): the plot number is not confirmed and the current map pin is wrong. */}
              <p className="mt-4 type-small text-grey">
                The campus is on 80 Feet Road in RMV 2nd Stage, near Ramaiah Hospital.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <ButtonLink href={siteSettings.address.mapsUrl} variant="secondary" size="sm" external>
                  Open in Google Maps
                </ButtonLink>
                <ButtonLink href="/contact" variant="tertiary" size="inline">
                  Phone numbers and directions
                </ButtonLink>
              </div>

              <h3 className="mt-10 type-label text-grey">Equipment</h3>
              {/* TODO(client): no machine, grinder or roaster models are published anywhere. */}
              <p className="mt-3 flex flex-wrap items-center gap-3 type-body text-black">
                <TbcPill />
                <span>The academy is confirming the machine and grinder list.</span>
              </p>
            </div>

            <div className="md:col-span-7">
              <Placeholder slot="contact-campus" aspect="photo" />
            </div>
          </div>
        </Container>
      </section>

      <section className="section-y-sm" aria-labelledby="gallery-heading">
        <Container>
          <SectionHeading
            number="03"
            eyebrow="Gallery"
            title="Inside the academy"
            id="gallery-heading"
            description="Photographs from the campus. The shoot is done and the files are on their way; until they land, these are labelled placeholders rather than stock images."
          />
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galleryslots.map((slot) => (
              <li key={slot}>
                <Placeholder slot={slot} aspect="photo" />
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
            action={
              <ButtonLink href="/trainers" variant="tertiary" size="inline">
                Read the trainer profiles
              </ButtonLink>
            }
          />
          <TrainerGrid trainers={trainers} className="mt-10 md:mt-14" />
        </Container>
      </section>

      {/* The honesty paragraph, required by .claude/rules/content.md wherever certificates come up. */}
      <section className="section-y-sm" aria-labelledby="honesty-heading">
        <Container>
          <div className="grid gap-10 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-4">
              <SectionHeading
                number="05"
                eyebrow="Straight answer"
                title="About the certificates"
                id="honesty-heading"
              />
            </div>
            <div className="md:col-span-8">
              <p className="measure type-h3 text-black">
                A certificate helps you get an interview. Your skills get you the job.
              </p>
              <p className="mt-5 measure type-body text-grey">
                The Italian Barista Certificate is issued in Italy by Espresso Academy, Florence,
                and sent to its authorised partner schools. Our other courses are training aligned
                to the SCA Coffee Skills Program; whether a given batch is assessed for SCA
                certification, and what the SCA charges for that, is confirmed at enrolment.
              </p>
              <p className="mt-4 measure type-body text-grey">
                We do not claim to be the first, the only or the best coffee school in India, and
                we do not publish a placement rate. What we will do is tell you honestly whether a
                course is the right one for you, including when the answer is no.{" "}
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
            You are welcome to visit the campus before you book anything. Message the academy and
            someone will tell you when a class is running so you can see one in progress.
          </p>
        }
      />

      <JsonLd
        id="about-jsonld"
        data={graph([
          webPageNode("/about", "A Florence coffee school, teaching in Bengaluru", DESCRIPTION),
        ])}
      />
    </>
  );
}
