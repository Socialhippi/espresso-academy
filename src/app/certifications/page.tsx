import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { TbcPill } from "@/components/site/TbcPill";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { PageHero } from "@/components/sections/Hero";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { FinalCta } from "@/components/sections/FinalCta";
import { LevelLadder } from "@/components/course/LevelLadder";
import { getCertifications, getCoursesForCertification, getFaqs } from "@/lib/content";
import { pageMetadata } from "@/lib/seo/metadata";
import { faqNode, graph, webPageNode } from "@/lib/seo/schema";

const DESCRIPTION =
  "The Italian Barista Certificate and the SCA Coffee Skills Program compared: who issues each, which levels exist, and which Bengaluru courses lead to them.";

export const metadata: Metadata = pageMetadata({
  title: "Coffee Certifications Explained",
  description: DESCRIPTION,
  path: "/certifications",
});

/** Row labels for the comparison. Every cell traces to content/data.ts or content/facts.md. */
const comparison = [
  {
    label: "Who issues it",
    ibc: "Espresso Academy, Florence. Diplomas are issued in Italy and sent to authorised partner schools.",
    sca: "The Specialty Coffee Association, not the school. The academy teaches training aligned to the program; whether a batch is assessed for SCA certification is confirmed at enrolment.",
  },
  {
    label: "Levels",
    ibc: "Junior, then Advanced.",
    sca: "Foundation, Intermediate, then Professional, across five modules.",
  },
  {
    label: "Who it suits",
    ibc: "People who want one certificate, issued by Espresso Academy, Florence, start to finish.",
    sca: "People who want a modular program they can add to, module by module, over years.",
  },
  {
    label: "What it costs",
    ibc: null,
    sca: null,
  },
  {
    label: "How it fits the ladder",
    ibc: "Two rungs, Junior then Advanced. IBC Junior assumes no machine experience.",
    sca: "Three levels per module. Which level suits you is agreed with the academy first.",
  },
];

