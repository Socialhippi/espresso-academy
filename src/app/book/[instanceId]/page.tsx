import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { Container } from "@/components/site/Container";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { ButtonLink } from "@/components/site/Button";
import { TbcPill } from "@/components/site/TbcPill";
import { CheckoutForm } from "@/components/booking/CheckoutForm";
import { WaitlistInline } from "@/components/course/WaitlistInline";
import { feeInRupees, getInstanceForCheckout, hasStarted, seatsRemaining } from "@/lib/bookings";
import { BOOKING_TERMS, chargeFor, isFullPaymentEnabled } from "@/lib/booking-terms";
import { getSiteSettings } from "@/lib/content";
import { formatDateRange, formatFeeAmount } from "@/lib/format";
import { isPaymentConfigured } from "@/lib/payments/provider";

/**
 * Checkout for one batch.
 *
 * Always rendered per request. A page that decides whether a seat can be bought must not be served
 * from a cache: the fee, the seat count and the batch's status are all things that can change
 * between the build and the reader, and being wrong about any of them means either turning away a
 * customer or taking money for a seat that is gone.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/book/[instanceId]">): Promise<Metadata> {
  const { instanceId } = await params;
  const instance = await getInstanceForCheckout(instanceId);
  const title = instance ? `Book ${instance.course.title}` : "Book a seat";
  return {
    title,
    // Never indexed: it is a per-batch transactional page that duplicates the course page and
    // goes stale the moment the batch runs.
    robots: { index: false, follow: false },
  };
}

export default async function BookPage({ params }: PageProps<"/book/[instanceId]">) {
  const { instanceId } = await params;
  const instance = await getInstanceForCheckout(instanceId);
  if (!instance) notFound();

  const course = instance.course;
  const settings = await getSiteSettings();
  const fee = feeInRupees(instance);
  const seats = seatsRemaining(instance);
  const paymentsOn = await isPaymentConfigured();
  const dates = formatDateRange(instance.startDate, instance.endDate);

  /* `hasStarted` matches the guard in /api/orders. Without it this page would show a payment
     form that the server then refuses, which is a worse way to learn the batch has begun. */
  const closed =
    instance.status === "completed" || instance.status === "tbc" || hasStarted(instance);
  const full = seats !== null && seats <= 0;
  const canPay = Boolean(fee) && paymentsOn && !closed && !full;

  /* What this page is actually about to charge. The same function the order route uses, so the
     number on the button and the number at the gateway cannot disagree. */
  const charge =
    fee === null
      ? null
      : chargeFor({
          feeExGst: fee,
          gstRate: course.gstRate,
          fullPaymentEnabled: isFullPaymentEnabled(),
        });
  /* One suffix for every figure in this column, because they are all on the same basis. */
  const chargeSuffix = charge?.gstIncluded ? "incl. GST" : "+ GST";

  return (
    <Container className="py-10 md:py-16">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        {/* The batch, on the left on desktop and above the form on mobile: someone about to pay
            should be able to check what they are paying for without scrolling past the form. */}
        <div className="lg:col-span-5">
          <Breadcrumbs
            items={[
              { label: "Courses", href: "/courses" },
              { label: course.title, href: `/courses/${course.slug}` },
              { label: "Book", href: `/book/${instance.id}` },
            ]}
          />

          <p className="eyebrow mt-6">Booking</p>
          <h1 className="mt-3 type-h1 text-black">{course.title}</h1>
          <p className="mt-3 type-body text-grey">{course.levelLabel}</p>

          <dl className="mt-8 hairline flex flex-col gap-4 pt-6">
            <BatchFact icon={<CalendarDays className="size-5" aria-hidden="true" />} label="Dates">
              {instance.startDate ? dates : <TbcPill />}
            </BatchFact>
            <BatchFact icon={<Clock className="size-5" aria-hidden="true" />} label="Schedule">
              {instance.schedule ?? <TbcPill />}
            </BatchFact>
            <BatchFact icon={<MapPin className="size-5" aria-hidden="true" />} label="Venue">
              {instance.venue?.name ?? `${settings.name}, ${settings.address.city} campus`}
            </BatchFact>
            <BatchFact icon={<Users className="size-5" aria-hidden="true" />} label="Seats left">
              {seats === null ? <TbcPill /> : <span className="type-numeral text-h3-lg">{seats}</span>}
            </BatchFact>
          </dl>

          <div className="mt-6 hairline pt-6">
            {fee === null || charge === null ? (
              <>
                <p className="type-label text-grey">Fee</p>
                <p className="mt-2 flex items-center gap-3 type-body text-black">
                  <TbcPill /> The academy confirms the fee for this batch.
                </p>
              </>
            ) : (
              <>
                {/*
                  The number in the display face is the number about to leave the student's
                  account, not the course fee. It read the fee and charged something else, which
                  on the academy's advance model would have been the page quoting ₹26,700 above a
                  button taking ₹5,000.
                */}
                <p className="type-label text-grey">
                  {charge.kind === "advance" ? "To pay now" : "Fee"}
                </p>
                <p className="mt-2 type-numeral text-display-lg text-black">
                  {formatFeeAmount(charge.amount)}
                </p>
                <p className="mt-1 type-small text-grey">
                  {charge.kind === "advance"
                    ? "advance, which confirms your seat and comes off the fee"
                    : chargeSuffix}
                </p>

                {/*
                  The three lines add up, in the order a student checks them: what the course
                  costs, what is going now, what is left. Before the rate was confirmed the middle
                  row could not be stated, so it was two rows and a "+ GST" on each; now they are
                  one basis and they reconcile, which is the whole point of showing them together.
                */}
                <dl className="mt-6 flex flex-col gap-3 type-small">
                  <div className="flex flex-wrap justify-between gap-x-4">
                    <dt className="text-grey">Course fee</dt>
                    <dd className="text-black">
                      {formatFeeAmount(charge.payable)} {chargeSuffix}
                    </dd>
                  </div>
                  <div className="flex flex-wrap justify-between gap-x-4">
                    <dt className="text-grey">Paid now</dt>
                    <dd className="text-black">&minus;{formatFeeAmount(charge.amount)}</dd>
                  </div>
                  {charge.balance > 0 && (
                    <div className="flex flex-wrap justify-between gap-x-4 hairline pt-3">
                      <dt className="font-medium text-black">Balance, at the academy</dt>
                      <dd className="font-medium text-black">
                        {formatFeeAmount(charge.balance)} {chargeSuffix}
                      </dd>
                    </div>
                  )}
                </dl>
              </>
            )}
          </div>

          {/* The terms sit beside the form rather than under it. They are four sentences and one
              of them is "if you do not attend, the fee is not refunded", which is not something to
              meet after paying. */}
          <div className="mt-6 hairline pt-6">
            <p className="type-label text-grey">Before you pay</p>
            <ul className="mt-3 flex flex-col gap-2 type-small text-grey">
              {BOOKING_TERMS.map((term) => (
                <li key={term} className="flex gap-3">
                  <span className="mt-2.5 h-px w-3 shrink-0 bg-red" aria-hidden="true" />
                  {term}
                </li>
              ))}
            </ul>
            <p className="mt-4 type-small text-grey">
              In full, on the{" "}
              <Link
                href="/refund-policy"
                className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
              >
                refund and reschedule policy
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="lg:col-span-7">
          {canPay && fee !== null && charge !== null ? (
            <CheckoutForm
              instanceId={instance.id}
              courseSlug={course.slug}
              courseTitle={course.title}
              amount={charge.amount}
              balance={charge.balance}
              paymentType={charge.kind}
              gstIncluded={charge.gstIncluded}
              prerequisite={course.prerequisites}
              turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            />
          ) : (
            <UnavailableState
              reason={fee === null ? "no-fee" : !paymentsOn ? "no-gateway" : full ? "full" : "closed"}
              courseSlug={course.slug}
              courseTitle={course.title}
              instanceId={instance.id}
              batchLabel={instance.startDate ? dates : null}
            />
          )}
        </div>
      </div>
    </Container>
  );
}

