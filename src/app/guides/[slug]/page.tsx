import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/Container";
import { ButtonLink } from "@/components/site/Button";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { SanityPhoto } from "@/components/site/SanityPhoto";
import { FinalCta } from "@/components/sections/FinalCta";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { PortableText, faqEntriesFromBody } from "@/components/content/PortableText";
import { GuideReadTracker } from "@/components/content/GuideReadTracker";
import { getGuide, getGuideSlugs } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { absoluteUrl } from "@/lib/env";
import { clampDescription, pageMetadata } from "@/lib/seo/metadata";
import { faqNode, graph, schemaIds } from "@/lib/seo/schema";

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return (await getGuideSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) return { title: "Guide not found" };

  /*
   * A guide whose body is still authoring scaffolding is a title, a date and an apology. Letting a
   * crawler index that is asking to be judged on a thin page, and the Article node below would be
   * asserting an article that is not there. Both come back the moment a body does.
   */
  const hasBody = (guide.body?.length ?? 0) > 0;

  return pageMetadata({
    noindex: !hasBody,
    title: guide.seo?.title || guide.title,
    /* The guide's own answer if it has one, then its SEO field, then the title as a sentence.
       Never "": a stripped placeholder excerpt was shipping an empty meta description. */
    description: clampDescription(
      guide.seo?.description ||
        guide.excerpt ||
        `${guide.title} A straight answer from Espresso Academy India, the coffee school at the RMV 2nd Stage campus in Bengaluru.`,
    ),
    path: `/guides/${guide.slug}`,
    type: "article",
  });
}

/**
 * One guide.
 *
 * The structure is the point, not the decoration. `Article` structured data with a named author, a
 * named reviewer and both dates is what lets a search result or an assistant treat this as an
 * answer rather than as marketing, and the FAQ blocks inside the body become `FAQPage` on the same
 * page. Both are asserted by the test suite rather than checked by eye.
 *
 * The heading rule: the title is the H1, and the body's own styles start at H2. An editor cannot
 * pick H1 in the Studio, because a second one would break the heading order every route is tested
 * for.
 */
