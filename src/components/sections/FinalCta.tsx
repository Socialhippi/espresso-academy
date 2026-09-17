import type { ReactNode } from "react";
import { Container } from "@/components/site/Container";
import { ButtonLink } from "@/components/site/Button";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { cn } from "@/lib/utils";

interface FinalCtaProps {
  /** Bebas headline. Short: it is set at display size. */
  title: string;
  body: ReactNode;
  /** Primary destination. Defaults to the enquiry form. */
  href?: string;
  ctaLabel?: string;
  /** So a button that opens a checkout does not report itself as an enquiry. */
  event?: string;
  /** Pre-fills the WhatsApp message with a course title. */
  course?: string;
  className?: string;
  number?: string;
  eyebrow?: string;
}

/**
 * The closing conversion block, on white.
 *
 * This used to be the one black section design.md allows per page. It was also the last section on
 * every route, sitting directly on the black Footer, and two black blocks touching do not read as a
 * dark section — they read as the footer starting early. The page got no dark interruption at all,
 * and a design review reported all three routes as an unbroken run of white bands.
 *
 * The black section moved to the level ladder, which is mid-page and below the fold on every route
 * that has one. This block stays white, which gives the closing call to action a hard edge against
 * the footer instead of dissolving into it.
 */
export function FinalCta({
  title,
  body,
  href = "/enquire",
  ctaLabel = "Enquire about a seat",
  event = "enquire_click_final",
  course,
  className,
  number = "06",
  eyebrow = "Next step",
}: FinalCtaProps) {
  return (
    <section className={cn("bg-white pt-16 pb-10 md:pt-32 md:pb-16", className)} aria-labelledby="final-cta-heading">
      <Container>
        <div className="grid gap-10 hairline pt-6 lg:grid-cols-12">
          {/* `reveal-heading` by hand rather than through SectionHeading: this block is an H1-scale
              heading, which SectionHeading does not render. Without it, section 07 was the only
              numbered section on any route whose heading did not arrive with the others, and it is
              the closing conversion block. */}
          <div className="reveal-heading lg:col-span-7">
            <p className="eyebrow">
              <span className="type-numeral text-h3-lg leading-none" aria-hidden="true">
                {number}
              </span>
              {eyebrow}
            </p>
            <h2 id="final-cta-heading" className="mt-4 type-h1 text-black">
              {title}
            </h2>
          </div>
          <div className="lg:col-span-5">
            <div className="measure type-body text-grey">{body}</div>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              <ButtonLink href={href} variant="primary" data-event={event}>
                {ctaLabel}
              </ButtonLink>
              {/* Back to design.md's default: a black ground with the glyph, so red stays
                  singular beside the primary pill. The white-outline override this carried was for
                  the dark ground it no longer sits on. */}
              <WhatsAppButton course={course} event="whatsapp_click_final" />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