function BatchFact({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    /*
     * A <dl> may only directly contain <dt>, <dd> or a <div> wrapping a dt/dd group. The icon
     * therefore lives inside the <dt> rather than beside it in the wrapper: a <span> as a direct
     * child of the group is an axe "definition-list" failure, and it was one here.
     */
    <div>
      <dt className="flex items-center gap-3 type-label text-grey">
        <span aria-hidden="true">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1 pl-8 type-body text-black">{children}</dd>
    </div>
  );
}

/**
 * The four states in which no payment can be taken. Each says which one it is and gives a way
 * forward: a checkout page that just refuses is a lost enquiry.
 */
function UnavailableState({
  reason,
  courseSlug,
  courseTitle,
  instanceId,
  batchLabel,
}: {
  reason: "no-fee" | "no-gateway" | "full" | "closed";
  courseSlug: string;
  courseTitle: string;
  instanceId: string;
  batchLabel: string | null;
}) {
  const copy = {
    "no-fee": {
      heading: "The fee for this batch is not confirmed yet",
      body: "The academy sets the fee for each batch and confirms it before anyone pays. Ask on WhatsApp and you will get the current figure and the seat position for this date.",
    },
    "no-gateway": {
      heading: "Online payment is not switched on yet",
      body: "You can still hold a seat. Message the academy and they will confirm the fee, the dates and how to pay.",
    },
    full: {
      heading: "This batch is full",
      body: "Join the waiting list and the academy will tell you first when a seat frees up or the next date is set. Nothing is charged for the list.",
    },
    closed: {
      heading: "This batch is not open for booking",
      body: "Either it has started, it has already run, or its dates are still being finalised. Join the alert and you will hear when the next one is set.",
    },
  }[reason];

  return (
    <div className="border border-white-2 bg-white-3 p-6 md:p-8">
      <h2 className="type-h2 text-black">{copy.heading}</h2>
      <p className="mt-4 measure type-body text-grey">{copy.body}</p>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        <WhatsAppButton course={courseTitle} batch={batchLabel} event="whatsapp_click_book">
          Ask on WhatsApp
        </WhatsAppButton>
        <ButtonLink href={`/enquire?course=${courseSlug}`} variant="secondary">
          Send an enquiry
        </ButtonLink>
      </div>

      {(reason === "full" || reason === "closed") && (
        <div className="mt-8 hairline pt-6">
          <WaitlistInline course={courseTitle} batch={batchLabel ?? undefined} instanceId={instanceId} />
        </div>
      )}
    </div>
  );
}
