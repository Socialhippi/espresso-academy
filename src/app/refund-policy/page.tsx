import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { LegalPlaceholder, LegalSection } from "@/components/site/LegalPlaceholder";
import { PortableText } from "@/components/content/PortableText";
import { getSiteSettings } from "@/lib/content";
import { formatPhone, telHref } from "@/lib/format";
import { pageMetadata } from "@/lib/seo/metadata";
import { graph, webPageNode } from "@/lib/seo/schema";

export const metadata: Metadata = pageMetadata({
  title: "Refund and Cancellation Policy",
  description:
    "What happens to your fee if you cancel, if you cannot attend, or if Espresso Academy India moves or cancels a batch at the Bengaluru campus.",
  path: "/refund-policy",
});

const TITLE = "Refund policy";
const INTRO = "What happens to your fee if plans change, on either side.";

/**
 * The one legal page the checkout links to, so it is the one that has a field.
 *
 * When the academy writes `siteSettings.refundPolicy` in the Studio, this renders it as the real
 * policy, with no placeholder banner. Until then it falls back to the same marked placeholder as
 * /privacy and /terms. It is not left as a placeholder-only page because a checkout that links to
 * text a developer wrote, on the page a student reads before paying, is the one place that copy
 * genuinely matters.
 */
export default async function RefundPolicyPage() {
  const settings = await getSiteSettings();
  const policy = settings.refundPolicy;

  if (!policy || policy.length === 0) {
    return (
      <LegalPlaceholder title={TITLE} path="/refund-policy" intro={INTRO}>
        <LegalSection title="If the academy moves or cancels a batch">
          <p>
            You choose: the next batch at no extra cost, or your fee back in full. The academy
            tells you as early as it can rather than on the morning.
          </p>
        </LegalSection>

        <LegalSection title="If you cancel">
          <p>
            The notice period and what it means for your fee are being confirmed by the academy and
            will be stated here. Until then, tell the academy as soon as you know and it will be
            dealt with reasonably.
          </p>
        </LegalSection>

        <LegalSection title="If you cannot attend a session">
          <p>
            Talk to the academy. Where a batch is running again soon, moving you to it is usually
            simpler for everyone than a refund.
          </p>
        </LegalSection>

        <LegalSection title="Certification fees">
          <p>
            Where a certification body has already charged its own assessment or certificate fee,
            that part is between you and the body concerned, and the academy will tell you exactly
            what has been paid on your behalf.
          </p>
        </LegalSection>
      </LegalPlaceholder>
    );
  }

  return (
    <Container className="py-10 md:py-16">
      <JsonLd id="legal-jsonld" data={graph([webPageNode("/refund-policy", TITLE, INTRO)])} />
      <Breadcrumbs items={[{ label: TITLE, href: "/refund-policy" }]} />

      <h1 className="mt-6 type-h1 text-black md:mt-8">{TITLE}</h1>
      <p className="mt-5 measure type-body text-grey">{INTRO}</p>

      <PortableText value={policy} className="mt-10" />

      <div className="mt-12 hairline flex flex-col gap-4 pt-8 sm:flex-row sm:flex-wrap sm:items-center">
        <WhatsAppButton event="whatsapp_click_refund">Ask about a booking</WhatsAppButton>
        <a
          href={telHref(settings.phonePrimary)}
          className="inline-flex min-h-11 items-center type-body text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
        >
          {formatPhone(settings.phonePrimary)}
        </a>
      </div>
    </Container>
  );
}
