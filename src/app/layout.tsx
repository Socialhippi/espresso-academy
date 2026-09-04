import type { Metadata, Viewport } from "next";
import { bebasNeue, montserrat } from "@/lib/fonts";
import { siteUrl } from "@/lib/env";
import { getCourses, getNextInstanceForCourse, siteSettings } from "@/lib/content";
import { formatDate, formatFee } from "@/lib/format";
import { SkipLink } from "@/components/site/SkipLink";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { StickyBar, type CourseBarEntry } from "@/components/site/StickyBar";
import { ConsentBanner } from "@/components/site/ConsentBanner";
import { JsonLd } from "@/components/site/JsonLd";
import { graph, organisationGraph } from "@/lib/seo/schema";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Barista & Coffee Courses in Bengaluru | Espresso Academy India",
    template: "%s | Espresso Academy India",
  },
  description:
    "Barista, latte art, brewing, roasting and cupping courses in Bengaluru. Official Partner of Espresso Academy, Florence, teaching coffee since 2007.",
  applicationName: siteSettings.name,
  authors: [{ name: siteSettings.name }],
  creator: siteSettings.name,
  publisher: siteSettings.name,
  formatDetection: { telephone: true, address: false, email: false },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: siteSettings.name,
    url: siteUrl,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#FEFCFF",
  width: "device-width",
  initialScale: 1,
};

/**
 * The fee and next-batch labels the mobile sticky bar shows on a course page. Built here on the
 * server so the client bar does not have to import content/data.ts a second time.
 */
function buildCourseBar(): Record<string, CourseBarEntry> {
  const entries: Record<string, CourseBarEntry> = {};
  for (const course of getCourses()) {
    const next = getNextInstanceForCourse(course);
    entries[course.slug] = {
      title: course.title,
      feeLabel: formatFee(course.feeInclGst),
      nextDateLabel: next?.startDate ? formatDate(next.startDate) : "TBC",
    };
  }
  return entries;
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${montserrat.variable} ${bebasNeue.variable}`}>
      {/* The bottom padding clears the fixed mobile sticky bar. It sits on the body, not on
          main, so it also clears the footer, which renders after main. */}
      <body className="flex min-h-dvh flex-col bg-white pb-28 text-black md:pb-0">
        <SkipLink />
        <Header />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <StickyBar courseBar={buildCourseBar()} />
        <ConsentBanner />
        {/* Site-wide graph: the academy, the campus and the site. Page graphs reference it by @id. */}
        <JsonLd id="site-jsonld" data={graph(organisationGraph())} />
      </body>
    </html>
  );
}
