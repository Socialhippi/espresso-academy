import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/Container";
import { PageSections } from "@/components/sections/PageSections";
import { getCourses, getLandingPage, getLandingPageSlugs, getSiteSettings } from "@/lib/content";
import { formatDate } from "@/lib/format";

/**
 * A campaign landing page.
 *
 * Always `noindex`. These duplicate the course pages by design, they are written for one audience
 * arriving from one ad, and an indexed duplicate would compete in search with the page it was
 * copied from. The schema locks the field on and this asserts it again, because "we meant to set
 * noindex" is not a defence once Google has both.
 *
 * No canonical to the course page either: a canonical would ask Google to consolidate the two,
 * which is the opposite of keeping a campaign page out of the index entirely.
 */
/**
 * Rendered per request so it can carry a CSP nonce.
 *
 * This page takes a name, a phone number and an email address, and src/middleware.ts gives every
 * input-taking route the strict policy. A statically generated page's HTML is fixed at build time
 * and cannot carry a per-request nonce, so the two are incompatible; a form page is where the
 * stricter of the two is worth the render.
 */
export const dynamic = "force-dynamic";

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return (await getLandingPageSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/lp/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getLandingPage(slug);
  return {
    title: page?.title ?? "Espresso Academy India",
    robots: { index: false, follow: false },
  };
}

export default async function LandingPage({ params }: PageProps<"/lp/[slug]">) {
  const { slug } = await params;
  const [page, courses, settings] = await Promise.all([
    getLandingPage(slug),
    getCourses(),
    getSiteSettings(),
  ]);
  if (!page) notFound();

  const courseOptions = courses.map((course) => ({
    slug: course.slug,
    title: course.title,
    batches: course.instances
      .filter((instance) => instance.startDate !== null)
      .map((instance) => ({ id: instance.id, label: formatDate(instance.startDate) })),
  }));

  /*
   * UTM parameters are read in the browser by the form, from `window.location.search`, and sent
   * with the lead. They are deliberately not read here: doing so would make every campaign page
   * dynamic, so a page whose whole job is to load fast for paid traffic would lose its static
   * render to a query string that only the form cares about.
   */
  return (
    /* No <main> here: the root layout already opens one, and a second would give the page two
       main landmarks. The chrome around it is gated off by SiteChrome. */
    <>
      <Container className="pt-10 md:pt-16">
        <h1 className="type-h1 text-black">{page.title}</h1>
      </Container>

      <PageSections
        sections={page.sections}
        courses={courseOptions}
        replyPromise={settings.replyPromise}
        turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        startAt={1}
      />

      {/* No JSON-LD. Structured data on a page you have just asked a crawler not to keep is
          telling it about a page it should not have, and any of it would duplicate the course
          page's. */}
    </>
  );
}
