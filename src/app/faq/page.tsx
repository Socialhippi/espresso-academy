import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { PageHero } from "@/components/sections/Hero";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { FinalCta } from "@/components/sections/FinalCta";
import { faqCategoryLabel, getFaqCategories, getFaqs } from "@/lib/content";
import { pageMetadata } from "@/lib/seo/metadata";
import { faqNode, graph, webPageNode } from "@/lib/seo/schema";

const DESCRIPTION =
  "Straight answers about courses, fees, certificates, batch dates, the Bengaluru campus and what a coffee certificate is actually worth to an employer.";

export const metadata: Metadata = pageMetadata({
  title: "Coffee Course Questions and Answers",
  description: DESCRIPTION,
  path: "/faq",
});

export default async function FaqPage() {
  const categories = await getFaqCategories();
  const allFaqs = await getFaqs();

  return (
    <>
      <PageHero
        above={<Breadcrumbs items={[{ label: "FAQ", href: "/faq" }]} />}
        eyebrow="Questions"
        title="What people ask before they enrol"
        intro={
          <p>
            Grouped by what you are actually trying to find out. If your question is not here, send
            it on WhatsApp: an unanswered question is a gap on this page, and we would rather fix
            it than leave you guessing.
          </p>
        }
      />

      <section className="section-y-sm" aria-labelledby="faq-heading">
        <Container>
          <h2 id="faq-heading" className="sr-only">
            Questions grouped by topic
          </h2>
          <div className="grid gap-[var(--gutter-grid)] lg:grid-cols-12">
            <nav aria-label="Question topics" className="lg:col-span-3">
              <div className="md:sticky md:top-28">
                <p className="type-label text-grey">Topics</p>
                <ul className="mt-4 flex flex-col">
                  {categories.map((category) => (
                    <li key={category}>
                      <Link
                        href={`#${category}`}
                        className="inline-flex min-h-11 min-w-11 items-center type-body text-black underline decoration-white-2 underline-offset-4 hover:text-red hover:decoration-red"
                      >
                        {faqCategoryLabel[category]}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>

            <div className="lg:col-span-9">
              {categories.map((category, index) => {
                /* Already fetched above: filtering the list in place keeps this a plain map
                   rather than a fan-out of one request per category. */
                const items = allFaqs.filter((faq) => faq.category === category);
                return (
                  <div key={category} className={index > 0 ? "mt-14" : undefined}>
                    <SectionHeading
                      number={String(index + 1).padStart(2, "0")}
                      eyebrow={faqCategoryLabel[category]}
                      title={faqCategoryLabel[category]}
                      as="h3"
                      id={category}
                    />
                    <FaqAccordion items={items} className="mt-6" />
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      <FinalCta
        number="07"
        title="Ask the one we have not answered"
        body={
          <p>
            Send it on WhatsApp and you will get a straight reply, not a brochure. If it is a good
            question, it ends up on this page for the next person.
          </p>
        }
      />

      <JsonLd
        id="faq-jsonld"
        data={graph([
          webPageNode("/faq", "What people ask before they enrol", DESCRIPTION),
          faqNode(allFaqs, "/faq"),
        ])}
      />
    </>
  );
}