export default function CertificationsPage() {
  const certifications = getCertifications();
  const [ibc, sca] = certifications;
  const faqs = getFaqs("certification");

  return (
    <>
      <PageHero
        above={<Breadcrumbs items={[{ label: "Certifications", href: "/certifications" }]} />}
        eyebrow="Certifications"
        title="Which coffee certificate is worth your time"
        intro={
          <p>
            Two certificates run through the courses at the Bengaluru campus. They are issued by
            different bodies, cover different ground and suit different people. This page sets them
            side by side so you can pick on the facts rather than on the acronym.
          </p>
        }
      />

      <section className="section-y-sm" aria-labelledby="compare-heading">
        <Container>
          <SectionHeading
            number="01"
            eyebrow="Side by side"
            title="The two certificates"
            id="compare-heading"
          />

          <div className="mt-8 table-scroll">
            <table className="w-full min-w-2xl border-collapse text-left">
              <caption className="sr-only">
                The Italian Barista Certificate and the SCA Coffee Skills Program compared
              </caption>
              <thead>
                <tr className="border-b border-white-2">
                  <th scope="col" className="w-48 py-4 pr-6 type-label text-grey">
                    <span className="sr-only">What is being compared</span>
                  </th>
                  {certifications.map((certification) => (
                    <th key={certification.slug} scope="col" className="py-4 pr-6 align-bottom">
                      <span className="block type-h3 text-black">{certification.name}</span>
                      <Link
                        href={`/certifications/${certification.slug}`}
                        className="mt-2 inline-flex min-h-11 items-center type-body text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                      >
                        Read the full page
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.label} className="border-b border-white-2 align-top">
                    <th scope="row" className="py-5 pr-6 type-label text-grey">
                      {row.label}
                    </th>
                    <td className="py-5 pr-6 type-small text-black">
                      {/* TODO(client): certification fees are not published. */}
                      {row.ibc ?? <TbcPill label="Fee TBC" />}
                    </td>
                    <td className="py-5 pr-6 type-small text-black">
                      {row.sca ?? <TbcPill label="Fee TBC" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      {/* The honesty clause. .claude/rules/content.md requires it on every certification page. */}
      <section className="section-y-sm bg-white-3" aria-labelledby="honesty-heading">
        <Container>
          <div className="grid gap-10 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-5">
              <SectionHeading
                number="02"
                eyebrow="Straight answer"
                title="What a certificate is actually worth"
                id="honesty-heading"
              />
            </div>
            <div className="md:col-span-7">
              <p className="measure type-h3 text-black">
                A certificate helps you get an interview. Your skills get you the job.
              </p>
              <p className="mt-5 measure type-body text-grey">
                Neither certificate is a licence to practise, and neither replaces what you can do
                on a bar. What an employer tests at a trial shift is whether you can dial in under
                pressure, texture milk consistently and keep a bar moving.
              </p>
              <p className="mt-4 measure type-body text-grey">
                The academy does not publish a list of employers who recognise either certificate,
                and it does not publish a placement rate. Ask before you book if that matters to
                you, including when the answer is that nobody knows.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="section-y-sm" aria-labelledby="courses-heading">
        <Container>
          <SectionHeading
            number="03"
            eyebrow="Courses"
            title="Which courses lead where"
            id="courses-heading"
          />
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            {certifications.map((certification) => {
              const courses = getCoursesForCertification(certification.slug);
              return (
                <div key={certification.slug} className="border border-white-2 p-6 md:p-8">
                  <h3 className="type-h3 text-black">{certification.name}</h3>
                  <ul className="mt-5 flex flex-col gap-3">
                    {courses.map((course) => (
                      <li key={course.slug} className="border-t border-white-2 pt-3">
                        <Link
                          href={`/courses/${course.slug}`}
                          className="inline-flex min-h-11 items-center type-body text-black underline decoration-white-2 underline-offset-4 hover:text-red hover:decoration-red"
                        >
                          {course.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-6 measure type-small text-grey">
                    {certification.recognitionNote}
                  </p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="section-y-sm bg-white-3" aria-labelledby="ladder-heading">
        <Container>
          <div className="grid gap-10 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-4">
              <SectionHeading
                number="04"
                eyebrow="Levels"
                title="The two ladders"
                id="ladder-heading"
                description="Neither ladder depends on the other. The IBC runs at Junior and Advanced; the SCA-aligned training runs at Foundation, Intermediate and Professional."
              />
            </div>
            <div className="md:col-span-8">
              <LevelLadder />
            </div>
          </div>
        </Container>
      </section>

      <section className="section-y-sm" aria-labelledby="certs-faq-heading">
        <Container>
          <div className="grid gap-10 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-4">
              <SectionHeading
                number="05"
                eyebrow="Questions"
                title="About certificates"
                id="certs-faq-heading"
              />
              {ibc && sca && (
                <p className="mt-6 flex flex-col gap-3">
                  <ButtonLink href={`/certifications/${ibc.slug}`} variant="tertiary" size="inline">
                    About the {ibc.shortName}
                  </ButtonLink>
                  <ButtonLink href={`/certifications/${sca.slug}`} variant="tertiary" size="inline">
                    About the {sca.shortName} program
                  </ButtonLink>
                </p>
              )}
            </div>
            <div className="md:col-span-8">
              <FaqAccordion items={faqs} />
            </div>
          </div>
        </Container>
      </section>

      <FinalCta
        number="06"
        title="Ask which certificate fits your plan"
        body={
          <p>
            Tell the academy what you want to be doing in a year, and ask which certificate helps
            and which one is beside the point. The fee for both is not published yet.
          </p>
        }
      />

      <JsonLd
        id="certifications-jsonld"
        data={graph([
          webPageNode("/certifications", "Which coffee certificate is worth your time", DESCRIPTION),
          faqNode(faqs, "/certifications"),
        ])}
      />
    </>
  );
}