export default async function GuidePage({ params }: PageProps<"/guides/[slug]">) {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) notFound();

  const faqs = faqEntriesFromBody(guide.body);
  const published = guide.publishedAt;
  /** Same test `generateMetadata` uses to withhold indexing: no article, no Article node. */
  const hasBodyForSchema = (guide.body?.length ?? 0) > 0;
  const updated = guide.updatedAt;

  return (
    <>
      <article>
        <Container className="py-10 md:py-16">
          <Breadcrumbs
            items={[
              { label: "Guides", href: "/guides" },
              { label: guide.title, href: `/guides/${guide.slug}` },
            ]}
          />

          <div className="mt-6 grid gap-10 lg:grid-cols-12 lg:gap-12 md:mt-8">
            <div className="lg:col-span-8">
              <p className="eyebrow">Guide</p>
              <h1 className="mt-3 type-h1 text-black">{guide.title}</h1>

              {/* Answer-first: the excerpt is the answer, printed before anything else, so a
                  reader who stops here still has one. */}
              {/* An unwritten answer is nothing, not an empty paragraph: `stripPlaceholder` turns
                  the seeded brief into "", which rendered a 20px gap under the H1. */}
              {guide.excerpt && (
                <p className="mt-5 measure type-body text-black">{guide.excerpt}</p>
              )}

              <dl className="mt-8 hairline flex flex-wrap gap-x-10 gap-y-4 pt-6 type-small">
                {/*
                  TODO(client): no author and no reviewer until content/facts.md records a signed
                  article. The seeded guides carry both fields and every paragraph in them is
                  marked PLACEHOLDER, so "Written by Akanksha Gupta" attributed a brief to a real
                  person, and "Checked by" claimed an internal review that has not happened. The
                  markup and the Article schema below are ready for the day one is signed off.
                */}
                {published && (
                  <div>
                    <dt className="type-label text-grey">Published</dt>
                    <dd className="mt-1 text-black">
                      <time dateTime={published}>{formatDate(published)}</time>
                    </dd>
                  </div>
                )}
                {updated && updated !== published && (
                  <div>
                    <dt className="type-label text-grey">Updated</dt>
                    <dd className="mt-1 text-black">
                      <time dateTime={updated}>{formatDate(updated)}</time>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="lg:col-span-4">
              <SanityPhoto
                image={guide.heroImage}
                slot={`guide-${guide.slug}`}
                fallbackAlt={guide.title}
                aspect="photo"
                priority
                sizes="(min-width: 1024px) 360px, 100vw"
              />

              {(guide.primaryCourse || guide.primaryCertification) && (
                <aside className="mt-8 border border-white-2 p-6">
                  {/* A label for a widget, not a section heading: at 12px it sat in the outline
                    beside the page's own 36px h2s. */}
                <p className="type-label text-grey">What this is about</p>
                  <ul className="mt-3 flex flex-col gap-2 type-body">
                    {guide.primaryCourse && (
                      <li>
                        <Link
                          href={`/courses/${guide.primaryCourse.slug}`}
                          className="inline-flex min-h-11 items-center text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                        >
                          {guide.primaryCourse.title}
                        </Link>
                      </li>
                    )}
                    {guide.primaryCertification && (
                      <li>
                        <Link
                          href={`/certifications/${guide.primaryCertification.slug}`}
                          className="inline-flex min-h-11 items-center text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                        >
                          {guide.primaryCertification.name}
                        </Link>
                      </li>
                    )}
                  </ul>
                </aside>
              )}
            </div>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-8">
              {guide.body && guide.body.length > 0 ? (
                <PortableText value={guide.body} />
              ) : (
                /* Every paragraph in this guide is still the brief its writer was given, and the
                   data layer drops those. Saying so is honest; printing the brief was not. */
                <div className="rounded-sm border border-white-2 bg-white-3 p-6 md:p-10">
                  <p className="type-h3 text-black">This guide is being written</p>
                  <p className="mt-4 measure type-body text-grey">
                    The question in the title is a real one and the answer is on its way. Ask it on
                    WhatsApp in the meantime and the academy will answer it directly.
                  </p>
                  {/* The sentence above promises WhatsApp; on desktop there is no sticky bar, so
                      without this the instruction has no target anywhere near it. */}
                  <WhatsAppButton
                    course={guide.title}
                    event="whatsapp_click_guide_empty"
                    className="mt-6"
                  />
                </div>
              )}

              {/* The sentinel sits after the body and before the calls to action, so reaching it
                  means the guide was read rather than that the footer was scrolled past. */}
              <GuideReadTracker guideId={guide.slug} />

              <div className="mt-12 hairline flex flex-col gap-4 pt-8 sm:flex-row sm:flex-wrap">
                <ButtonLink href="/courses" variant="primary">
                  See the courses
                </ButtonLink>
                <ButtonLink href="/guides" variant="secondary">
                  Every guide
                </ButtonLink>
              </div>
            </div>
          </div>
        </Container>
      </article>

      <FinalCta
        /* Without this it takes FinalCta's "06" default and prints "06 NEXT STEP" on a page whose
           sections do not go past one. */
        number="01"
        title="Still not sure which one is yours?"
        body={
          <p>
            Tell the academy where you are starting from. They will say which course fits and, just
            as often, which one does not.
          </p>
        }
      />

      <JsonLd
        id="guide-jsonld"
        data={graph([
          // No Article node without an article. Structured data that asserts content the page
          // does not have is the kind of mismatch a search engine is entitled to distrust.
          ...(hasBodyForSchema
            ? [{
            "@type": "Article" as const,
            "@id": absoluteUrl(`/guides/${guide.slug}#article`),
            headline: guide.title,
            ...(guide.excerpt ? { description: guide.excerpt } : {}),
            url: absoluteUrl(`/guides/${guide.slug}`),
            /* A named author and a named reviewer, or neither. An Article attributed to an
               organisation says nothing a reader could not already see. */
            /* No author or reviewedBy while the visible byline is withheld: structured data that
               claims an attribution the page does not show is the kind of mismatch a search
               engine is entitled to distrust. Both return together. */
            ...(published ? { datePublished: published } : {}),
            ...(updated ? { dateModified: updated } : {}),
            publisher: { "@id": schemaIds.ORGANISATION_ID },
            inLanguage: "en-IN",
            isPartOf: { "@id": schemaIds.WEBSITE_ID },
          }]
            : []),
          ...(faqs.length > 0 ? [faqNode(faqs, `/guides/${guide.slug}`)] : []),
        ])}
      />
    </>
  );
}
