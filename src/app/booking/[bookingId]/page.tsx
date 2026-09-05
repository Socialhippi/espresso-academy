import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, CalendarPlus, Check, Clock, MapPin } from "lucide-react";
import { Container } from "@/components/site/Container";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { ButtonLink } from "@/components/site/Button";
import { TbcPill } from "@/components/site/TbcPill";
import { BookingStatusPoll } from "@/components/booking/BookingStatusPoll";
import { getBooking } from "@/lib/bookings";
import { getSiteSettings } from "@/lib/content";
import { formatDateRange, formatPhone, telHref } from "@/lib/format";

/**
 * The confirmation page.
 *
 * Dynamic and never indexed. It carries a name, a phone number and an email address, and its URL
 * is the only thing standing between those and anyone who has the link, so it must not sit in a
 * shared cache or a search index. `robots` says so and the site-wide header says so again.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your booking",
  robots: { index: false, follow: false },
};

export default async function BookingPage({ params }: PageProps<"/booking/[bookingId]">) {
  const { bookingId } = await params;
  const booking = await getBooking(bookingId);
  if (!booking) notFound();

  const settings = await getSiteSettings();
  const paid = booking.status === "paid";
  const dates = booking.instance
    ? formatDateRange(booking.instance.startDate, booking.instance.endDate)
    : null;
  const venue = booking.instance?.venue;

  return (
    <Container className="py-10 md:py-16">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          {paid ? (
            <>
              <p className="flex items-center gap-2 eyebrow">
                <Check className="size-4" aria-hidden="true" />
                Booked
              </p>
              <h1 className="mt-3 type-h1 text-black">Your seat is booked</h1>
              <p className="mt-5 measure type-body text-grey">
                We have taken ₹{(booking.amount ?? 0).toLocaleString("en-IN")} incl. GST for{" "}
                {booking.course?.title ?? "your course"}. A confirmation is on its way to{" "}
                {booking.email ?? "your email address"}.
              </p>
            </>
          ) : (
            <>
              <p className="eyebrow">Booking</p>
              <h1 className="mt-3 type-h1 text-black">
                {booking.course?.title ?? "Your booking"}
              </h1>
            </>
          )}

          <div className="mt-8">
            <BookingStatusPoll
              bookingId={booking.id}
              initialStatus={booking.status}
              courseTitle={booking.course?.title ?? "your course"}
              courseSlug={booking.course?.slug ?? ""}
              amount={booking.amount}
            />
          </div>

          {booking.overbooked && paid && (
            /* Not red on a dark ground and not a scary banner: the student has done nothing wrong
               and their money is safe. It says what happened and who is fixing it. */
            <div className="mt-8 border border-white-2 bg-white-3 p-6">
              <h2 className="type-h3 text-black">The academy will call you about this batch</h2>
              <p className="mt-3 measure type-body text-grey">
                Your payment went through just as the last seat was taken. The academy will be in
                touch to move you to the next date or to arrange a refund, whichever you prefer.
                Nothing further is needed from you.
              </p>
            </div>
          )}

          {paid && (
            <section className="mt-10 hairline pt-8">
              <h2 className="type-h2 text-black">What happens next</h2>
              <ol className="mt-6 flex flex-col gap-5">
                <NextStep number="01" title="A confirmation email">
                  It has your batch dates, the campus address and the receipt. Check your spam
                  folder if it has not arrived in ten minutes.
                </NextStep>
                <NextStep number="02" title="A message from the academy">
                  A trainer messages you on WhatsApp before the batch starts with the timings and
                  what to bring.
                </NextStep>
                <NextStep number="03" title="Turn up">
                  Come to the campus on the first morning. There is nothing to print.
                </NextStep>
              </ol>
            </section>
          )}
        </div>

        <aside className="lg:col-span-5">
          <div className="border border-white-2 p-6 md:p-8">
            <h2 className="type-h3 text-black">Your batch</h2>
            <dl className="mt-6 flex flex-col gap-4">
              <Fact icon={<CalendarDays className="size-5" aria-hidden="true" />} label="Dates">
                {dates ?? <TbcPill />}
              </Fact>
              <Fact icon={<Clock className="size-5" aria-hidden="true" />} label="Schedule">
                {booking.instance?.schedule ?? <TbcPill />}
              </Fact>
              <Fact icon={<MapPin className="size-5" aria-hidden="true" />} label="Venue">
                <span className="block">
                  {venue?.name ?? `${settings.name}, ${settings.address.city} campus`}
                </span>
                {venue?.address && (
                  <span className="mt-1 block type-small text-grey">
                    {venue.address.line1}
                    {venue.address.line2 ? `, ${venue.address.line2}` : ""}, {venue.address.city}{" "}
                    {venue.address.postalCode}
                  </span>
                )}
                {(venue?.mapsUrl ?? settings.address.mapsUrl) && (
                  <a
                    href={(venue?.mapsUrl ?? settings.address.mapsUrl) as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-event="map_click_booking"
                    className="mt-2 inline-flex min-h-11 items-center type-small text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                  >
                    Open in Google Maps
                  </a>
                )}
              </Fact>
            </dl>

            {paid && booking.instance?.startDate && (
              <div className="mt-8 hairline pt-6">
                <ButtonLink
                  href={`/booking/${booking.id}/calendar.ics`}
                  variant="secondary"
                  size="block"
                  data-event="calendar_download"
                >
                  <CalendarPlus className="size-5" aria-hidden="true" />
                  Add to calendar
                </ButtonLink>
              </div>
            )}

            <div className="mt-8 hairline flex flex-col gap-4 pt-6">
              <WhatsAppButton
                course={booking.course?.title ?? null}
                batch={dates}
                event="whatsapp_click_booking"
                size="block"
              >
                Message the academy
              </WhatsAppButton>
              <a
                href={telHref(settings.phonePrimary)}
                data-event="call_click_booking"
                className="inline-flex min-h-11 items-center type-body text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
              >
                {formatPhone(settings.phonePrimary)}
              </a>
            </div>

            <p className="mt-6 type-small text-grey">
              Reference: {booking.id}
              <br />
              Need to change or cancel? See the{" "}
              <Link
                href="/refund-policy"
                className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
              >
                refund and reschedule policy
              </Link>
              .
            </p>
          </div>
        </aside>
      </div>
    </Container>
  );
}

function Fact({
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

function NextStep({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span className="type-numeral text-h3-lg text-red" aria-hidden="true">
        {number}
      </span>
      <div>
        <h3 className="type-h3 text-black">{title}</h3>
        <p className="mt-1 measure type-body text-grey">{children}</p>
      </div>
    </li>
  );
}
