#!/usr/bin/env node
/**
 * Create, update or list the Razorpay webhook, from the API rather than the dashboard.
 *
 * The dashboard is not always reachable: a Razorpay account in onboarding has most of it locked,
 * and the webhook page is one of the locked ones. The API works throughout, and it is also the
 * thing to reach for at launch, when the same webhook has to be created a second time against the
 * live keys with a different secret.
 *
 *   node scripts/razorpay-webhook.mjs --list      show every webhook on the account
 *   node scripts/razorpay-webhook.mjs             create it, or update it if the URL already exists
 *   node scripts/razorpay-webhook.mjs --url <u>   override the URL (defaults to the production alias)
 *
 * Reads RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET from .env.local. The
 * secret is never printed: it is what makes a forged delivery detectable, and a terminal scrollback
 * is not a secret store.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const DEFAULT_URL = "https://espresso-academy-india.vercel.app/api/webhooks/razorpay";

/**
 * The events this site's handler acts on. Anything else Razorpay sends is answered with a 200 and
 * ignored, so a wider selection does no harm; a narrower one means a seat is never taken.
 */
const EVENTS = ["payment.captured", "payment.failed", "refund.processed"];

function loadEnvLocal() {
  const env = {};
  try {
    const text = readFileSync(join(ROOT, ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const match = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim());
      if (!match) continue;
      env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    // Not fatal: the values may be in the real environment instead, which is the CI case.
  }
  return { ...env, ...process.env };
}

const env = loadEnvLocal();
const keyId = env.RAZORPAY_KEY_ID?.trim();
const keySecret = env.RAZORPAY_KEY_SECRET?.trim();
const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET?.trim();

if (!keyId || !keySecret) {
  console.error("Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET. Set them in .env.local.");
  process.exit(1);
}

const auth = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");

async function api(method, path, body) {
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    method,
    headers: { authorization: auth, "content-type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { raw: text };
  }
  return { ok: response.ok, status: response.status, body: parsed };
}

function describe(hook) {
  const events = Array.isArray(hook.events)
    ? hook.events
    : Object.entries(hook.events ?? {})
        .filter(([, on]) => on)
        .map(([name]) => name);
  return [
    `  id       ${hook.id}`,
    `  url      ${hook.url}`,
    `  active   ${hook.active === true || hook.active === "true" ? "yes" : String(hook.active)}`,
    `  secret   ${hook.secret_exists ? "set" : "NOT SET — deliveries cannot be verified"}`,
    `  events   ${events.sort().join(", ") || "(none)"}`,
  ].join("\n");
}

async function list() {
  const { ok, status, body } = await api("GET", "/webhooks?count=100");
  if (!ok) {
    console.error(`Could not list webhooks (HTTP ${status}):`, JSON.stringify(body));
    process.exit(1);
  }
  const items = body.items ?? [];
  if (items.length === 0) {
    console.log("No webhooks on this account.");
    return items;
  }
  console.log(`${items.length} webhook(s):\n`);
  for (const hook of items) console.log(describe(hook), "\n");
  return items;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--list")) {
    await list();
    return;
  }

  const urlIndex = args.indexOf("--url");
  const url = urlIndex >= 0 ? args[urlIndex + 1] : DEFAULT_URL;

  if (!webhookSecret) {
    console.error(
      "Missing RAZORPAY_WEBHOOK_SECRET. Without it the handler answers 503 and nothing marks a booking paid.",
    );
    process.exit(1);
  }

  const { ok, body: existingBody } = await api("GET", "/webhooks?count=100");
  const existing = ok ? (existingBody.items ?? []).find((hook) => hook.url === url) : undefined;

  const payload = {
    url,
    secret: webhookSecret,
    /*
     * A map, not an array. The v1 API JSON-serialises an array to an object keyed by index and
     * then validates those keys as event names, so `["payment.captured", ...]` comes back as
     * "Invalid event name/names: 1, 2".
     */
    events: Object.fromEntries(EVENTS.map((event) => [event, 1])),
    // Where Razorpay writes when deliveries start failing. Without it a broken webhook is silent.
    ...(env.BOOKING_TO_EMAIL || env.LEAD_TO_EMAIL
      ? { alert_email: (env.BOOKING_TO_EMAIL || env.LEAD_TO_EMAIL).trim() }
      : {}),
  };

  if (existing) {
    console.log(`A webhook for that URL already exists (${existing.id}). Updating it in place.`);
    const result = await api("PUT", `/webhooks/${existing.id}`, payload);
    if (!result.ok) {
      console.error(`Update failed (HTTP ${result.status}):`, JSON.stringify(result.body));
      process.exit(1);
    }
    console.log("Updated:\n");
    console.log(describe(result.body));
  } else {
    const result = await api("POST", "/webhooks", payload);
    if (!result.ok) {
      console.error(`Create failed (HTTP ${result.status}):`, JSON.stringify(result.body));
      process.exit(1);
    }
    console.log("Created:\n");
    console.log(describe(result.body));
  }

  console.log("\nVerifying by listing the account's webhooks:\n");
  await list();
}

main().catch((error) => {
  console.error("Failed:", error);
  process.exit(1);
});
