import { expect, test } from "@playwright/test";
import { claimNotification, releaseNotification, type ClaimClient } from "@/lib/notification-claim";

/**
 * The race that sent nobody an email.
 *
 * Two callers mark a booking paid — the browser's verify call and the `payment.captured` webhook —
 * and either can arrive first. The confirmation used to be sent from one branch of one of them, so
 * whichever ordering the network chose decided whether a student heard anything at all.
 *
 * These tests drive all three orderings against a fake Sanity document, because the real thing can
 * only be exercised by making a payment and hoping the network cooperates. The fake models the one
 * property the correctness argument rests on: a patch carrying `ifRevisionID` fails if the
 * document has moved since it was read, and every write moves the revision.
 */

/** A single Sanity document with optimistic concurrency, and a count of what was sent. */
function fakeBooking(initial: { notifiedAt?: string | null } = {}) {
  const doc: { _rev: string; notifiedAt: string | null } = {
    _rev: "rev-0",
    notifiedAt: initial.notifiedAt ?? null,
  };
  let revision = 0;
  const conflicts: string[] = [];

  const client: ClaimClient = {
    async fetch<T>(): Promise<T> {
      return { _rev: doc._rev, notifiedAt: doc.notifiedAt } as T;
    },
    patch(_id: string, options?: { ifRevisionID?: string }) {
      const apply = (mutate: () => void) => ({
        async commit() {
          if (options?.ifRevisionID && options.ifRevisionID !== doc._rev) {
            conflicts.push(options.ifRevisionID);
            const error = new Error("revision mismatch") as Error & { statusCode: number };
            error.statusCode = 409;
            throw error;
          }
          mutate();
          revision += 1;
          doc._rev = `rev-${revision}`;
          return {};
        },
      });
      return {
        set: (fields: Record<string, unknown>) =>
          apply(() => {
            if ("notifiedAt" in fields) doc.notifiedAt = fields.notifiedAt as string;
          }),
        unset: (fields: string[]) =>
          apply(() => {
            if (fields.includes("notifiedAt")) doc.notifiedAt = null;
          }),
      };
    },
  };

  return { doc, client, conflicts };
}

/**
 * One send per caller that holds the claim. The counters stand in for the two emails: `notify`
 * sends both together, so a caller that wins sends one of each and a caller that loses sends
 * neither.
 */
async function attemptNotification(
  client: ClaimClient,
  bookingId: string,
  counters: { student: number; academy: number },
  deliver = true,
) {
  const claim = await claimNotification(client, bookingId);
  if (claim !== "claimed") return claim;
  if (!deliver) {
    await releaseNotification(client, bookingId);
    return "send-failed";
  }
  counters.student += 1;
  counters.academy += 1;
  return "sent";
}

test.describe("exactly one notification per booking", () => {
  test("verify wins: the webhook arrives second and sends nothing", async () => {
    const { client, doc } = fakeBooking();
    const counters = { student: 0, academy: 0 };

    const first = await attemptNotification(client, "booking-1", counters);
    const second = await attemptNotification(client, "booking-1", counters);

    expect(first).toBe("sent");
    expect(second).toBe("already-notified");
    expect(counters).toEqual({ student: 1, academy: 1 });
    expect(doc.notifiedAt).not.toBeNull();
  });

  test("webhook wins: the verify call arrives second and sends nothing", async () => {
    const { client, doc } = fakeBooking();
    const counters = { student: 0, academy: 0 };

    const webhook = await attemptNotification(client, "booking-2", counters);
    const verify = await attemptNotification(client, "booking-2", counters);

    expect(webhook).toBe("sent");
    expect(verify).toBe("already-notified");
    expect(counters).toEqual({ student: 1, academy: 1 });
    expect(doc.notifiedAt).not.toBeNull();
  });

  test("dead heat: both read null, and still only one sends", async () => {
    const { client, doc } = fakeBooking();
    const counters = { student: 0, academy: 0 };

    /*
     * Started together and interleaved by the event loop, so both reach the read before either
     * reaches the write. This is the case a plain `if (!notifiedAt) send()` fails: both see null,
     * both send, and the student gets two emails. One of these two must lose on the revision
     * precondition.
     */
    const [a, b] = await Promise.all([
      attemptNotification(client, "booking-3", counters),
      attemptNotification(client, "booking-3", counters),
    ]);

    expect([a, b].filter((r) => r === "sent")).toHaveLength(1);
    expect([a, b].filter((r) => r === "already-notified")).toHaveLength(1);
    expect(counters).toEqual({ student: 1, academy: 1 });
    expect(doc.notifiedAt).not.toBeNull();
  });

  test("ten concurrent callers still produce one email each", async () => {
    const { client } = fakeBooking();
    const counters = { student: 0, academy: 0 };

    const results = await Promise.all(
      Array.from({ length: 10 }, () => attemptNotification(client, "booking-4", counters)),
    );

    expect(results.filter((r) => r === "sent")).toHaveLength(1);
    expect(counters).toEqual({ student: 1, academy: 1 });
  });

  test("a second delivery of the same webhook event sends nothing", async () => {
    /* The document already carries notifiedAt: this is a redelivery, minutes or hours later. */
    const { client, doc } = fakeBooking({ notifiedAt: "2026-09-18T05:00:00.000Z" });
    const counters = { student: 0, academy: 0 };

    const redelivery = await attemptNotification(client, "booking-5", counters);

    expect(redelivery).toBe("already-notified");
    expect(counters).toEqual({ student: 0, academy: 0 });
    /* And it did not move the timestamp: the record still says when the student was actually told. */
    expect(doc.notifiedAt).toBe("2026-09-18T05:00:00.000Z");
  });
});

test.describe("a failed send stays retryable", () => {
  test("nothing delivered releases the claim, and the retry gets through", async () => {
    const { client, doc } = fakeBooking();
    const counters = { student: 0, academy: 0 };

    const failed = await attemptNotification(client, "booking-6", counters, false);
    expect(failed).toBe("send-failed");
    expect(counters).toEqual({ student: 0, academy: 0 });
    /* The point of releasing: an un-notified booking must not look notified. */
    expect(doc.notifiedAt).toBeNull();

    const retry = await attemptNotification(client, "booking-6", counters, true);
    expect(retry).toBe("sent");
    expect(counters).toEqual({ student: 1, academy: 1 });
  });

  test("a claim released by one caller can be taken by the other", async () => {
    const { client } = fakeBooking();
    const counters = { student: 0, academy: 0 };

    // The webhook claims, fails to send, releases.
    await attemptNotification(client, "booking-7", counters, false);
    // The verify call, arriving later, finds it free and delivers.
    const verify = await attemptNotification(client, "booking-7", counters, true);

    expect(verify).toBe("sent");
    expect(counters).toEqual({ student: 1, academy: 1 });
  });
});

test.describe("degenerate inputs", () => {
  test("no write client is reported, not thrown", async () => {
    expect(await claimNotification(null, "booking-8")).toBe("no-write-access");
  });

  test("a booking that does not exist is reported, not thrown", async () => {
    const client: ClaimClient = {
      async fetch<T>(): Promise<T> {
        return null as T;
      },
      patch() {
        throw new Error("must not patch a booking that does not exist");
      },
    };
    expect(await claimNotification(client, "missing")).toBe("not-found");
  });
});
