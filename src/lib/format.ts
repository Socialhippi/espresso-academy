/**
 * Formatting helpers. Every one has a defined output for null, because the client has not
 * supplied fees, durations or dates yet and the site must show a TBC state, never a guess.
 */
import { whatsappNumberOverride } from "@/lib/public-env";

export const TBC_TITLE = "To be confirmed by the academy";

const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/**
 * A fee as the site stores it: before GST, with the rate beside it.
 *
 * The rate is nullable and that nullability is the point. content/facts.md gives the fee ex-GST
 * and does not give the rate; 18% is noted there as the usual rate on commercial training, which
 * is an assumption, and an assumption is not something to put in front of somebody about to pay.
 * While `gstRate` is null nothing on the site prints a tax-inclusive total.
 */
export interface Fee {
  /** Whole rupees, before GST. */
  exGst: number | null;
  /** Per cent, e.g. 18. Null while the academy has not confirmed it. */
  gstRate: number | null;
}

/** "+ GST" while the rate is unknown, "incl. GST" once a total can honestly be shown. */
export function feeSuffix(gstRate: number | null): string {
  return gstRate === null ? "+ GST" : "incl. GST";
}

/**
 * The tax-inclusive total, or null while the rate is unconfirmed.
 *
 * Null is not an error state. It is the answer, and every caller has to render it as one rather
 * than falling back to the ex-GST figure with an "incl. GST" label beside it.
 */
export function feeInclGst({ exGst, gstRate }: Fee): number | null {
  if (exGst === null || gstRate === null) return null;
  return Math.round(exGst * (1 + gstRate / 100));
}

/** "Fee: TBC" when null, "₹26,700 + GST" while the rate is unknown, else "₹31,506 incl. GST". */
export function formatFee(fee: Fee): string {
  if (fee.exGst === null) return "Fee: TBC";
  const total = feeInclGst(fee);
  if (total === null) return `${formatFeeAmount(fee.exGst)} + GST`;
  return `${formatFeeAmount(total)} incl. GST`;
}

/** Just the figure, for the Bebas numeral on a card. "TBC" when null. */
export function formatFeeAmount(amount: number | null): string {
  if (amount === null) return "TBC";
  return rupees.format(amount);
}

/** "3 days", "18 hours", "3 days, 18 hours", or "Duration: TBC". */
export function formatDuration(
  durationDays: number | null,
  durationHours: number | null,
): string {
  const parts: string[] = [];
  if (durationDays !== null) parts.push(`${durationDays} ${durationDays === 1 ? "day" : "days"}`);
  if (durationHours !== null) {
    parts.push(`${durationHours} ${durationHours === 1 ? "hour" : "hours"}`);
  }
  return parts.length > 0 ? parts.join(", ") : "Duration: TBC";
}

const TIME_ZONE = "Asia/Kolkata";

const dayMonthYear = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const dayMonth = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  timeZone: TIME_ZONE,
});

const monthYear = new Intl.DateTimeFormat("en-IN", {
  month: "long",
  year: "numeric",
  timeZone: TIME_ZONE,
});

function toDate(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "12 Oct 2026" in Asia/Kolkata. "TBC" when the date is missing or unparseable. */
export function formatDate(iso: string | null): string {
  if (!iso) return "TBC";
  const date = toDate(iso);
  return date ? dayMonthYear.format(date) : "TBC";
}

/** "12 to 14 Oct 2026", collapsing the month when both dates share one. */
export function formatDateRange(startIso: string | null, endIso: string | null): string {
  if (!startIso) return "TBC";
  const start = toDate(startIso);
  if (!start) return "TBC";
  if (!endIso) return dayMonthYear.format(start);
  const end = toDate(endIso);
  if (!end) return dayMonthYear.format(start);
  if (startIso === endIso) return dayMonthYear.format(start);
  const sameMonth =
    start.getUTCFullYear() === end.getUTCFullYear() && start.getUTCMonth() === end.getUTCMonth();
  const left = sameMonth ? String(Number(dayMonth.format(start).split(" ")[0])) : dayMonth.format(start);
  return `${left} to ${dayMonthYear.format(end)}`;
}

/** "October 2026", the grouping key label on /calendar. */
export function formatMonthYear(iso: string): string {
  const date = toDate(iso);
  return date ? monthYear.format(date) : "TBC";
}

/** Sortable "2026-10" key for grouping instances by month. */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/** ISO date only ("2026-10-12"), for <time dateTime> and JSON-LD. */
export function isoDate(iso: string | null): string | undefined {
  if (!iso) return undefined;
  const date = toDate(iso);
  return date ? iso.slice(0, 10) : undefined;
}

/**
 * The WhatsApp number to dial: the env override when set, otherwise the one the caller read from
 * settings.
 *
 * The number used to be a module constant, which worked while it lived in a file the bundler could
 * inline. It comes from Sanity now, and a Client Component cannot await Sanity, so the number is
 * passed in: Server Components read it from `getSiteSettings()`, the two Client Components that
 * need it (the sticky bar and the enquiry form) take it as a prop. `NEXT_PUBLIC_WHATSAPP_NUMBER`
 * still wins when it is set, which is how a staging deployment points at a test handset.
 */
export function whatsappNumber(fromSettings?: string | null): string {
  return whatsappNumberOverride ?? fromSettings ?? "";
}

/** "+91 94481 06100" from "+919448106100", for display only. */
export function formatPhone(e164: string): string {
  const match = /^\+(\d{1,3})(\d{5})(\d{5})$/.exec(e164);
  if (!match) return e164;
  return `+${match[1]} ${match[2]} ${match[3]}`;
}

export interface WhatsAppMessageOptions {
  /** Course title, e.g. "Italian Barista Course (IBC), Basic". */
  course?: string | null;
  /** Batch start date, ISO or already formatted. */
  batch?: string | null;
  /** Overrides the generated message entirely. */
  message?: string;
  /** The number to open, from settings. The env override still wins when it is set. */
  number?: string | null;
  /** The academy's template from settings, with {course} and {batch} placeholders. */
  template?: string | null;
}

/** The pre-filled message text, without URL encoding. */
export function whatsappMessage({
  course,
  batch,
  message,
  template,
}: WhatsAppMessageOptions = {}): string {
  if (message) return message;
  const subject = course ? course : "a course at Espresso Academy India";
  const when = batch ? ` on ${batch.includes("-") ? formatDate(batch) : batch}` : "";
  if (template) {
    return template.replace(/\{course\}/g, subject).replace(/\{batch\}/g, when.trim());
  }
  return `Hi, I'm interested in ${subject}${when}. Please share fees and next batch.`;
}

/** https://wa.me/<number>?text=<url-encoded pre-filled message> */
export function whatsappUrl(options: WhatsAppMessageOptions = {}): string {
  const text = encodeURIComponent(whatsappMessage(options));
  return `https://wa.me/${whatsappNumber(options.number)}?text=${text}`;
}

/** tel: href from an E.164 number. */
export function telHref(e164: string): string {
  return `tel:${e164}`;
}

/** Sentence-cased list for prose, e.g. "a, b and c". */
export function listToSentence(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
