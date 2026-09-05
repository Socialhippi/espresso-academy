import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/Container";
import { ButtonLink } from "@/components/site/Button";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { CalEmbed } from "@/components/forms/CalEmbed";
import { getSiteSettings } from "@/lib/content";
import { formatPhone, telHref } from "@/lib/format";

export const metadata: Metadata = {
  title: "We have your enquiry",
  description: "Your enquiry has reached Espresso Academy India. Here is what happens next.",
  robots: { index: false, follow: true, nocache: true },
};

const steps = [
  {
    number: "01",
    title: "Someone reads it",
    body: "A trainer, not a call centre. They look at what you asked and where you are starting from.",
  },
  {
    number: "02",
    title: "You get a reply on WhatsApp",
    body: "With the fee incl. GST, the next batch date and an honest answer on whether this course is the right one for you.",
  },
  {
    number: "03",
    title: "You decide",
    body: "Come and see the campus first if you want to. Nobody is going to chase you.",
  },
];

/**
 * `searchParams` makes this dynamic, which is the price of telling a cafe enquiry apart from a
 * student one. The page is noindex and post-submit, so it is never in a cache anybody waits on.
 */
export default async function ThankYouPage({ searchParams }: PageProps<"/thank-you">) {
  const settings = await getSiteSettings();
  const params = await searchParams;
  const topic = Array.isArray(params.topic) ? params.topic[0] : params.topic;
  const isCafe = topic === "cafe";
  const calLink = process.env.NEXT_PUBLIC_CALCOM_LINK;

  return (
    <Container className="py-16 md:py-28">
      <p className="eyebrow">Enquiry sent</p>
      <h1 className="mt-4 type-h1 text-black">We have your enquiry</h1>
      <p className="mt-5 measure type-body text-grey">
        {/* TODO(client): settings.replyPromise is null, so no reply time is promised here. */}
        {settings.replyPromise ??
          "We reply on WhatsApp during academy hours. If you would rather not wait, open the chat below and we will pick it up there."}
      </p>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <WhatsAppButton event="whatsapp_click_thankyou">Continue on WhatsApp</WhatsAppButton>
        <ButtonLink href="/courses" variant="secondary">
          See all courses
        </ButtonLink>
        <ButtonLink href="/calendar" variant="tertiary" size="inline">
          See the batch calendar
        </ButtonLink>
      </div>

      {isCafe && calLink && (
        <section aria-labelledby="call-heading" className="mt-16 hairline pt-8">
          <h2 id="call-heading" className="type-h2 text-black">
            Put a call in the diary
          </h2>
          <p className="mt-4 measure type-body text-grey">
            Team training is easier to scope in fifteen minutes than over messages. Pick a slot that
            suits you, or ignore this and the academy will message you either way.
          </p>
          <CalEmbed link={calLink} className="mt-8" />
        </section>
      )}

      {isCafe && !calLink && (
        /* No Cal.com link configured. The WhatsApp button above is the whole path, so this says
           what happens next rather than leaving a cafe enquiry with a generic student page. */
        <section aria-labelledby="call-heading" className="mt-16 hairline pt-8">
          <h2 id="call-heading" className="type-h2 text-black">
            The academy will call you
          </h2>
          <p className="mt-4 measure type-body text-grey">
            Team training is easier to scope on a call than over messages. Tell us on WhatsApp when
            suits and we will ring you then.
          </p>
        </section>
      )}

      <section aria-labelledby="next-heading" className="mt-16 hairline pt-6">
        <h2 id="next-heading" className="type-h2 text-black">
          What happens next
        </h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <li key={step.number} className="border-t border-white-2 pt-4">
              <p className="type-numeral text-h2 text-red" aria-hidden="true">
                {step.number}
              </p>
              <h3 className="mt-2 type-h3 text-black">{step.title}</h3>
              <p className="mt-2 type-small text-grey">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-12 type-small text-grey">
        In a hurry? Call{" "}
        <a
          href={telHref(settings.phonePrimary)}
          className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
        >
          {formatPhone(settings.phonePrimary)}
        </a>{" "}
        or read the{" "}
        <Link
          href="/faq"
          className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
        >
          questions other students ask
        </Link>
        .
      </p>
    </Container>
  );
}
