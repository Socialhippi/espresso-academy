"use client";

/**
 * The handful of settings a Client Component needs.
 *
 * Reason for the boundary: the sticky bar, the mobile sheet, both forms and the error boundary all
 * need the academy's phone number and WhatsApp text, and none of them can `await` Sanity. Passing
 * them down as props would thread the same five values through six components that otherwise take
 * none, and the error boundary has no server parent to thread them from at all.
 *
 * Only public values are in here. It is serialised into the HTML, so anything private would be
 * published. The provider is mounted once, in the root layout, from `getSiteSettings()`.
 */
import { createContext, useContext, type ReactNode } from "react";

export interface SiteConfig {
  name: string;
  /** Digits with country code and no plus. */
  whatsappNumber: string;
  /** The academy's message template, with {course} and {batch} placeholders. */
  whatsappText: string | null;
  phonePrimary: string;
  phoneSecondary: string | null;
  replyPromise: string | null;
}

/**
 * The fallback exists so a Client Component rendered outside the provider (a unit test, a Storybook
 * frame) renders rather than throwing. It carries no number, so a WhatsApp link built from it is
 * visibly broken rather than quietly pointing at the wrong handset.
 */
const FALLBACK: SiteConfig = {
  name: "Espresso Academy India",
  whatsappNumber: "",
  whatsappText: null,
  phonePrimary: "",
  phoneSecondary: null,
  replyPromise: null,
};

const SiteConfigContext = createContext<SiteConfig>(FALLBACK);

export function SiteConfigProvider({
  value,
  children,
}: {
  value: SiteConfig;
  children: ReactNode;
}) {
  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
}

export function useSiteConfig(): SiteConfig {
  return useContext(SiteConfigContext);
}
