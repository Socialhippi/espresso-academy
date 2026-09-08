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
  "The Italian Barista Certificate and the SCA Coffee Skills Program compared: who issues each, which levels exist, and which Bengaluru courses lead to the IBC.";

export const metadata: Metadata = pageMetadata({
  title: "Coffee Certifications Explained",
  description: DESCRIPTION,
  path: "/certifications",
});

/** Row labels for the comparison. Every cell traces to content/data.ts or content/facts.md. */
const comparison = [
  {
    label: "Who issues it",
    /* facts.md says the diplomas are issued in Italy by Espresso Academy. How they travel from
       Florence to a partner school is not in the file, so the sentence stops where the file does. */
    ibc: "Espresso Academy, Florence. Diplomas are issued in Italy.",
    /* The AST line was sourced to a trainer the client has since confirmed is not part of the
       team, so the academy has no Authorised Trainer on faculty and nothing to say about who
       could assess a module. What is left is what the SCA does, which is true of the SCA. */
    sca: "The Specialty Coffee Association, not the school, and only on an assessed module. The academy does not run one and does not assess for one.",
  },
  {
    label: "Levels",
    ibc: "Basic Barista, then Advanced Barista or Advanced Roasting.",
    sca: "Foundation, Intermediate, then Professional, across five areas.",
  },
  {
    label: "Taught here",
    ibc: "Yes. All three courses at the Bengaluru campus lead to it.",
    /* facts.md line 53: the client's document describes the framework and lists no SCA course,
       fee or date the academy offers. Saying so plainly is the whole point of this row. */
    sca: "No. The academy runs no SCA course of its own, and this page is here so you can tell the two certificates apart.",
  },
  {
    label: "Who it suits",
    ibc: "People who want one certificate, issued by Espresso Academy, Florence, start to finish.",
    sca: "People who want a modular programme they can add to, area by area.",
  },
  {
    label: "What it costs",
    ibc: "The certificate is part of the course fee. Nothing separate is charged for it.",
    /* TODO(client): content/facts.md records no SCA fee of any kind. What the SCA charges for an
       assessment is not ours to quote, so this row states only what is true of this academy. */
    sca: "Not published here, because no SCA course is sold here.",
  },
];

export default async function CertificationsPage() {
  const certifications = await getCertifications();
  /* Resolved up here rather than inside the map: a map callback cannot await, and one pass over
     the courses is cheaper than one request per certification anyway. */
  const coursesByCertification = await Promise.all(
    certifications.map(async (certification) => ({
      certification,
      courses: await getCoursesForCertification(certification.slug),
    })),
  );
  const [ibc, sca] = certifications;
  const faqs = await getFaqs("certification");

  return (
    <>
      <PageHero
        above={<Breadcrumbs items={[{ label: "Certifications", href: "/certifications" }]} />}
        eyebrow="Certifications"
        title="Which coffee certificate is worth your time"
        intro={
          <p>
            The academy teaches one certificate, the Italian Barista Certificate. The other, the
            SCA Coffee Skills Program, is explained here because you deserve to know what you are
            not getting. This page sets them side by side so you can choose on the facts rather
            than on the acronym.
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
                      {row.ibc ?? <TbcPill />}
                    </td>
                    <td className="py-5 pr-6 type-small text-black">
                      {row.sca ?? <TbcPill />}
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
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <SectionHeading
                number="02"
                eyebrow="Straight answer"
                title="What a certificate is actually worth"
                id="honesty-heading"
              />
            </div>
            <div className="lg:col-span-7">
              <p className="measure type-h3 text-black">
                A certificate helps you get an interview. Your skills get you the job.
              </p>
              <p className="mt-5 measure type-body text-grey">
                Neither certificate is a licence to practise, and neither replaces what you can do
                on a bar. What an employer tests at a trial shift is whether you can dial in under
                pressure, texture milk consistently and keep a bar moving.
              </p>
              <p className="mt-4 measure type-body text-grey">
                If what a certificate is worth to a particular employer matters to you, ask before
                you book, and ask the employer too.
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
            {coursesByCertification.map(({ certification, courses }) => {
              return (
                <div key={certification.slug} className="border border-white-2 p-6 md:p-8">
                  <h3 className="type-h3 text-black">{certification.name}</h3>
                  {courses.length > 0 ? (
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
                  ) : (
                    /* An empty list under a heading that promises courses reads as a page that
                       has lost its data. This says the true thing instead. */
                    <p className="mt-5 border-t border-white-2 pt-3 type-body text-black">
                      No course here leads to it. The academy runs the Italian Barista Course, not
                      an SCA course.
                    </p>
                  )}
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
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4">
              <SectionHeading
                number="04"
                eyebrow="Levels"
                title="The IBC ladder"
                id="ladder-heading"
                /* TODO(client): prerequisites for both Advanced courses are open in
                   content/facts.md, so the site does not assert that neither requires the other.
                   Asserting the absence of a rule is still asserting a rule. */
                description="The IBC runs at Basic, then at two Advanced courses. The prerequisites for both Advanced courses are being confirmed by the academy."
              />
            </div>
            <div className="lg:col-span-8">
              <LevelLadder />
            </div>
          </div>
        </Container>
      </section>

      <section className="section-y-sm" aria-labelledby="certs-faq-heading">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4">
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
            <div className="lg:col-span-8">
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
            and which one is beside the point. You will get a straight answer, including when the
            answer is that the academy does not teach what you need.
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
