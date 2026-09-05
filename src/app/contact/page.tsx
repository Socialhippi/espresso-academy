import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { TbcPill } from "@/components/site/TbcPill";
import { LogoMark } from "@/components/site/Logo";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { PageHero } from "@/components/sections/Hero";
import { EnquiryForm } from "@/components/forms/EnquiryForm";
import { getCourses, siteSettings } from "@/lib/content";
import { formatDate, formatPhone, telHref } from "@/lib/format";
import { absoluteUrl } from "@/lib/env";
import { pageMetadata } from "@/lib/seo/metadata";
import { graph, schemaIds, webPageNode } from "@/lib/seo/schema";

const DESCRIPTION =
  "Espresso Academy India is at Microexcel Plaza, 80 Feet Road, RMV 2nd Stage, near Ramaiah Hospital, Bengaluru 560094. Phone numbers, WhatsApp and directions.";

export const metadata: Metadata = pageMetadata({
  title: "Contact and Campus, Bengaluru",
  description: DESCRIPTION,
  path: "/contact",
});

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const params = await searchParams;
  const cafeTopic = firstValue(params.topic) === "cafe";

  const courseOptions = getCourses().map((course) => ({
    slug: course.slug,
    title: course.title,
    batches: course.instances
      .filter((instance) => instance.startDate !== null)
      .map((instance) => formatDate(instance.startDate)),
  }));

  return (
    <>
      <PageHero
        above={<Breadcrumbs items={[{ label: "Contact", href: "/contact" }]} />}
        eyebrow="Contact"
        title="Come and find us in RMV 2nd Stage"
        intro={
          <p>
            The campus is on 80 Feet Road, near Ramaiah Hospital. The fastest reply is WhatsApp;
            the phone is answered during academy hours.
          </p>
        }
        actions={
          <>
            <WhatsAppButton event="whatsapp_click_contact" />
            <ButtonLink href={siteSettings.address.mapsUrl} variant="secondary" external>
              Open in Google Maps
            </ButtonLink>
          </>
        }
      />

      <section className="section-y-sm" aria-labelledby="details-heading">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <SectionHeading
                number="01"
                eyebrow="Campus"
                title="Address and numbers"
                id="details-heading"
              />

              <dl className="mt-8 flex flex-col">
                <div className="border-t border-white-2 py-5">
                  <dt className="type-label text-grey">Address</dt>
                  <dd className="mt-2">
                    <address className="type-body text-black not-italic">
                      {siteSettings.address.line1}
                      <br />
                      {siteSettings.address.line2}
                      <br />
                      {siteSettings.address.city} {siteSettings.address.postalCode},{" "}
                      {siteSettings.address.region}
                    </address>
                    {/* TODO(client): plot number unconfirmed, and the current map pin points at
                        a different building. Both are in docs/STATUS.md. */}
                  </dd>
                </div>

                <div className="border-t border-white-2 py-5">
                  <dt className="type-label text-grey">Phone</dt>
                  <dd className="mt-2 flex flex-col">
                    <a
                      href={telHref(siteSettings.phonePrimary)}
                      data-event="call_click_contact"
                      className="inline-flex min-h-11 items-center type-body text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                    >
                      {formatPhone(siteSettings.phonePrimary)}
                    </a>
                    <a
                      href={telHref(siteSettings.phoneSecondary)}
                      data-event="call_click_contact_secondary"
                      className="inline-flex min-h-11 items-center type-body text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                    >
                      {formatPhone(siteSettings.phoneSecondary)}
                    </a>
                  </dd>
                </div>

                <div className="border-t border-white-2 py-5">
                  <dt className="type-label text-grey">WhatsApp</dt>
                  <dd className="mt-2">
                    {/* TODO(client): siteSettings.whatsappConfirmed is false. Until the academy
                        confirms which number is on WhatsApp, both call and chat use the primary. */}
                    <WhatsAppButton size="sm" event="whatsapp_click_contact_details">
                      Message the academy
                    </WhatsAppButton>
                  </dd>
                </div>

                <div className="border-t border-white-2 py-5">
                  <dt className="type-label text-grey">Email</dt>
                  <dd className="mt-2 flex items-center gap-3">
                    {/* TODO(client): siteSettings.email is null. No address is published. */}
                    {siteSettings.email ? (
                      <a
                        href={`mailto:${siteSettings.email}`}
                        className="type-body text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                      >
                        {siteSettings.email}
                      </a>
                    ) : (
                      <>
                        <TbcPill />
                        <span className="type-small text-grey">
                          No public address yet. Use WhatsApp and you will get the same person.
                        </span>
                      </>
                    )}
                  </dd>
                </div>

                <div className="border-t border-b border-white-2 py-5">
                  <dt className="type-label text-grey">Hours</dt>
                  <dd className="mt-2 flex items-center gap-3">
                    {/* TODO(client): siteSettings.hours is null. */}
                    {siteSettings.hours ? (
                      <span className="type-body text-black">{siteSettings.hours}</span>
                    ) : (
                      <>
                        <TbcPill />
                        <span className="type-small text-grey">
                          Opening hours are being confirmed. Ask and we will tell you today&rsquo;s.
                        </span>
                      </>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="lg:col-span-7">
              {/*
                A static map image is not available and an iframe embed is not used, so this is a
                branded panel with the address set in type. It is a graphic, not a photograph, so
                the "never put text over an image" rule is not in play.
              */}
              <div
                data-placeholder="true"
                className="relative flex aspect-photo flex-col justify-between overflow-hidden rounded-sm border border-white-2 bg-white-3 p-6 md:p-8"
              >
                <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
                  <LogoMark className="h-2/5 w-auto opacity-20" sizes="(min-width: 768px) 160px, 96px" />
                </div>
                <p className="relative eyebrow">
                  <MapPin className="size-4" aria-hidden="true" />
                  The campus
                </p>
                <address className="relative type-h3 text-black not-italic">
                  {siteSettings.address.line1}
                  <br />
                  {siteSettings.address.line2}
                  <br />
                  {siteSettings.address.city} {siteSettings.address.postalCode}
                </address>
                <div className="relative">
                  <ButtonLink
                    href={siteSettings.address.mapsUrl}
                    variant="secondary"
                    size="sm"
                    external
                    data-event="maps_click_contact"
                  >
                    Open in Google Maps
                  </ButtonLink>
                </div>
              </div>

              <div className="mt-6 border border-white-2 p-6">
                <h3 className="type-h3 text-black">Visit the campus</h3>
                <p className="mt-3 measure type-body text-grey">
                  You are welcome to come and look before you book anything. Message the academy
                  first so someone is free to show you around, and ask whether a class is running
                  that day: watching one is worth more than any page on this site.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section
        id="cafe"
        className="section-y-sm bg-white-3"
        aria-labelledby="cafe-heading"
      >
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <SectionHeading
                number="02"
                eyebrow={cafeTopic ? "Cafe training" : "Get in touch"}
                title={cafeTopic ? "Train your cafe team" : "Send a message"}
                id="cafe-heading"
                description={
                  cafeTopic
                    ? "Tell us the cafe, the team size and what you want them to be able to do. You will get options rather than a package."
                    : "For anything that is not about a specific course. For course enquiries, the enrolment form carries the batch and fee context."
                }
              />
              {!cafeTopic && (
                <p className="mt-6">
                  <ButtonLink href="/enquire" variant="tertiary" size="inline">
                    Enquire about a course instead
                  </ButtonLink>
                </p>
              )}
            </div>
            <div className="lg:col-span-7">
              <EnquiryForm
                variant={cafeTopic ? "cafe" : "student"}
                courses={courseOptions}
                replyPromise={siteSettings.replyPromise}
                defaultCourse={firstValue(params.course) ?? ""}
                defaultBatch={firstValue(params.batch) ?? ""}
              />
            </div>
          </div>
        </Container>
      </section>

      <section className="section-y-sm" aria-labelledby="elsewhere-heading">
        <Container>
          <SectionHeading
            number="03"
            eyebrow="Elsewhere"
            title="Find the academy online"
            id="elsewhere-heading"
          />
          <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
            <li>
              <a
                href={siteSettings.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center type-body text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
              >
                Instagram, @espressoacademyindia
              </a>
            </li>
            <li>
              <a
                href={siteSettings.florencePartnerPage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center type-body text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
              >
                The Espresso Academy partner list, Florence
              </a>
            </li>
            <li>
              <Link
                href="/faq"
                className="inline-flex min-h-11 items-center type-body text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
              >
                Questions other students ask
              </Link>
            </li>
          </ul>
        </Container>
      </section>

      <JsonLd
        id="contact-jsonld"
        data={graph([
          webPageNode("/contact", "Contact and campus, Bengaluru", DESCRIPTION),
          {
            "@type": "ContactPage",
            "@id": absoluteUrl("/contact#contactpage"),
            url: absoluteUrl("/contact"),
            about: { "@id": schemaIds.PLACE_ID },
            mainEntity: { "@id": schemaIds.PLACE_ID },
          },
        ])}
      />
    </>
  );
}
