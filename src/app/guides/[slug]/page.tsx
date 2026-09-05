import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/Container";
import { ButtonLink } from "@/components/site/Button";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { SanityPhoto } from "@/components/site/SanityPhoto";
import { FinalCta } from "@/components/sections/FinalCta";
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

  return pageMetadata({
    title: guide.seo?.title || guide.title,
    description: clampDescription(guide.seo?.description || guide.excerpt),
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
              <p className="mt-5 measure type-body text-black">{guide.excerpt}</p>

              <dl className="mt-8 hairline flex flex-wrap gap-x-10 gap-y-4 pt-6 type-small">
                {guide.author && (
                  <div>
                    <dt className="type-label text-grey">Written by</dt>
                    <dd className="mt-1 text-black">
                      <Link
                        href={`/trainers/${guide.author.slug}`}
                        className="inline-flex min-h-11 items-center text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                      >
                        {guide.author.name}
                      </Link>
                      {guide.author.role ? `, ${guide.author.role}` : ""}
                    </dd>
                  </div>
                )}
                {guide.reviewedBy && (
                  <div>
                    <dt className="type-label text-grey">Checked by</dt>
                    <dd className="mt-1 text-black">
                      <Link
                        href={`/trainers/${guide.reviewedBy.slug}`}
                        className="inline-flex min-h-11 items-center text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                      >
                        {guide.reviewedBy.name}
                      </Link>
                    </dd>
                  </div>
                )}
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
                  <h2 className="type-label text-grey">What this is about</h2>
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
              <PortableText value={guide.body} />

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
          {
            "@type": "Article",
            "@id": absoluteUrl(`/guides/${guide.slug}#article`),
            headline: guide.title,
            description: guide.excerpt,
            url: absoluteUrl(`/guides/${guide.slug}`),
            /* A named author and a named reviewer, or neither. An Article attributed to an
               organisation says nothing a reader could not already see. */
            ...(guide.author
              ? {
                  author: {
                    "@type": "Person",
                    name: guide.author.name,
                    url: absoluteUrl(`/trainers/${guide.author.slug}`),
                  },
                }
              : {}),
            ...(guide.reviewedBy
              ? {
                  reviewedBy: {
                    "@type": "Person",
                    name: guide.reviewedBy.name,
                    url: absoluteUrl(`/trainers/${guide.reviewedBy.slug}`),
                  },
                }
              : {}),
            ...(published ? { datePublished: published } : {}),
            ...(updated ? { dateModified: updated } : {}),
            publisher: { "@id": schemaIds.ORGANISATION_ID },
            inLanguage: "en-IN",
            isPartOf: { "@id": schemaIds.WEBSITE_ID },
          },
          ...(faqs.length > 0 ? [faqNode(faqs, `/guides/${guide.slug}`)] : []),
        ])}
      />
    </>
  );
}
