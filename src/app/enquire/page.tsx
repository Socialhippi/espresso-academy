import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { CallButton } from "@/components/site/CallButton";
import { JsonLd } from "@/components/site/JsonLd";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { getCourses, getSiteSettings } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { pageMetadata } from "@/lib/seo/metadata";
import { graph, webPageNode } from "@/lib/seo/schema";

const DESCRIPTION =
  "Ask about a course at the Bengaluru campus. Send your name and number and the academy replies with the fee, the next batch date and whether it is the right starting point.";

export const metadata: Metadata = pageMetadata({
  title: "Enquire About a Barista Course",
  description: DESCRIPTION,
  path: "/enquire",
});

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * The conversion page. Everything not needed to send an enquiry is left off: no section
 * navigation, no related links, no sticky bar (see routesWithoutStickyBar in src/lib/nav.ts).
 * The only ways out are the form, WhatsApp and the phone.
 */
export default async function EnquirePage({ searchParams }: PageProps<"/enquire">) {
  const settings = await getSiteSettings();
  const params = await searchParams;
  const courseOptions = (await getCourses()).map((course) => ({
    slug: course.slug,
    title: course.title,
    batches: course.instances
      .filter((instance) => instance.startDate !== null)
      .map((instance) => ({ id: instance.id, label: formatDate(instance.startDate) })),
  }));

  return (
    <>
      <Container className="py-10 md:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <p className="eyebrow">Enquiry</p>
            <h1 className="mt-3 type-h1 text-black">Ask about a seat</h1>
            <p className="mt-5 measure type-body text-grey">
              Name and number are enough. The academy reads it and replies with the fee,
              the next batch date and a straight answer on whether the course you picked is the
              right starting point for you.
            </p>

            {/* The reply promise is not repeated here: the form states it directly above its
                submit button, which is where it is actually load-bearing. */}
            <div className="mt-8 hairline flex flex-col gap-4 pt-6 sm:flex-row sm:flex-wrap">
              <WhatsAppButton size="sm" event="whatsapp_click_enquire">
                Or ask on WhatsApp
              </WhatsAppButton>
              <CallButton phone={settings.phonePrimary} size="sm" />
            </div>
          </div>

          <div className="lg:col-span-7">
            <EnquiryForm
              turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              variant="student"
              courses={courseOptions}
              replyPromise={settings.replyPromise}
              defaultCourse={firstValue(params.course) ?? ""}
              defaultBatch={firstValue(params.batch) ?? ""}
            />
          </div>
        </div>
      </Container>

      <JsonLd
        id="enquire-jsonld"
        data={graph([webPageNode("/enquire", "Ask about a seat", DESCRIPTION)])}
      />
    </>
  );
}
