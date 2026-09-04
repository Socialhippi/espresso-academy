import type { Metadata } from "next";
import { LegalPlaceholder, LegalSection } from "@/components/site/LegalPlaceholder";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Refund and Cancellation Policy",
  description:
    "What happens to your fee if you cancel, if you cannot attend, or if Espresso Academy India moves or cancels a batch at the Bengaluru campus.",
  path: "/refund-policy",
});

export default function RefundPolicyPage() {
  return (
    <LegalPlaceholder
      title="Refund policy"
      path="/refund-policy"
      intro="What happens to your fee if plans change, on either side."
    >
      <LegalSection title="If the academy moves or cancels a batch">
        <p>
          You choose: the next batch at no extra cost, or your fee back in full. The academy tells
          you as early as it can rather than on the morning.
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
