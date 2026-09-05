import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { SanityPhoto } from "@/components/site/SanityPhoto";
import { PageHero } from "@/components/sections/Hero";
import { FinalCta } from "@/components/sections/FinalCta";
import { getStories } from "@/lib/content";
import { pageMetadata } from "@/lib/seo/metadata";
import { graph, webPageNode } from "@/lib/seo/schema";

const DESCRIPTION =
  "What people did after training at Espresso Academy India in Bengaluru, in their own words, published only with their written permission.";

export const metadata: Metadata = pageMetadata({
  title: "Student Stories",
  description: DESCRIPTION,
  path: "/student-stories",
});

/**
 * Student stories.
 *
 * The query filters on `permission == true`, so a story without written permission is invisible to
 * this page no matter what else is filled in. `content/facts.md` forbids publishing a testimonial
 * without it, and the safest place to enforce that is the query rather than a checkbox somebody
 * has to remember to read.
 *
 * The page exists while the list is empty on purpose. An empty state that says "not yet" is
 * honest; a page that appears the week the first quote arrives looks like the academy had nothing
 * to say until then.
 */
export default async function StudentStoriesPage() {
  const stories = await getStories();

  return (
    <>
      <PageHero
        above={<Breadcrumbs items={[{ label: "Student stories", href: "/student-stories" }]} />}
        eyebrow="Student stories"
        title="What people did next"
        intro={
          <p>
            Every story here is published with the person&apos;s written permission and in their own
            words. Nothing is composited, reworded into marketing copy or attributed to a stock
            photograph.
          </p>
        }
        actions={
          <ButtonLink href="/courses" variant="secondary">
            See the courses
          </ButtonLink>
        }
      />

      <section className="section-y-sm" aria-labelledby="stories-heading">
        <Container>
          <SectionHeading
            number="01"
            eyebrow="In their words"
            title={stories.length > 0 ? "Stories" : "None to show yet"}
            id="stories-heading"
          />

          {stories.length === 0 ? (
            /* TODO(client): `stories` is empty and stays empty until real, permitted stories
               arrive. content/facts.md forbids inventing one, and a fabricated testimonial is the
               single most damaging thing this site could publish. */
            <div className="mt-8 border border-white-2 bg-white-3 p-6 md:p-10">
              <h3 className="type-h3 text-black">No stories are published yet</h3>
              <p className="mt-4 measure type-body text-grey">
                The academy has taught in Bengaluru since 2023, so there are plenty of people who
                could tell you how it went. None of them have given written permission to publish
                their words yet, and until they do this page stays empty rather than filling up
                with quotes nobody said.
              </p>
              <p className="mt-4 measure type-body text-grey">
                If you would rather hear it from a student than from the academy, ask. They will put
                you in touch with someone who has done the course you are looking at.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
                <WhatsAppButton event="whatsapp_click_stories">
                  Ask to speak to a student
                </WhatsAppButton>
                <ButtonLink href="/trainers" variant="secondary">
                  Meet the trainers instead
                </ButtonLink>
              </div>
            </div>
          ) : (
            <ul className="mt-10 grid gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
              {stories.map((story, index) => (
                <li key={story.id}>
                  <figure className="flex h-full flex-col">
                    <SanityPhoto
                      image={story.image}
                      slot={`story-${story.id}`}
                      fallbackAlt={`${story.name}, a student at Espresso Academy India`}
                      aspect="portrait"
                      priority={index === 0}
                      sizes="(min-width: 1024px) 360px, (min-width: 768px) 45vw, 90vw"
                    />
                    <blockquote className="mt-5 measure type-body text-black">
                      {story.quote}
                    </blockquote>
                    <figcaption className="mt-auto pt-4 type-small text-grey">
                      <span className="block font-medium text-black">{story.name}</span>
                      {story.course && <span className="block">{story.course}</span>}
                      {story.outcome && <span className="block">{story.outcome}</span>}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </section>

      <FinalCta
        number="02"
        title="Add yours"
        body={
          <p>
            If you trained here and would be happy to say so, tell the academy. Nothing goes on this
            page without your written permission, and you can withdraw it at any time.
          </p>
        }
      />

      <JsonLd
        id="stories-jsonld"
        data={graph([webPageNode("/student-stories", "What people did next", DESCRIPTION)])}
      />
    </>
  );
}
