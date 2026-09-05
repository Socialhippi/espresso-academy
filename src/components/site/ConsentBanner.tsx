"use client";

// Client: reads and writes the consent cookie and dismisses itself on choice.

import Link from "next/link";
import { Button } from "@/components/site/Button";
import { Container } from "@/components/site/Container";
import { useConsent, writeConsent, type Consent } from "@/lib/consent";
import { consentUpdate } from "@/lib/analytics/consent-mode";
import { trackConsentChoice } from "@/components/site/Analytics";

/**
 * Measurement consent. Nothing loads until this is answered: consent mode v2 defaults every storage
 * type to `denied` in the document head, and `Analytics` waits for a granted choice before it
 * injects GTM or the Meta Pixel at all.
 *
 * The copy is kept short on purpose. The banner paints at hydration, and a fixed full-width block
 * of body text is easily the largest thing in the viewport at that moment, which made it the
 * Largest Contentful Paint on course pages at 2.4s even though the H1 had painted at 0.7s.
 *
 * It sits flush at the bottom. The mobile sticky bar shares that space, so StickyBar holds itself
 * back until this choice is made rather than this offsetting for a bar that is usually hidden.
 */
export function ConsentBanner() {
  const consent = useConsent();

  if (consent !== null) return null;

  const choose = (value: Exclude<Consent, null>) => () => {
    writeConsent(value);
    /*
     * Two separate signals, and both are needed. `consentUpdate` is the gtag command GTM reads to
     * unlock its tags; `trackConsentChoice` is an ordinary dataLayer event, which is what makes the
     * choice visible in a report and assertable in the test suite. A consent command is not an
     * event and does not appear as one.
     */
    consentUpdate(value === "accepted");
    trackConsentChoice(value === "accepted");
  };

  return (
    <div role="region" aria-label="Cookie choices" className="fixed inset-x-0 bottom-0 z-60">
      <Container>
        <div className="mb-4 rounded-sm border border-white-2 bg-white p-5 shadow-sm md:mb-6 md:flex md:items-center md:justify-between md:gap-8">
          {/* Deliberately short. See the note above the component. */}
          <p className="measure-tight type-small text-grey">
            One cookie remembers this choice. Nothing else is measured yet.{" "}
            <Link
              href="/privacy"
              className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
            >
              Privacy
            </Link>
          </p>
          <div className="mt-4 flex gap-3 md:mt-0 md:shrink-0">
            <Button variant="secondary" size="sm" onClick={choose("declined")}>
              No thanks
            </Button>
            <Button variant="primary" size="sm" onClick={choose("accepted")}>
              That is fine
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
