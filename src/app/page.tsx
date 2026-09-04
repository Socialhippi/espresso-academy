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
  "Barista, latte art, brewing and roasting courses in Bengaluru. Take the Italian Barista Certificate, or training aligned to the SCA Coffee Skills Program.";

export const metadata: Metadata = pageMetadata({
  title: "Barista Training in Bengaluru",
  description: DESCRIPTION,
  path: "/",
});

export default function HomePage() {
  const trainers = getTrainers();
  const faqs = getFaqs().slice(0, 4);

  return (
    <>
      <HomeHero
        eyebrow="Bengaluru"
        titleLead="Professional coffee training in Bengaluru,"
        titleAccent="certified from Florence"
        subline={
          <p>
            Learn at the RMV 2nd Stage campus. Take the{" "}
            <Link
              href="/certifications/italian-barista-certificate"
              className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
            >
              Italian Barista Certificate
            </Link>
            , issued in Italy by Espresso Academy, Florence, or train on a program{" "}
            <Link
              href="/certifications/sca-coffee-skills-program"
              className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
            >
              aligned to the SCA Coffee Skills Program
            </Link>
            .
          </p>
        }
        actions={
          <>
            <ButtonLink href="/courses" variant="primary" data-event="courses_click_hero">
              See courses and dates
            </ButtonLink>
            <WhatsAppButton event="whatsapp_click_hero" />
          </>
        }
      />

      <ProofStrip />

      <AudienceDoors number="01" />

      <NextBatches number="02" compact />

      {/* Asymmetric: the explanation holds the left, the ladder the right. */}
      <section className="section-y" aria-labelledby="ladder-heading">
        <Container>
          <div className="grid gap-10 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-4">
              <SectionHeading
                number="03"
                eyebrow="Levels"
                title="Where you start, where you finish"
                id="ladder-heading"
                description="Two ladders run side by side. The Italian Barista Certificate runs at Junior and Advanced. The SCA-aligned training runs at Foundation, Intermediate and Professional. Which rung you start on is set with you, not by a rule."
              />
              <p className="mt-6">
                <ButtonLink href="/certifications" variant="tertiary" size="inline">
                  Compare the two certificates
                </ButtonLink>
              </p>
            </div>
            <div className="md:col-span-8">
              <LevelLadder />
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
            description="Trainers on the Espresso Academy authorised list, with credentials from the Coffee Board of India, the Coffee Quality Institute and the SCA."
            action={
              <ButtonLink href="/trainers" variant="tertiary" size="inline">
                Read the trainer profiles
              </ButtonLink>
            }
          />
          <TrainerGrid trainers={trainers} className="mt-10 md:mt-14" />
        </Container>
      </section>

      <StoryGrid number="05" />

      <section className="section-y-sm bg-white-3" aria-labelledby="faq-heading">
        <Container>
          <div className="grid gap-10 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-4">
              <SectionHeading
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
            <div className="md:col-span-8">
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
            Send one message with your background and what you want to be able to do. Fees and
            batch dates are not published yet, so ask for the current figures before you commit to
            anything.
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
