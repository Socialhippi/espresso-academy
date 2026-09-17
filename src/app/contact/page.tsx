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
import { getCourses, getSiteSettings } from "@/lib/content";
import { formatDate, formatPhone, telHref } from "@/lib/format";
import { absoluteUrl } from "@/lib/env";
import { pageMetadata } from "@/lib/seo/metadata";
import { graph, schemaIds, webPageNode } from "@/lib/seo/schema";

const DESCRIPTION =
  "Espresso Academy India is at Plot No. 9, Microexcel Plaza, 72, 80 Feet Road, RMV 2nd Stage, near Ramaiah Hospital, Bengaluru 560094. Phone, WhatsApp and directions.";

export const metadata: Metadata = pageMetadata({
  title: "Contact and Campus, Bengaluru",
  description: DESCRIPTION,
  path: "/contact",
});

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const settings = await getSiteSettings();
  const params = await searchParams;
  const cafeTopic = firstValue(params.topic) === "cafe";

  const courseOptions = (await getCourses()).map((course) => ({
    slug: course.slug,
    title: course.title,
    batches: course.instances
      .filter((instance) => instance.startDate !== null)
      .map((instance) => ({ id: instance.id, label: formatDate(instance.startDate) })),
  }));

  return (
    <>
      <PageHero
        above={<Breadcrumbs items={[{ label: "Contact", href: "/contact" }]} />}
        eyebrow="Contact"
        title="Come and find us in RMV 2nd Stage"
        intro={
          <p>
            The campus is on 80 Feet Road, near Ramaiah Hospital. One number takes both the call
            and the WhatsApp message, and the fastest reply is WhatsApp. Opening hours are 10 am
            to 7 pm, and which days the academy opens is being confirmed.
          </p>
        }
        actions={
          <>
            {/*
              The primary action, first, because there was not one in the first viewport.

              A student arriving from a WhatsApp link lands here, and until now the first red pill
              on the route was the form's own submit at y=3477 on a 390px screen — nine viewports
              down. The hero's only actions were a black WhatsApp button and a secondary outline,
              so design.md's "primary red pill" was absent from the fold on the one route people
              are sent to directly.

              It carries the heading of the section it jumps to, "Send a message", rather than a
              new phrase: that copy is already on this page and this brief does not write more.
            */}
            <ButtonLink href="#cafe" variant="primary" data-event="enquiry_click_contact_hero">
              {/* Both labels are the heading of the section this jumps to, which changes with the
                  same `cafeTopic` flag further down. AudienceDoors sends the cafe door here. */}
              {cafeTopic ? "Train your cafe team" : "Send a message"}
            </ButtonLink>
            <WhatsAppButton event="whatsapp_click_contact" />
            {settings.address.mapsUrl ? (
              <ButtonLink href={settings.address.mapsUrl} variant="secondary" external>
                Open in Google Maps
              </ButtonLink>
            ) : null}
          </>
        }
      />

      <section className="section-y-sm" aria-labelledby="details-heading">
        <Container>
          <div className="hairline pt-6 grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <SectionHeading rule={false}
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
                      {settings.address.line1}
                      <br />
                      {settings.address.line2}
                      <br />
                      {settings.address.city} {settings.address.postalCode},{" "}
                      {settings.address.region}
                    </address>
                    {/* Both numbers in the first line are correct: 9 is the plot and 72 is the
                        building number on 80 Feet Road (content/facts.md line 15). */}
                  </dd>
                </div>

                <div className="border-t border-white-2 py-5">
                  <dt className="type-label text-grey">Phone and WhatsApp</dt>
                  <dd className="mt-2 flex flex-col">
                    {/* One number now. The two older ones are no longer the academy's published
                        contact (content/facts.md line 16) and are gone from the site. */}
                    <a
                      href={telHref(settings.phonePrimary)}
                      data-event="call_click_contact"
                      className="inline-flex min-h-11 items-center type-body text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                    >
                      {formatPhone(settings.phonePrimary)}
                    </a>
                    {settings.phoneSecondary ? (
                      <a
                        href={telHref(settings.phoneSecondary)}
                        data-event="call_click_contact_secondary"
                        className="inline-flex min-h-11 items-center type-body text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                      >
                        {formatPhone(settings.phoneSecondary)}
                      </a>
                    ) : null}
                  </dd>
                </div>

                <div className="border-t border-white-2 py-5">
                  <dt className="type-label text-grey">Message us</dt>
                  <dd className="mt-2">
                    {/* Same number as above, confirmed by the client as the one on WhatsApp. */}
                    <WhatsAppButton size="sm" event="whatsapp_click_contact_details">
                      Message the academy
                    </WhatsAppButton>
                  </dd>
                </div>

                <div className="border-t border-white-2 py-5">
                  <dt className="type-label text-grey">Email</dt>
                  <dd className="mt-2 flex items-center gap-3">
                    {/* TODO(client): open question 6 in content/facts.md. The address is printed
                        exactly as the client wrote it. It looks like a typo, missing the "a" in
                        "academy", and they have been asked; printing a corrected address that
                        might bounce would be worse than printing the one they gave us. */}
                    {settings.email ? (
                      /* min-h-11 like the phone link above it. While `settings.email` was null
                         this cell held a TBC pill, which is not a target; the real address made it
                         a 26px-tall link, under the 44px floor in .claude/rules/a11y.md. */
                      <a
                        href={`mailto:${settings.email}`}
                        className="inline-flex min-h-11 items-center type-body break-all text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                      >
                        {settings.email}
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
                  <dd className="mt-2 flex flex-wrap items-center gap-3">
                    {settings.hours ? (
                      <>
                        <span className="type-body text-black">{settings.hours}</span>
                        {!settings.openingDaysConfirmed && (
                          /* TODO(client): open question 7 in content/facts.md. The hours are
                             confirmed, the days are not, and "Mon to Sat" is a guess about when
                             somebody can turn up at a building. */
                          <>
                            <TbcPill label="Days TBC" />
                            <span className="type-small text-grey">
                              Which days the academy opens is being confirmed. Ask before you make
                              the trip.
                            </span>
                          </>
                        )}
                      </>
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
              {/* `lg:mt-4`: the section hairline spans the container now, and this panel's own top
                  border sat 25px under it at half the width — near enough to read as one rule that
                  had shifted. 16px more separates the panel from the rule above it. */}
              <div
                data-placeholder="true"
                className="relative flex aspect-photo flex-col justify-between overflow-hidden rounded-sm border border-white-2 bg-white-3 p-6 lg:mt-4 md:p-8"
              >
                <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
                  <LogoMark className="h-2/5 w-auto opacity-20" sizes="(min-width: 768px) 160px, 96px" />
                </div>
                <p className="relative eyebrow">
                  <MapPin className="size-4" aria-hidden="true" />
                  The campus
                </p>
                <address className="relative type-h3 text-black not-italic">
                  {settings.address.line1}
                  <br />
                  {settings.address.line2}
                  <br />
                  {settings.address.city} {settings.address.postalCode}
                </address>
                {settings.address.mapsUrl ? (
                  <div className="relative">
                    <ButtonLink
                      href={settings.address.mapsUrl}
                      variant="secondary"
                      size="sm"
                      external
                      data-event="maps_click_contact"
                    >
                      Open in Google Maps
                    </ButtonLink>
                  </div>
                ) : null}
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
          <div className="hairline pt-6 grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <SectionHeading rule={false}
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
                turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                variant={cafeTopic ? "cafe" : "student"}
                courses={courseOptions}
                replyPromise={settings.replyPromise}
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
            {settings.instagram ? (
              <li>
                <a
                  href={settings.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center type-body text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                >
                  Instagram, @espressoacademyindia
                </a>
              </li>
            ) : null}
            {settings.florencePartnerPage ? (
              <li>
                <a
                  href={settings.florencePartnerPage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center type-body text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                >
                  The Espresso Academy partner list, Florence
                </a>
              </li>
            ) : null}
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
