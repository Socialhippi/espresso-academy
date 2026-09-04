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
  /** Pre-fills the WhatsApp message with a course title. */
  course?: string;
  className?: string;
  number?: string;
  eyebrow?: string;
}

/**
 * The one black section on a page, below the fold, with the red-deep radial wash from
 * design/tokens.css. Red never appears as text here: it is the button ground only.
 */
export function FinalCta({
  title,
  body,
  href = "/enquire",
  ctaLabel = "Enquire about a seat",
  course,
  className,
  number = "06",
  eyebrow = "Next step",
}: FinalCtaProps) {
  return (
    <section className={cn("dark-wash section-y", className)} aria-labelledby="final-cta-heading">
      <Container>
        <div className="grid gap-10 hairline-on-dark pt-6 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-7">
            <p className="eyebrow eyebrow-on-dark">
              <span className="type-numeral text-h3-lg leading-none" aria-hidden="true">
                {number}
              </span>
              {eyebrow}
            </p>
            <h2 id="final-cta-heading" className="mt-4 type-h1 text-white">
              {title}
            </h2>
          </div>
          <div className="md:col-span-5">
            <div className="measure type-body text-grey-2">{body}</div>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              <ButtonLink href={href} variant="primary" data-event="enquire_click_final">
                {ctaLabel}
              </ButtonLink>
              <WhatsAppButton
                course={course}
                event="whatsapp_click_final"
                className="border-outline border-white bg-transparent hover:bg-white hover:text-black"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
