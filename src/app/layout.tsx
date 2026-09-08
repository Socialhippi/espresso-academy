import type { Metadata, Viewport } from "next";
import { bebasNeue, montserrat } from "@/lib/fonts";
import { siteUrl } from "@/lib/env";
import {
  courseCta,
  feeForInstance,
  getCourses,
  getNextInstanceForCourse,
  getSiteSettings,
} from "@/lib/content";
import { formatDate, formatFee } from "@/lib/format";
import { SkipLink } from "@/components/site/SkipLink";
import { SiteChrome } from "@/components/site/SiteChrome";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { StickyBar, type CourseBarEntry } from "@/components/site/StickyBar";
import { ConsentBanner } from "@/components/site/ConsentBanner";
import { JsonLd } from "@/components/site/JsonLd";
import { graph, organisationGraph } from "@/lib/seo/schema";
import { SiteConfigProvider } from "@/lib/site-config";
import { Analytics } from "@/components/site/Analytics";
import { PageViewTracker } from "@/components/site/PageViewTracker";
import { ClickTracker } from "@/components/site/ClickTracker";
import { consentModeSnippet } from "@/lib/analytics/consent-mode";
import "./globals.css";

/**
 * `metadata` is a static export: it is read before any request, so it cannot await Sanity. The
 * academy's name is the one value here that is fixed by the brand rather than editable, so it is a
 * constant. Everything else on this object is either derived from the URL or a literal already.
 */
const SITE_NAME = "Espresso Academy India";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Barista & Coffee Courses in Bengaluru | Espresso Academy India",
    template: "%s | Espresso Academy India",
  },
  description:
    "The Italian Barista Course in Bengaluru: roasting, brewing, espresso and latte art. Official Partner of Espresso Academy, Florence, teaching coffee since 2007.",
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  formatDetection: { telephone: true, address: false, email: false },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: SITE_NAME,
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
async function buildCourseBar(): Promise<Record<string, CourseBarEntry>> {
  const entries: Record<string, CourseBarEntry> = {};
  for (const course of await getCourses()) {
    /*
     * The bar has to describe the batch its own button points at. It was reading the soonest batch
     * for the date and the course for the fee, while the Book button pointed at the soonest
     * *bookable* one — so on a course whose next batch is sold out it read "Fee: TBC · Next batch:
     * 5 Sept" beside a button that would have charged for a different batch entirely.
     */
    const cta = courseCta(course, course.instances);
    const bookable = cta.instanceId
      ? course.instances.find((instance) => instance.id === cta.instanceId)
      : undefined;
    const shown = bookable ?? getNextInstanceForCourse(course);
    const fee = bookable ? (feeForInstance(course, bookable) ?? course.feeExGst) : course.feeExGst;

    entries[course.slug] = {
      title: course.title,
      feeLabel: formatFee({ exGst: fee, gstRate: course.gstRate }),
      nextDateLabel: shown?.startDate ? formatDate(shown.startDate) : "TBC",
      /* Nothing to say is not worth a line. While both are null the bar would pin
         "Fee: TBC / Next batch: TBC" to the bottom of every course page for the whole scroll. */
      hasFacts: fee !== null || Boolean(shown?.startDate),
      /* The whole decision, not one of its outputs. `cta.label` is already the wording the hero
         uses; the bar shortens it, because a 33%-wide segment cannot hold "Ask about the next
         batch" and the icon beside it. */
      primaryHref: cta.href,
      primaryLabel: cta.kind === "book" || cta.kind === "choose" ? "Book" : "Ask",
      primaryEvent: `${cta.event}_sticky`,
    };
  }
  return entries;
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSiteSettings();
  const courseBar = await buildCourseBar();

  const courseLevels = Object.fromEntries(
    (await getCourses()).map((course) => [course.slug, course.level]),
  );

  return (
    <html lang="en-IN" className={`${montserrat.variable} ${bebasNeue.variable}`}>
      <head>
        {/*
          Consent mode v2, inline and before anything else.

          It has to execute before GTM loads or the container fires its tags once with no consent
          state and again after the update, which is the double-count consent mode exists to
          prevent. An imported module would run after the parser reached the GTM tag, so this is a
          literal script in the head. Everything defaults to denied; see src/lib/analytics/consent-mode.ts.
        */}
        <script
          id="consent-mode"
          dangerouslySetInnerHTML={{ __html: consentModeSnippet() }}
        />
      </head>
      {/* The bottom padding clears the fixed mobile sticky bar. It sits on the body, not on
          main, so it also clears the footer, which renders after main. */}
      <body className="flex min-h-dvh flex-col bg-white pb-28 text-black md:pb-0">
        <SiteConfigProvider
          value={{
            name: settings.name,
            whatsappNumber: settings.whatsappNumber,
            whatsappText: settings.whatsappText,
            phonePrimary: settings.phonePrimary,
            phoneSecondary: settings.phoneSecondary,
            replyPromise: settings.replyPromise,
          }}
        >
          <SkipLink />
          {/* Campaign pages at /lp/* supply their own minimal header, so the site's is gated
              rather than rendered twice. See src/components/site/SiteChrome.tsx. */}
          <SiteChrome>
            <Header />
          </SiteChrome>
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteChrome>
            <Footer />
          </SiteChrome>
          <StickyBar courseBar={courseBar} />
          <ConsentBanner />
          <PageViewTracker courseLevels={courseLevels} />
          <ClickTracker />
          <Analytics
            gtmId={process.env.NEXT_PUBLIC_GTM_ID}
            metaPixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID}
          />
          {/* Site-wide graph: the academy, the campus and the site. Page graphs reference it by @id. */}
          <JsonLd id="site-jsonld" data={graph(await organisationGraph())} />
        </SiteConfigProvider>
      </body>
    </html>
  );
}
