import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { PageHero } from "@/components/sections/Hero";
import { TrainerGrid } from "@/components/sections/TrainerGrid";
import { FinalCta } from "@/components/sections/FinalCta";
import { getTrainers } from "@/lib/content";
import { absoluteUrl } from "@/lib/env";
import { pageMetadata } from "@/lib/seo/metadata";
import { graph, trainerNode, webPageNode } from "@/lib/seo/schema";

const DESCRIPTION =
  "The trainers at the Bengaluru campus, with credentials from the Coffee Board of India, the Coffee Quality Institute and the Specialty Coffee Association.";

export const metadata: Metadata = pageMetadata({
  title: "Coffee Trainers in Bengaluru",
  description: DESCRIPTION,
  path: "/trainers",
});

export default function TrainersPage() {
  const trainers = getTrainers();

  return (
    <>
      <PageHero
        above={<Breadcrumbs items={[{ label: "Trainers", href: "/trainers" }]} />}
        eyebrow="Faculty"
        title="Who teaches at the Bengaluru campus"
        intro={
          <p>
            Three trainers, all on the Espresso Academy authorised trainer list. Between them they
            hold Coffee Board of India diplomas, Q Grader and Q Processing credentials from the
            Coffee Quality Institute, SCA module certifications and FSSAI food safety
            certification. Which trainer takes a given batch is set by the academy nearer the date.
          </p>
        }
        actions={
          <ButtonLink href="/courses" variant="secondary">
            See what they teach
          </ButtonLink>
        }
      />

      <section className="section-y-sm" aria-labelledby="trainers-heading">
        <Container>
          <SectionHeading
            number="01"
            eyebrow="Trainers"
            title="The people on the bar with you"
            id="trainers-heading"
          />
          <TrainerGrid trainers={trainers} className="mt-10 md:mt-14" />
        </Container>
      </section>

      <FinalCta
        number="02"
        title="Ask who is teaching your batch"
        body={
          <p>
            Trainers are assigned per batch. If you want to learn from someone in particular, say
            so when you enquire and the academy will tell you which dates they are on.
          </p>
        }
      />

      <JsonLd
        id="trainers-jsonld"
        data={graph([
          webPageNode("/trainers", "Who teaches at the Bengaluru campus", DESCRIPTION),
          {
            "@type": "ItemList",
            "@id": absoluteUrl("/trainers#list"),
            itemListElement: trainers.map((trainer, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: absoluteUrl(`/trainers/${trainer.slug}`),
              name: trainer.name,
            })),
          },
          ...trainers.map(trainerNode),
        ])}
      />
    </>
  );
}
