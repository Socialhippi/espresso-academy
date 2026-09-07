import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { SanityPhoto } from "@/components/site/SanityPhoto";
import { PageHero } from "@/components/sections/Hero";
import { FinalCta } from "@/components/sections/FinalCta";
import { getGuides } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { pageMetadata } from "@/lib/seo/metadata";
import { graph, webPageNode } from "@/lib/seo/schema";

const DESCRIPTION =
  "Straight answers about learning coffee in Bengaluru: what the certificates mean, which course to start with, and what a barista course actually covers.";

export const metadata: Metadata = pageMetadata({
  title: "Coffee Guides and Answers",
  description: DESCRIPTION,
  path: "/guides",
});

/**
 * The guides hub.
 *
 * These pages exist to be quoted: by a search result, by an assistant, by somebody deciding
 * whether to spend ₹25,000 on a course. That is why each one names its author and its reviewer
 * with a date, and why the body is question-shaped with the answer first. An article nobody signed
 * is a claim, not an answer.
 */
export default async function GuidesPage() {
  const guides = await getGuides();

  return (
    <>
      <PageHero
        above={<Breadcrumbs items={[{ label: "Guides", href: "/guides" }]} />}
        eyebrow="Guides"
        title="Straight answers about learning coffee"
        intro={
          <p>
            Written by the people who teach the courses, and checked by another one of them before
            it goes up. Where the academy does not know something, these say so.
          </p>
        }
        actions={
          <ButtonLink href="/courses" variant="secondary">
            See the courses
          </ButtonLink>
        }
      />

      <section className="section-y-sm" aria-labelledby="guides-heading">
        <Container>
          <SectionHeading number="01" eyebrow="Reading" title="Every guide" id="guides-heading" />

          {guides.length === 0 ? (
            /* TODO(client): no guide has been published yet. The empty state offers the two
               things a reader came here for rather than an apology. */
            <div className="mt-8 border border-white-2 bg-white-3 p-6 md:p-10">
              <h3 className="type-h3 text-black">The guides are being written</h3>
              <p className="mt-4 measure type-body text-grey">
                Until they are up, the fastest way to get an answer is to ask. The academy
                replies, and if the answer is useful to other people it usually becomes one of
                these.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <ButtonLink href="/faq" variant="primary">
                  Read the questions we get asked
                </ButtonLink>
                <ButtonLink href="/enquire" variant="secondary">
                  Ask something else
                </ButtonLink>
              </div>
            </div>
          ) : (
            <ul className="mt-10 grid gap-10 md:grid-cols-2 lg:gap-12">
              {guides.map((guide, index) => (
                <li key={guide.slug}>
                  <article className="group h-full">
                    <Link href={`/guides/${guide.slug}`} className="flex h-full flex-col">
                      <SanityPhoto
                        image={guide.heroImage}
                        slot={`guide-${guide.slug}`}
                        fallbackAlt={guide.title}
                        aspect="photo"
                        priority={index === 0}
                        sizes="(min-width: 768px) 45vw, 90vw"
                      />
                      <h3 className="mt-5 type-h3 text-black group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                        {guide.title}
                      </h3>
                      <p className="mt-3 measure type-body text-grey">{guide.excerpt}</p>
                      <p className="mt-auto pt-5 flex items-center gap-2 type-label text-red">
                        Read it
                        <ArrowRight
                          className="size-4 transition-transform duration-200 group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </p>
                      <p className="mt-3 type-small text-grey">
                        {guide.author ? `By ${guide.author.name}` : "By the academy"}
                        {guide.publishedAt ? ` · ${formatDate(guide.publishedAt)}` : ""}
                      </p>
                    </Link>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>

      <FinalCta
        number="02"
        title="Ask the question that is not answered here"
        body={
          <p>
            If it is a good question, the answer usually ends up on this page. Either way you get a
            reply from someone who teaches.
          </p>
        }
      />

      <JsonLd
        id="guides-jsonld"
        data={graph([webPageNode("/guides", "Straight answers about learning coffee", DESCRIPTION)])}
      />
    </>
  );
}
