import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { CallButton } from "@/components/site/CallButton";
import { JsonLd } from "@/components/site/JsonLd";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { getCourses, siteSettings } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { pageMetadata } from "@/lib/seo/metadata";
import { graph, webPageNode } from "@/lib/seo/schema";

const DESCRIPTION =
  "Ask about a barista or coffee course at the Bengaluru campus. Send your name and number and the academy replies with the fee incl. GST and the next batch date.";

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
  const params = await searchParams;
  const courseOptions = getCourses().map((course) => ({
    slug: course.slug,
    title: course.title,
    batches: course.instances
      .filter((instance) => instance.startDate !== null)
      .map((instance) => formatDate(instance.startDate)),
  }));

  return (
    <>
      <Container className="py-10 md:py-16">
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-5">
            <p className="eyebrow">Enrolment</p>
            <h1 className="mt-3 type-h1 text-black">Ask about a seat</h1>
            <p className="mt-5 measure type-body text-grey">
              Two fields and you are done. A trainer reads it and replies with the fee incl. GST,
              the next batch date and a straight answer on whether the course you picked is the
              right starting point for you.
            </p>

            <p className="mt-8 hairline pt-6 type-small text-grey">
              {/* TODO(client): siteSettings.replyPromise is null, so no reply time is promised. */}
              {siteSettings.replyPromise ?? "We reply on WhatsApp during academy hours."}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <WhatsAppButton size="sm" event="whatsapp_click_enquire">
                Or ask on WhatsApp
              </WhatsAppButton>
              <CallButton size="sm" />
            </div>
          </div>

          <div className="md:col-span-7">
            <EnquiryForm
              variant="student"
              courses={courseOptions}
              replyPromise={siteSettings.replyPromise}
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
