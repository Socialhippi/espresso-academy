import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { SanityPhoto } from "@/components/site/SanityPhoto";
import { EnquiryForm, type CourseOption } from "@/components/forms/EnquiryForm";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { PortableText, type PortableTextValue } from "@/components/content/PortableText";
import type { PageSection } from "@/lib/content";
import type { SanityImage } from "@/lib/sanity/image";
import { cn } from "@/lib/utils";

/**
 * The section library, rendered.
 *
 * An editor assembles a page from these five or six shapes and nothing else. The constraint is the
 * point: every one of them already has a reviewed layout, so a page the academy builds in the
 * Studio cannot break the design rules, and a new page needs no design review of its own.
 *
 * The renderer decides the grounds and the rhythm, not the editor. `design.md` asks for exactly one
 * black section per page and for no two consecutive sections sharing a layout; both are decisions
 * about a whole page, which is why `index` is passed in rather than a `background` field being
 * offered in the Studio.
 */

interface SectionsProps {
  sections: PageSection[];
  /** Courses for any form section's picker. */
  courses: CourseOption[];
  replyPromise: string | null;
  turnstileSiteKey?: string;
  /** Section numbering continues from here, so a page hero can be "01". */
  startAt?: number;
}

function numeral(index: number): string {
  return String(index).padStart(2, "0");
}

export function PageSections({
  sections,
  courses,
  replyPromise,
  turnstileSiteKey,
  startAt = 1,
}: SectionsProps) {
  return (
    <>
      {sections.map((section, index) => {
        const number = numeral(startAt + index);
        // Alternating grounds, decided here rather than per section, so the rhythm is a property
        // of the page and two adjacent sections never share one.
        const alt = index % 2 === 1;
        const key = section._key ?? `${section._type}-${index}`;

        switch (section._type) {
          case "heroSection":
            return <HeroSection key={key} section={section} number={number} alt={alt} />;
          case "richTextSection":
            return <RichTextSection key={key} section={section} number={number} alt={alt} />;
          case "offerSection":
            return <OfferSection key={key} section={section} number={number} alt={alt} />;
          case "proofSection":
            return <ProofSection key={key} section={section} number={number} />;
          case "formSection":
            return (
              <FormSection
                key={key}
                section={section}
                number={number}
                courses={courses}
                replyPromise={replyPromise}
                turnstileSiteKey={turnstileSiteKey}
              />
            );
          case "faqSection":
            return <FaqSection key={key} section={section} number={number} alt={alt} />;
          default:
            // A section type the Studio knows and this build does not. Rendering nothing is right:
            // a half-drawn section is worse than an absent one, and the build after this deploy
            // will have it.
            return null;
        }
      })}
    </>
  );
}

function field<T>(section: PageSection, name: string): T | undefined {
  return section[name] as T | undefined;
}

