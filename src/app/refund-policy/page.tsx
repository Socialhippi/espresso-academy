import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/Container";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { TbcPill } from "@/components/site/TbcPill";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { PortableText } from "@/components/content/PortableText";
import { getSiteSettings } from "@/lib/content";
import { formatPhone, telHref } from "@/lib/format";
import { pageMetadata } from "@/lib/seo/metadata";
import { graph, webPageNode } from "@/lib/seo/schema";

export const metadata: Metadata = pageMetadata({
  title: "Refund and Reschedule Policy",
  description:
    "What the ₹5,000 advance holds, when the balance is due, how to move to another batch, and what happens if you cannot attend a course at Espresso Academy India.",
  path: "/refund-policy",
});

const TITLE = "Refund and reschedule policy";
const INTRO = "What happens to your fee if plans change, on either side.";

interface ClauseProps {
  title: string;
  children: React.ReactNode;
}

function Clause({ title, children }: ClauseProps) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="type-h3 text-black">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 type-body text-grey">{children}</div>
    </section>
  );
}

/**
 * The one legal page the checkout links to, so it is the one that says something.
 *
 * It used to be the same developer-written placeholder as /privacy and /terms, behind a banner
 * admitting as much. Revision 2 of content/facts.md carries the academy's own booking and refund
 * policy, so the page states it: what the advance holds, when the balance is due, the reschedule
 * window, and the no-refund rule. The banner is gone with the placeholder.
 *
 * One clause is still marked TBC, and only one: what happens when the *academy* moves or cancels a
 * batch. facts.md says plainly that the client has not stated it, and the wording below is a draft
 * awaiting sign-off. It is left visible rather than omitted because a policy that is silent about
 * the school's own cancellations reads as a policy that has something to hide, and because the
 * clause as drafted is in the student's favour.
 *
 * `siteSettings.refundPolicy` still wins when the academy writes its own in the Studio.
 */
export default async function RefundPolicyPage() {
  const settings = await getSiteSettings();
  const policy = settings.refundPolicy;

  return (
    <Container className="py-10 md:py-16">
      <JsonLd id="legal-jsonld" data={graph([webPageNode("/refund-policy", TITLE, INTRO)])} />
      <Breadcrumbs items={[{ label: TITLE, href: "/refund-policy" }]} />

      <h1 className="mt-6 type-h1 text-black md:mt-8">{TITLE}</h1>
      <p className="mt-5 measure type-body text-grey">{INTRO}</p>

      {policy && policy.length > 0 ? (
        <PortableText value={policy} className="mt-10" />
      ) : (
        <div className="mt-12 measure">
          <Clause title="What holds your seat">
            <p>
              An advance of ₹5,000 confirms your seat. Batches are capped, at 8 seats on the IBC
              Basic and 4 on each Advanced course, so it is the advance that reserves one rather
              than the enquiry.
            </p>
            <p>
              The advance is part of the fee, not on top of it. The balance is paid to the academy
              before the first day.
            </p>
          </Clause>

          <Clause title="Moving to another batch">
            <p>
              You can move to another batch, with prior notice, up to 3 months from your original
              start date. Tell the academy as early as you can: the new batch has to have a seat
              free, and seats are capped.
            </p>
            <p>There is no charge for moving batch within that window.</p>
          </Clause>

          <Clause title="If you do not attend">
            <p>
              The fee is not refunded for non-attendance. If something has gone wrong, tell the
              academy before the batch starts rather than after it: a reschedule is almost always
              possible in advance and never possible in arrears.
            </p>
          </Clause>

          <Clause title="If you cancel">
            <p>
              The academy&rsquo;s published policy offers a reschedule rather than a refund. If you
              cannot make any batch in the next 3 months, say so and ask; you will get a straight
              answer rather than a form.
            </p>
          </Clause>

          <Clause title="If the academy moves or cancels a batch">
            {/* TODO(client): open question 5 in content/facts.md. This wording is a draft written
                for the student's benefit and has not been signed off by the academy. It is the
                only clause on this page that is not from the client's own document. */}
            <p className="flex flex-wrap items-center gap-3">
              <TbcPill />
              {/* The pill's own accessible label already reads "to be confirmed by the academy",
                  so this sentence says the part the pill cannot: who wrote the clause. */}
              <span className="type-small">
                Not signed off yet. What follows is what we have asked the academy to agree to.
              </span>
            </p>
            <p>
              If the academy moves or cancels a batch, you choose: a seat on the next batch at no
              extra cost, or your money back in full. The academy tells you as early as it can
              rather than on the morning.
            </p>
          </Clause>

          <Clause title="The certificate and the fee">
            <p>
              The Italian Barista Certificate is part of the course fee. No certification body
              charges a separate assessment or certificate fee on top of it, so there is nothing
              further to pay and nothing further to refund.
            </p>
            <p>
              GST is charged on the fee. The academy is confirming the rate, so no tax-inclusive
              total appears on this site yet; you are told the total before you pay anything.
            </p>
          </Clause>

          <Clause title="How to tell us">
            <p>
              WhatsApp is the fastest, and it leaves both of us a record of when you told us, which
              matters for the notice periods above. Quote the booking reference from your
              confirmation email if you have one.
            </p>
          </Clause>
        </div>
      )}

      <div className="mt-12 hairline flex flex-col gap-4 pt-8 sm:flex-row sm:flex-wrap sm:items-center">
        <WhatsAppButton
          message="Hi, I have a question about a booking and the refund or reschedule policy."
          event="whatsapp_click_refund"
        >
          Ask about a booking
        </WhatsAppButton>
        <a
          href={telHref(settings.phonePrimary)}
          className="inline-flex min-h-11 items-center type-body text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
        >
          {formatPhone(settings.phonePrimary)}
        </a>
      </div>

      <p className="mt-8 type-small text-grey">
        See also{" "}
        <Link
          href="/privacy"
          className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
        >
          privacy
        </Link>{" "}
        and{" "}
        <Link
          href="/terms"
          className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
        >
          terms
        </Link>
        .
      </p>
    </Container>
  );
}
