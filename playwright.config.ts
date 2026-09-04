import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

/**
 * The suite runs against a production build, because that is what the client and the crawlers
 * see: dev mode changes hydration timing, skips the font preload and serves unoptimised images.
 */
export default defineConfig({
  testDir: "./tests/e2e",
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
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "webkit", use: { ...devices["Desktop Safari"], viewport: { width: 1280, height: 800 } } },
    { name: "Pixel 7", use: { ...devices["Pixel 7"] } },
    { name: "iPhone 14", use: { ...devices["iPhone 14"] } },
    /* 768 is the middle width design.md names, and it was the one nothing covered: a design review
       found a crushed header and a 17px document overflow living there while 390 and 1280 were
       clean the whole time. */
    { name: "iPad Mini", use: { ...devices["iPad Mini"] } },
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
