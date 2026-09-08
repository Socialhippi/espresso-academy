import type { Metadata } from "next";
import Link from "next/link";
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
          Fees are quoted before GST, the way the academy quotes them, and GST is charged at 18%.
          Every course page prints both: the fee before GST and the total including it. The Italian
          Barista Certificate is part of the course fee, and nothing separate is charged for it.
        </p>
        <p>
          An advance of ₹5,000 confirms a seat. It comes off the total including GST rather than
          being charged on top of it. The balance is paid to the academy before the first day. The
          reschedule and refund terms are on the{" "}
          <Link
            href="/refund-policy"
            className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
          >
            refund and reschedule policy
          </Link>
          .
        </p>
        <p>
          The Italian Barista Certificate is issued in Italy by Espresso Academy, Florence. The
          academy does not run an SCA course; SCA certification is issued by the Specialty Coffee
          Association, not by a school, and whether a given batch is assessed for it is confirmed
          before you book.
        </p>
      </LegalSection>

      <LegalSection title="Changes to a batch">
        <p>
          Occasionally a batch has to move. What the academy does when that happens is still being
          confirmed, and the draft on the refund policy page offers you the next batch or a full
          refund. Read it, and ask before you book if it matters to you.
        </p>
      </LegalSection>
    </LegalPlaceholder>
  );
}
