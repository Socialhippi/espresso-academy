import type { Metadata, Viewport } from "next";
import { bebasNeue, montserrat } from "@/lib/fonts";
import { siteUrl } from "@/lib/env";
import { siteSettings } from "@/lib/content";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Barista & Coffee Courses in Bengaluru | Espresso Academy India",
    template: "%s | Espresso Academy India",
  },
  description:
    "Espresso Academy India teaches barista, latte art, brewing, roasting and cupping in Bengaluru. Official Partner of Espresso Academy, Florence.",
  applicationName: siteSettings.name,
};

export const viewport: Viewport = {
  themeColor: "#FEFCFF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${montserrat.variable} ${bebasNeue.variable}`}>
      <body>{children}</body>
    </html>
  );
}
