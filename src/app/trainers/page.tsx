import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { TbcPill } from "@/components/site/TbcPill";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { SanityPhoto } from "@/components/site/SanityPhoto";
import { PageHero } from "@/components/sections/Hero";
import { TrainerGrid } from "@/components/sections/TrainerGrid";
import { FinalCta } from "@/components/sections/FinalCta";
import { getTrainers } from "@/lib/content";
import { absoluteUrl } from "@/lib/env";
import { pageMetadata } from "@/lib/seo/metadata";
import { graph, webPageNode } from "@/lib/seo/schema";

const DESCRIPTION =
  "Who teaches at the Bengaluru campus: a Q Grader and SCA certified Sensory Professional with a Coffee Board of India diploma in coffee quality management.";

/**
 * Counted, not written in. "Coffee Trainers in Bengaluru" was true until the client confirmed
 * there is one, and a hand-written plural is the kind of thing that stays wrong for months. The
 * day a second trainer is published this reverts on its own.
 */
export async function generateMetadata(): Promise<Metadata> {
  const trainers = await getTrainers();
  return pageMetadata({
    title: trainers.length === 1 ? "Coffee Trainer in Bengaluru" : "Coffee Trainers in Bengaluru",
    description: DESCRIPTION,
    path: "/trainers",
  });
}

/**
 * Who teaches here.
 *
 * A single profile, not a grid of one. On 8 September 2026 the client confirmed that the three
 * trainers this page had been listing are not part of the academy's team; they had been carried
 * from the old website and the Florence authorised-trainer list, neither of which is the academy
 * telling anyone who works there. Their URLs 301 here.
 *
 * The faculty description is the client's own and describes the teaching rather than a roster, so
 * it survives the roster changing. The deep profile stays at /trainers/[slug], where the Person
 * and hasCredential JSON-LD lives; this page is the answer to "who teaches here", which is a
 * different question from "tell me about this person".
 *
 * It renders from `getTrainers()` rather than from a hard-coded name, so a second trainer appears
 * here by publishing a document and nothing else.
 */
export default async function TrainersPage() {
  const trainers = await getTrainers();
  const only = trainers.length === 1 ? trainers[0] : undefined;

  return (
    <>
      <PageHero
        above={<Breadcrumbs items={[{ label: "Trainers", href: "/trainers" }]} />}
        eyebrow="Faculty"
        title="Who teaches at the Bengaluru campus"
        intro={
          <>
            {/* The client's own words, and a description of the teaching rather than a headcount,
                which is why it did not have to change when the roster did. */}
            <p>
              Certified Q graders and processors, authorised trainers, and experienced hands-on
              professionals. International instructors visit the academy regularly.
            </p>
            <p className="mt-4">
              {/* No claim about per-batch assignment: content/facts.md does not say how the
                  academy allocates trainers, and with one trainer there is nothing to allocate. */}
              {only
                ? `${only.name} is the only trainer, and takes the courses at the Bengaluru campus.`
                : `${trainers.length} trainers take the courses at the Bengaluru campus. Which trainer takes a given batch is not published, so ask when you enquire.`}
            </p>
          </>
        }
        actions={
          <ButtonLink href="/courses" variant="secondary">
            See the courses
          </ButtonLink>
        }
      />

      <section className="section-y-sm" aria-labelledby="trainers-heading">
        <Container>
          <SectionHeading
            number="01"
            eyebrow={only ? "The trainer" : "Trainers"}
            title="The person on the bar with you"
            id="trainers-heading"
          />

          {only ? (
            /*
             * A 4/8 split rather than a card. A card is a way of comparing several things, and
             * there is one thing. The photo holds the left, the credentials and the bio hold the
             * right, and the deep profile is one link away.
             */
            <div className="mt-10 grid gap-10 md:mt-14 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-4">
                <SanityPhoto
                  image={only.image}
                  slot={`trainer-${only.slug}`}
                  fallbackAlt={`${only.name}, trainer at Espresso Academy India`}
                  aspect="portrait"
                  priority
                  sizes="(min-width: 1024px) 380px, 90vw"
                />
              </div>

              <div className="lg:col-span-8">
                <h3 className="type-h2 text-black">{only.name}</h3>
                <p className="mt-2 type-label text-grey">
                  {/* TODO(client): trainer.role. Still open in content/facts.md. */}
                  {only.role ?? <TbcPill label="Role TBC" />}
                </p>

                <p className="mt-6 measure type-body text-grey">{only.bio}</p>

                <ul className="mt-8 flex flex-col gap-3 hairline pt-6">
                  {only.credentials.map((credential) => (
                    <li key={credential.name} className="flex gap-3 type-body text-black">
                      <span className="mt-3 h-px w-3 shrink-0 bg-red" aria-hidden="true" />
                      <span>
                        {credential.name}
                        {credential.issuer ? (
                          <span className="block type-small text-grey">{credential.issuer}</span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="mt-8">
                  <Link
                    href={`/trainers/${only.slug}`}
                    className="inline-flex min-h-11 items-center type-body text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                  >
                    Read {only.name}&rsquo;s full profile
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            <TrainerGrid trainers={trainers} className="mt-10 md:mt-14" />
          )}
        </Container>
      </section>

      <FinalCta
        number="02"
        title="Ask about the next batch"
        body={
          <p>
            Batch dates are on each course page, with seats capped at 8 on the IBC Basic and 4 on
            each Advanced course. Send your background in one message and ask which one to book.
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
        ])}
      />
    </>
  );
}
