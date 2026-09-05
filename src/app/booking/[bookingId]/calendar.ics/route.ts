import { getBooking } from "@/lib/bookings";
import { getSiteSettings } from "@/lib/content";
import { absoluteUrl } from "@/lib/public-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The batch as a calendar file.
 *
 * Hand-built rather than pulled from a library: the whole format needed here is one VEVENT, and a
 * dependency to produce forty lines of text is a dependency to keep patched. The awkward parts are
 * the ones handled below: CRLF line endings, escaping, folding at 75 octets, and the fact that an
 * all-day DTEND is exclusive.
 *
 * Only for a paid booking. An unpaid one has nothing to put in a calendar.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookingId: string }> },
): Promise<Response> {
  const { bookingId } = await params;
  const booking = await getBooking(bookingId);

  if (!booking || booking.status !== "paid" || !booking.instance?.startDate) {
    return new Response("Not found", { status: 404 });
  }

  const settings = await getSiteSettings();
  const venue = booking.instance.venue;
  const address = venue?.address ?? settings.address;

  const location = [
    venue?.name ?? `${settings.name}, ${settings.address.city} campus`,
    address.line1,
    address.line2,
    `${address.city} ${address.postalCode}`,
  ]
    .filter(Boolean)
    .join(", ");

  const start = booking.instance.startDate;
  // DTEND on an all-day event is exclusive: a one-day course on the 12th ends on the 13th, and
  // getting this wrong is the classic off-by-one that shows the batch a day short.
  const lastDay = booking.instance.endDate ?? start;
  const end = addOneDay(lastDay);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Espresso Academy India//Booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:booking-${booking.id}@espressoacademy.in`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART;VALUE=DATE:${compact(start)}`,
    `DTEND;VALUE=DATE:${compact(end)}`,
    `SUMMARY:${escapeText(booking.course?.title ?? "Espresso Academy India")}`,
    `LOCATION:${escapeText(location)}`,
    `DESCRIPTION:${escapeText(description(booking, settings.phonePrimary))}`,
    `URL:${absoluteUrl(`/booking/${booking.id}`)}`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(`${booking.course?.title ?? "Your course"} starts tomorrow`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  // RFC 5545 wants CRLF, and several calendar clients genuinely refuse a file with bare LF.
  const body = lines.map(fold).join("\r\n") + "\r\n";

  return new Response(body, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="espresso-academy-${booking.id}.ics"`,
      "cache-control": "no-store",
    },
  });
}

function description(
  booking: NonNullable<Awaited<ReturnType<typeof getBooking>>>,
  phone: string,
): string {
  return [
    `Your seat on ${booking.course?.title ?? "the course"} at Espresso Academy India.`,
    booking.instance?.schedule ? `Schedule: ${booking.instance.schedule}` : null,
    `Booking reference: ${booking.id}`,
    `Questions: ${phone}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** "2026-10-12" to "20261012". */
function compact(isoDate: string): string {
  return isoDate.slice(0, 10).replace(/-/g, "");
}

function addOneDay(isoDate: string): string {
  const date = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function stamp(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

/** Backslash, semicolon, comma and newline all have meaning in a property value. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** RFC 5545 folds at 75 octets, with a space starting each continuation line. */
function fold(line: string): string {
  if (Buffer.byteLength(line, "utf8") <= 75) return line;
  const out: string[] = [];
  let current = "";
  for (const char of line) {
    if (Buffer.byteLength(current + char, "utf8") > (out.length === 0 ? 75 : 74)) {
      out.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  out.push(current);
  return out.join("\r\n ");
}
