import type { BrowserContext, Page, TestInfo } from "@playwright/test";
import manifest from "../routes.json";

export interface RouteEntry {
  path: string;
  name: string;
  index: boolean;
  stickyBar: boolean;
  breadcrumbs: boolean;
}

/** Every indexable HTML route the site ships. */
export const routes: RouteEntry[] = manifest.routes;

/** Indexable routes plus the noindex component gallery. */
export const allRoutes: RouteEntry[] = [...manifest.routes, ...manifest.nonIndexedRoutes];

/** The phone projects: the sticky bar, the sheet and the 390px rules apply to these. */
export function isMobileProject(testInfo: TestInfo): boolean {
  return testInfo.project.name === "Pixel 7" || testInfo.project.name === "iPhone 14";
}


/** Parse every JSON-LD block on the page. Throws if any block is not valid JSON. */
export async function readJsonLd(page: Page): Promise<unknown[]> {
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  return blocks.map((block) => JSON.parse(block) as unknown);
}

/** Collect every @type present across a page's JSON-LD, flattening @graph. */
export function typesIn(blocks: unknown[]): string[] {
  const types: string[] = [];
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (node && typeof node === "object") {
      const record = node as Record<string, unknown>;
      if (typeof record["@type"] === "string") types.push(record["@type"]);
      if (Array.isArray(record["@graph"])) record["@graph"].forEach(visit);
    }
  };
  blocks.forEach(visit);
  return types;
}

/**
 * The document's horizontal overflow, ignoring content correctly contained by a scroll container.
 */
export async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
}

/**
 * Waits until a form's controlled fields will actually keep what is typed into them. Before React
 * attaches, the markup accepts input and then discards it on the first render.
 */
export async function waitForHydratedForm(page: Page, formSelector = "form"): Promise<void> {
  await page.locator(`${formSelector}[data-hydrated="true"]`).first().waitFor({ state: "attached" });
}

/**
 * Records the consent choice up front, the way a returning visitor arrives. The banner is a fixed
 * bar across the bottom of the viewport, so without this it sits over the lower part of a form and
 * intercepts clicks: real behaviour, but not what most of these tests are measuring.
 */
export async function acceptConsent(context: BrowserContext, baseURL: string): Promise<void> {
  const url = new URL(baseURL);
  await context.addCookies([
    {
      name: "ea-consent",
      value: "accepted",
      domain: url.hostname,
      path: "/",
      expires: Math.floor(Date.now() / 1000) + 60 * 60,
      sameSite: "Lax",
    },
  ]);
}
