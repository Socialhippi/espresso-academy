import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { JsonLd } from "@/components/site/JsonLd";
import { HomeHero } from "@/components/sections/Hero";
import { ProofStrip } from "@/components/sections/ProofStrip";
import { AudienceDoors } from "@/components/sections/AudienceDoors";
import { NextBatches } from "@/components/sections/NextBatches";
import { TrainerGrid } from "@/components/sections/TrainerGrid";
import { StoryGrid } from "@/components/sections/StoryGrid";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { FinalCta } from "@/components/sections/FinalCta";
import { LevelLadder } from "@/components/course/LevelLadder";
import { getFaqs, getTrainers } from "@/lib/content";
import { pageMetadata } from "@/lib/seo/metadata";
import { faqNode, graph, webPageNode } from "@/lib/seo/schema";

const DESCRIPTION =
  "The four-day Italian Barista Course in Bengaluru: roasting, brewing, espresso and latte art, one a day, ending in a certificate issued in Italy. ₹26,700 + GST.";

export const metadata: Metadata = pageMetadata({
  title: "Barista Training in Bengaluru",
  description: DESCRIPTION,
  path: "/",
});

export default async function HomePage() {
  const trainers = await getTrainers();
  const faqs = (await getFaqs()).slice(0, 4);

  return (
    <>
      <HomeHero
        eyebrow="Bengaluru"
        titleLead="Professional coffee training in Bengaluru,"
        titleAccent="certified from Florence"
        subline={
          /*
            The subline used to offer two pathways, one of which the academy does not sell.
            Revision 2 of content/facts.md says the SCA is a standards body the client's document
            describes, not a course on offer, so the hero says what the academy actually teaches:
            four days, one module a day, ending in one certificate.
          */
          <p>
            Four days at the RMV 2nd Stage campus: roasting and cupping, brewing, barista training
            and latte art, one a day. The four days lead to the{" "}
            <Link
              href="/certifications/italian-barista-certificate"
              className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
            >
              Italian Barista Certificate
            </Link>
            , issued in Italy by Espresso Academy, Florence.
          </p>
        }
        actions={
          <>
            <ButtonLink
              href="/courses/italian-barista-course-basic"
              variant="primary"
              data-event="courses_click_hero"
            >
              See the four days
            </ButtonLink>
            <WhatsAppButton event="whatsapp_click_hero" />
          </>
        }
      />

      <ProofStrip />

      <AudienceDoors number="01" />

      <NextBatches number="02" compact />

      {/*
        The one black section, per design.md, below the fold and in the middle of the page.

        It was FinalCta, which is the last section on the route and sits on the black Footer; two
        black blocks touching read as one long dark tail rather than as a section, so the page
        delivered no interruption at all. The ladder is the right one to carry it: it is the section
        that explains the whole catalogue in one glance, it is short enough not to become a wall of
        text on a dark ground, and the level badges are at their strongest on black.

        LevelLadder, SectionHeading and the button variants all already carried `onDark` support
        written for a mid-page black section that had never existed on these routes.
      */}
      {/* Asymmetric: the explanation holds the left, the ladder the right. */}
      <section className="section-y dark-wash" aria-labelledby="ladder-heading">
        <Container>
          <div className="hairline-on-dark pt-6 grid gap-[var(--gutter-grid)] lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionHeading rule={false}
                number="03"
                eyebrow="Levels"
                title="Where you start, where you go next"
                id="ladder-heading"
                onDark
                description="Three courses on one ladder. The IBC Basic is four days and assumes nothing. Above it sit two Advanced courses of two days each, one for the bar and one for the roaster. The prerequisites for both Advanced courses are being confirmed."
              />
              <p className="mt-6">
                {/* Red text is forbidden on black (design.md, 2.47:1), so the tertiary link
                    inverts to white rather than losing its underline. */}
                <ButtonLink href="/certifications" variant="tertiary-on-dark" size="inline">
                  What the certificate is worth
                </ButtonLink>
              </p>
            </div>
            <div className="lg:col-span-8">
              <LevelLadder onDark />
            </div>
          </div>
        </Container>
      </section>

      <section className="section-y-sm bg-white-3" aria-labelledby="trainers-heading">
        <Container>
          <SectionHeading
            number="04"
            eyebrow="Faculty"
            title="Who teaches you"
            id="trainers-heading"
            description="Certified Q graders and processors, authorised trainers, and experienced hands-on professionals. International instructors visit the academy regularly."
            action={
              <ButtonLink href="/trainers" variant="tertiary" size="inline">
                Who teaches at the campus
              </ButtonLink>
            }
          />
          {/* The grid sizes itself to the count. One trainer is one capped card, not one card
              floating in three columns. */}
          {/* The faculty line above is the client's own and describes the teaching, not a
              headcount. Over a single card it can be read as a roster, so the count says itself. */}
          {trainers.length === 1 && trainers[0] ? (
            <p className="mt-6 measure type-body text-grey">
              {trainers[0].name} takes the courses at the Bengaluru campus.
            </p>
          ) : null}
          <TrainerGrid trainers={trainers} className="mt-10 md:mt-14" />
        </Container>
      </section>

      <StoryGrid number="05" />

      <section className="section-y-sm bg-white-3" aria-labelledby="faq-heading">
        <Container>
          <div className="hairline pt-6 grid gap-[var(--gutter-grid)] lg:grid-cols-12">
            <div className="lg:col-span-4">
              <SectionHeading rule={false}
                number="06"
                eyebrow="Questions"
                title="What people ask first"
                id="faq-heading"
              />
              <p className="mt-6">
                <ButtonLink href="/faq" variant="tertiary" size="inline">
                  Read every question and answer
                </ButtonLink>
              </p>
            </div>
            <div className="lg:col-span-8">
              <FaqAccordion items={faqs} />
            </div>
          </div>
        </Container>
      </section>

      <FinalCta
        number="07"
        title="Tell us where you are starting from"
        body={
          <p>
            Send one message with your background and what you want to be able to do. ₹5,000
            confirms a seat. The balance is paid on day 1 at the academy, by cash, UPI or bank
            transfer, not by card. Ask anything you need to before you pay a rupee.
          </p>
        }
      />

      <JsonLd
        id="home-jsonld"
        data={graph([
          webPageNode("/", "Barista Training in Bengaluru", DESCRIPTION),
          faqNode(faqs, "/"),
        ])}
      />
    </>
  );
}