function HeroSection({
  section,
  number,
  alt,
}: {
  section: PageSection;
  number: string;
  alt: boolean;
}) {
  const heading = field<string>(section, "heading") ?? "";
  const eyebrow = field<string>(section, "eyebrow");
  const body = field<string>(section, "body");
  const cta = field<{ label: string; href: string }>(section, "primaryCta");
  const image = field<SanityImage>(section, "image");

  return (
    <section className={cn("section-y-sm", alt && "bg-white-3")}>
      <Container>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2 className={cn("type-h1 text-black", eyebrow && "mt-3")}>{heading}</h2>
            {body && <p className="mt-5 measure type-body text-grey">{body}</p>}
            {cta && (
              <div className="mt-8">
                <ButtonLink href={cta.href} variant="primary" data-event="cta_click_section">
                  {cta.label}
                </ButtonLink>
              </div>
            )}
          </div>
          {image && (
            <div className="lg:col-span-5">
              {/* Text never sits on top of an image (design.md), so the photograph is a column
                  beside the words rather than a backdrop behind them. */}
              <SanityPhoto
                image={image}
                slot={`section-${number}`}
                fallbackAlt={heading}
                aspect="photo"
                sizes="(min-width: 1024px) 460px, 100vw"
              />
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

function RichTextSection({
  section,
  number,
  alt,
}: {
  section: PageSection;
  number: string;
  alt: boolean;
}) {
  const heading = field<string>(section, "heading");
  const eyebrow = field<string>(section, "eyebrow");
  const body = field<PortableTextValue>(section, "body");

  return (
    <section className={cn("section-y-sm", alt && "bg-white-3")}>
      <Container>
        {heading && <SectionHeading number={number} eyebrow={eyebrow} title={heading} />}
        <PortableText value={body} className="mt-6" />
      </Container>
    </section>
  );
}

function OfferSection({
  section,
  number,
  alt,
}: {
  section: PageSection;
  number: string;
  alt: boolean;
}) {
  const heading = field<string>(section, "heading") ?? "";
  const eyebrow = field<string>(section, "eyebrow");
  const body = field<string>(section, "body");
  const points = field<string[]>(section, "points") ?? [];
  const cta = field<{ label: string; href: string }>(section, "cta");

  return (
    <section className={cn("section-y-sm", alt && "bg-white-3")}>
      <Container>
        <div className="hairline pt-6 grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <SectionHeading rule={false} number={number} eyebrow={eyebrow ?? "What you get"} title={heading} />
          </div>
          <div className="lg:col-span-7">
            {body && <p className="measure type-body text-grey">{body}</p>}
            {points.length > 0 && (
              <ul className={cn("flex flex-col gap-3", body && "mt-6")}>
                {points.map((point) => (
                  <li key={point} className="flex gap-3 type-body text-black">
                    <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 bg-red" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
            {cta && (
              <div className="mt-8">
                <ButtonLink href={cta.href} variant="primary" data-event="cta_click_offer">
                  {cta.label}
                </ButtonLink>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

/**
 * The one black section. `design.md` allows exactly one per page, so proof is where it goes: it is
 * the section that most wants to stop the scroll, and it is the only one whose content is short
 * enough to carry a dark ground without becoming a wall.
 */
function ProofSection({ section, number }: { section: PageSection; number: string }) {
  const heading = field<string>(section, "heading");
  const facts = field<{ _key?: string; value: string; label: string }[]>(section, "facts") ?? [];

  return (
    <section className="section-y-sm dark-wash bg-black">
      <Container>
        {heading && (
          <SectionHeading number={number} eyebrow="Proof" title={heading} onDark />
        )}
        <dl className={cn("grid gap-8 sm:grid-cols-2 lg:grid-cols-4", heading && "mt-10")}>
          {facts.map((fact, index) => (
            <div key={fact._key ?? index}>
              {/* Bebas for numerals only (design.md). A word here would be set in Montserrat. */}
              <dt
                className={cn(
                  "text-white",
                  /^[\d₹]/.test(fact.value) ? "type-numeral text-display-lg" : "type-h2",
                )}
              >
                {fact.value}
              </dt>
              <dd className="mt-2 type-small text-grey-2">{fact.label}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

function FormSection({
  section,
  number,
  courses,
  replyPromise,
  turnstileSiteKey,
}: {
  section: PageSection;
  number: string;
  courses: CourseOption[];
  replyPromise: string | null;
  turnstileSiteKey?: string;
}) {
  const heading = field<string>(section, "heading") ?? "";
  const body = field<string>(section, "body");
  const variant = field<"student" | "cafe">(section, "variant") ?? "student";

  return (
    <section className="section-y-sm" id="enquire">
      <Container>
        <div className="hairline pt-6 grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <SectionHeading rule={false} number={number} eyebrow="Enquire" title={heading} />
            {body && <p className="mt-5 measure type-body text-grey">{body}</p>}
          </div>
          <div className="lg:col-span-7">
            <EnquiryForm
              variant={variant}
              courses={courses}
              replyPromise={replyPromise}
              turnstileSiteKey={turnstileSiteKey}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

function FaqSection({
  section,
  number,
  alt,
}: {
  section: PageSection;
  number: string;
  alt: boolean;
}) {
  const heading = field<string>(section, "heading") ?? "Common questions";
  const items =
    field<{ _key?: string; q: string; a: string; link?: { label: string; href: string } | null }[]>(
      section,
      "items",
    ) ?? [];

  if (items.length === 0) return null;

  return (
    <section className={cn("section-y-sm", alt && "bg-white-3")}>
      <Container>
        <SectionHeading number={number} eyebrow="Questions" title={heading} />
        <FaqAccordion
          className="mt-8"
          items={items.map((item) => ({
            q: item.q,
            a: item.a,
            category: "courses" as const,
            link: item.link ?? undefined,
          }))}
        />
      </Container>
    </section>
  );
}

/** The questions across every FAQ section, for FAQPage structured data. */
export function faqEntriesFromSections(sections: PageSection[]): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = [];
  for (const section of sections) {
    if (section._type !== "faqSection") continue;
    const items = (section.items ?? []) as { q?: string; a?: string }[];
    for (const item of items) {
      if (item.q && item.a) out.push({ q: item.q, a: item.a });
    }
  }
  return out;
}
