import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

/**
 * The suite runs against a production build, because that is what the client and the crawlers
 * see: dev mode changes hydration timing, skips the font preload and serves unoptimised images.
 */
export default defineConfig({
  testDir: "./tests",
  /* Puts the seeded test batches back to zero seats booked, so a second run starts where the
     first one did. See tests/global-setup.ts. */
  globalSetup: "./tests/global-setup.ts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  timeout: 45_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    // The site is India-facing; dates render in Asia/Kolkata.
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
  },

  projects: [
    /*
     * Pure functions, no browser. The signature checks and the fee arithmetic are what stands
     * between a forged webhook and a booking marked paid, and between a fee and the wrong amount
     * being charged; they deserve tests that run in milliseconds and do not need a page.
     */
    { name: "unit", testDir: "./tests/unit", use: {} },

    /*
     * The push gate. Chromium only, one file, the shortest set of checks that would have caught the
     * failures this project has actually had. The full matrix runs nightly and on demand: half an
     * hour before every commit is a gate people learn to route around.
     */
    {
      name: "smoke",
      testDir: "./tests/smoke",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    /*
     * The payment path, in one project and one worker. It creates orders, fires webhooks and takes
     * seats from a shared batch in a shared dataset; running it in six browser projects at once
     * had them racing each other for the last seat. The read-only half of the checkout coverage
     * (tests/e2e/book-page.spec.ts) still runs everywhere.
     */
    {
      name: "booking",
      testDir: "./tests/booking",
      fullyParallel: false,
      workers: 1,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    { name: "chromium", testDir: "./tests/e2e", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "webkit", testDir: "./tests/e2e", use: { ...devices["Desktop Safari"], viewport: { width: 1280, height: 800 } } },
    { name: "Pixel 7", testDir: "./tests/e2e", use: { ...devices["Pixel 7"] } },
    { name: "iPhone 14", testDir: "./tests/e2e", use: { ...devices["iPhone 14"] } },
    /* 768 is the middle width design.md names, and it was the one nothing covered: a design review
       found a crushed header and a 17px document overflow living there while 390 and 1280 were
       clean the whole time. */
    { name: "iPad Mini", testDir: "./tests/e2e", use: { ...devices["iPad Mini"] } },
    /* 1024 is exactly where the desktop grids and the header nav switch on, and it went the same
       way: the header row measured 1026px against the viewport, clipping the primary call to
       action on every route, while 390, 768 and 1280 stayed clean. A breakpoint's own value is
       the width worth testing, not the comfortable middle of the range above it. */
    { name: "Laptop 1024", testDir: "./tests/e2e", use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 800 } } },
  ],

  webServer: {
    command: "pnpm run build && pnpm run start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
