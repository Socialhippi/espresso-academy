import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { PageHero } from "@/components/sections/Hero";
import { PageSections, faqEntriesFromSections } from "@/components/sections/PageSections";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { getCourses, getPage, getSiteSettings } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { clampDescription, pageMetadata } from "@/lib/seo/metadata";
import { faqNode, graph, webPageNode } from "@/lib/seo/schema";

const SLUG = "for-cafes";

const FALLBACK_TITLE = "Training for cafes and teams";
const FALLBACK_DESCRIPTION =
  "Barista training for cafe teams in Bengaluru: a session built around your bar, your machine and your menu. Tell the academy what your team needs and they will scope it.";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage(SLUG);
  return pageMetadata({
    title: page?.seo?.title || "Barista Training for Cafes and Teams",
    description: clampDescription(page?.seo?.description || page?.intro || FALLBACK_DESCRIPTION),
    path: "/for-cafes",
  });
}

/**
 * The cafe and team page.
 *
 * Assembled from a `page` document, so the academy can rewrite the pitch without a developer. What
 * it must never do is fail because nobody has created that document yet: a hand-written fallback
 * carries the same shape, and the moment the document exists it takes over.
 *
 * Everything here is TBC-safe by construction. There is no package, no day rate and no team size,
 * because `content/facts.md` records none of those and inventing a price for a cafe owner is the
 * same error as inventing one for a student.
 */
export default async function ForCafesPage() {
  const [page, courses, settings] = await Promise.all([
    getPage(SLUG),
    getCourses(),
    getSiteSettings(),
  ]);

  const courseOptions = courses.map((course) => ({
    slug: course.slug,
    title: course.title,
    batches: course.instances
      .filter((instance) => instance.startDate !== null)
      .map((instance) => formatDate(instance.startDate)),
  }));

  const title = page?.title ?? FALLBACK_TITLE;
  const intro = page?.intro ?? FALLBACK_DESCRIPTION;
  const faqs = page ? faqEntriesFromSections(page.sections) : [];

  return (
    <>
      <PageHero
        above={<Breadcrumbs items={[{ label: "For cafes", href: "/for-cafes" }]} />}
        eyebrow="For cafes and teams"
        title={title}
        intro={<p>{intro}</p>}
        actions={
          <>
            <ButtonLink href="#enquire" variant="primary" data-event="cta_click_forcafes">
              Ask for a proposal
            </ButtonLink>
            <WhatsAppButton event="whatsapp_click_forcafes">Ask on WhatsApp</WhatsAppButton>
          </>
        }
      />

      {page ? (
        <PageSections
          sections={page.sections}
          courses={courseOptions}
          replyPromise={settings.replyPromise}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        />
      ) : (
        <FallbackSections
          courseOptions={courseOptions}
          replyPromise={settings.replyPromise}
        />
      )}

      <JsonLd
        id="for-cafes-jsonld"
        data={graph([
          webPageNode("/for-cafes", title, clampDescription(intro)),
          ...(faqs.length > 0 ? [faqNode(faqs, "/for-cafes")] : []),
        ])}
      />
    </>
  );
}

/**
 * What the page renders until the academy writes the `page` document.
 *
 * Not a placeholder banner: this is real, publishable copy that states nothing `facts.md` does not
 * support. It says what the academy will do and asks what you need, which is the honest version of
 * a page whose commercial terms are still being decided.
 */
function FallbackSections({
  courseOptions,
  replyPromise,
}: {
  courseOptions: { slug: string; title: string; batches: string[] }[];
  replyPromise: string | null;
}) {
  return (
    <>
      <section className="section-y-sm" aria-labelledby="how-heading">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <SectionHeading
                number="01"
                eyebrow="How it works"
                title="Built around your bar"
                id="how-heading"
              />
            </div>
            <div className="lg:col-span-7">
              <p className="measure type-body text-grey">
                A team session is not a public course with your staff in it. The academy asks what
                machine you run, what is on your menu and what keeps going wrong, then builds the
                session around that. It can run at the RMV 2nd Stage campus or at your cafe.
              </p>
              <ul className="mt-8 flex flex-col gap-4">
                {[
                  "Tell the academy your team size, your machine and what you want fixed.",
                  "They come back with a scope, a length and a fee incl. GST, in writing.",
                  "The session runs, and everyone who attends knows what to practise next.",
                ].map((step, index) => (
                  <li key={step} className="flex gap-4">
                    <span className="type-numeral text-h3-lg text-red" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="measure type-body text-black">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <section className="section-y-sm bg-white-3" aria-labelledby="ask-heading">
        <Container>
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <SectionHeading
                number="02"
                eyebrow="What to send"
                title="What the academy needs to quote"
                id="ask-heading"
              />
              {/* TODO(client): no package, day rate or team-size band is published, and
                  content/facts.md records none, so the page asks rather than states. */}
              <p className="mt-5 measure type-body text-grey">
                There is no fixed package and no published day rate. Every cafe is running
                different equipment with a different team, so the academy quotes each one.
              </p>
            </div>
            <div className="lg:col-span-7">
              <ul className="flex flex-col gap-3">
                {[
                  "How many people, and what they do now",
                  "Your espresso machine and grinder",
                  "What is on the menu, and what you want to add",
                  "Where you would like it to run, and roughly when",
                ].map((item) => (
                  <li key={item} className="flex gap-3 type-body text-black">
                    <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 bg-red" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <section className="section-y-sm" id="enquire" aria-labelledby="enquire-heading">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <SectionHeading
                number="03"
                eyebrow="Enquire"
                title="Ask for a proposal"
                id="enquire-heading"
              />
              <p className="mt-5 measure type-body text-grey">
                Two fields and whatever detail you want to add. A trainer reads it, not a call
                centre, and replies with a scope and a fee.
              </p>
            </div>
            <div className="lg:col-span-7">
              <EnquiryForm
                variant="cafe"
                courses={courseOptions}
                replyPromise={replyPromise}
                turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
