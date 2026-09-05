import "server-only";

/**
 * The Google Sheets lead mirror.
 *
 * Written against the REST API with a hand-signed service-account JWT rather than through
 * `googleapis`, which is about 20MB installed and pulls in a discovery layer for 300 APIs to make
 * one `values.append` call. This is eighty lines and one `node:crypto` import.
 *
 * Optional, and silent when it is not configured: the enquiry is already in Sanity by the time
 * this runs, and a spreadsheet that is not set up must not cost the academy a lead.
 */
import { createSign } from "node:crypto";
import { escapeForSheet } from "@/lib/sheets-format";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function isSheetsConfigured(): boolean {
  return Boolean(
    env("GOOGLE_SHEETS_ID") && env("GOOGLE_SHEETS_CLIENT_EMAIL") && env("GOOGLE_SHEETS_PRIVATE_KEY"),
  );
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

/** Cached until a minute before it expires; a token is good for an hour. */
let cachedToken: { token: string; expiresAt: number } | null = null;

function base64Url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function getAccessToken(): Promise<string | null> {
  const clientEmail = env("GOOGLE_SHEETS_CLIENT_EMAIL");
  // Vercel's env editor stores the PEM with literal \n, so they are turned back into newlines.
  const privateKey = env("GOOGLE_SHEETS_PRIVATE_KEY")?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) return null;

  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt > now + 60) return cachedToken.token;

  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(
    JSON.stringify({
      iss: clientEmail,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );

  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const signature = base64Url(signer.sign(privateKey));
  const assertion = `${header}.${claim}.${signature}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    signal: AbortSignal.timeout(8000),
  });

  const body: TokenResponse = await response.json();
  if (!response.ok || !body.access_token) {
    throw new Error(`Google token request failed: ${body.error_description ?? body.error ?? response.status}`);
  }

  cachedToken = { token: body.access_token, expiresAt: now + (body.expires_in ?? 3600) };
  return cachedToken.token;
}

export type SheetsResult =
  | { appended: true }
  | { appended: false; reason: "not-configured" | "request-failed"; error?: string };

/**
 * Appends one row to the first sheet in the spreadsheet.
 *
 * `RAW`, not `USER_ENTERED`: `USER_ENTERED` is what makes Sheets parse a value as a formula in the
 * first place, so the escaping above and this option are belt and braces. Both are here because
 * either alone is one config change away from being wrong.
 */
export async function appendRow(values: unknown[]): Promise<SheetsResult> {
  const spreadsheetId = env("GOOGLE_SHEETS_ID");
  if (!spreadsheetId || !isSheetsConfigured()) {
    return { appended: false, reason: "not-configured" };
  }

  try {
    const token = await getAccessToken();
    if (!token) return { appended: false, reason: "not-configured" };

    const range = encodeURIComponent("A1");
    const url =
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}` +
      `/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ values: [values.map(escapeForSheet)] }),
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { appended: false, reason: "request-failed", error: `HTTP ${response.status} ${text.slice(0, 200)}` };
    }

    return { appended: true };
  } catch (error) {
    // A failed token request invalidates the cache: a rotated key must not keep failing for an hour.
    cachedToken = null;
    return {
      appended: false,
      reason: "request-failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/* The escaping and the row shape live in src/lib/sheets-format.ts, which imports nothing, so the
   unit suite can reach them without pulling `server-only` in. Re-exported here because this is
   where a caller looks for them. */
export { escapeForSheet, leadRow } from "@/lib/sheets-format";
