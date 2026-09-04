/**
 * Formatting helpers. Every one has a defined output for null, because the client has not
 * supplied fees, durations or dates yet and the site must show a TBC state, never a guess.
 */
import { siteSettings } from "@content/data";
import { whatsappNumberOverride } from "@/lib/public-env";

export const TBC_TITLE = "To be confirmed by the academy";

const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** "Fee: TBC" when null, otherwise "₹25,300 incl. GST". */
export function formatFee(feeInclGst: number | null): string {
  if (feeInclGst === null) return "Fee: TBC";
  return `${formatFeeAmount(feeInclGst)} incl. GST`;
}

/** Just the figure, for the Bebas numeral on a card. "TBC" when null. */
export function formatFeeAmount(feeInclGst: number | null): string {
  if (feeInclGst === null) return "TBC";
  return rupees.format(feeInclGst);
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

/** The WhatsApp number in use: the env override when set, otherwise the one in siteSettings. */
export function whatsappNumber(): string {
  return whatsappNumberOverride ?? siteSettings.whatsappNumber;
}

/** "+91 94481 06100" from "+919448106100", for display only. */
export function formatPhone(e164: string): string {
  const match = /^\+(\d{1,3})(\d{5})(\d{5})$/.exec(e164);
  if (!match) return e164;
  return `+${match[1]} ${match[2]} ${match[3]}`;
}

export interface WhatsAppMessageOptions {
  /** Course title, e.g. "Barista Skills, Foundation". */
  course?: string | null;
  /** Batch start date, ISO or already formatted. */
  batch?: string | null;
  /** Overrides the generated message entirely. */
  message?: string;
}

/** The pre-filled message text, without URL encoding. */
export function whatsappMessage({ course, batch, message }: WhatsAppMessageOptions = {}): string {
  if (message) return message;
  const subject = course ? course : "a course at Espresso Academy India";
  const when = batch ? ` on ${batch.includes("-") ? formatDate(batch) : batch}` : "";
  return `Hi, I'm interested in ${subject}${when}. Please share fees and next batch.`;
}

/** https://wa.me/<number>?text=<url-encoded pre-filled message> */
export function whatsappUrl(options: WhatsAppMessageOptions = {}): string {
  const text = encodeURIComponent(whatsappMessage(options));
  return `https://wa.me/${whatsappNumber()}?text=${text}`;
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
