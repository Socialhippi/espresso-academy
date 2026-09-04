import type { Metadata } from "next";
import { LegalPlaceholder, LegalSection } from "@/components/site/LegalPlaceholder";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Use and Enrolment",
  description:
    "The terms this website is offered under, what an enquiry does and does not commit you to, and how course bookings at the Bengaluru campus are confirmed.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPlaceholder
      title="Terms"
      path="/terms"
      intro="What this site is, and what sending an enquiry does and does not commit you to."
    >
      <LegalSection title="This website">
        <p>
          This site describes the courses Espresso Academy India runs at its Bengaluru campus. We
          keep it accurate, and where a fee, date or duration is not confirmed we mark it TBC
          rather than print a number we cannot stand behind.
        </p>
      </LegalSection>

      <LegalSection title="Enquiries are not bookings">
        <p>
          Sending the enquiry form does not book a seat and does not commit you to paying anything.
          It starts a conversation. A seat is confirmed by the academy, in writing, after the fee
          and the batch are agreed.
        </p>
      </LegalSection>

      <LegalSection title="Fees and certificates">
        <p>
          Fees are stated incl. GST before you pay. Where a certification body charges its own fee
          on top of the course fee, the academy tells you before you pay, not after.
        </p>
        <p>
          The Italian Barista Certificate is issued in Italy by Espresso Academy, Florence.
          Certification under the SCA Coffee Skills Program is issued by the Specialty Coffee
          Association, not by the academy, and whether a given batch is assessed for it is
          confirmed at enrolment.
        </p>
      </LegalSection>

      <LegalSection title="Changes to a batch">
        <p>
          Occasionally a batch has to move. If that happens the academy tells you as early as it
          can and offers you the next batch or your money back. See the refund policy.
        </p>
      </LegalSection>
    </LegalPlaceholder>
  );
}
