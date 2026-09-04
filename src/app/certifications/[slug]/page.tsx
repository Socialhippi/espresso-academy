import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { TbcPill } from "@/components/site/TbcPill";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { PageHero } from "@/components/sections/Hero";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { FinalCta } from "@/components/sections/FinalCta";
import { CourseCard } from "@/components/course/CourseCard";
import {
  getCertification,
  getCertificationSlugs,
  getCoursesForCertification,
  getFaqs,
  type Certification,
} from "@/lib/content";
import { clampDescription, pageMetadata } from "@/lib/seo/metadata";
import { certificationArticleNode, faqNode, graph, webPageNode } from "@/lib/seo/schema";

export function generateStaticParams(): { slug: string }[] {
  return getCertificationSlugs().map((slug) => ({ slug }));
}

/**
 * Answer-first copy, 40 to 60 words per answer, under question-shaped H2s. Everything here traces
 * to content/data.ts (the certification record) or content/facts.md. Where a fact is missing, the
 * answer says so rather than filling the gap.
 */
interface Answer {
  id: string;
  question: string;
  body: React.ReactNode;
}

function answersFor(certification: Certification, courseCount: number): Answer[] {
  const isIbc = certification.slug === "italian-barista-certificate";

  return [
    {
      id: "what",
      question: `What is the ${certification.name}?`,
      body: <p>{certification.summary}</p>,
    },
    {
      id: "issuer",
      question: "Who issues it?",
      body: isIbc ? (
        <p>
          Espresso Academy in Florence issues it. The diploma is printed in Italy and sent to the
          authorised partner school that taught you, which in Bengaluru is Espresso Academy India.
          The academy is listed by Florence as its Official Partner in India. The teaching happens
          here; the certificate comes from there.
        </p>
      ) : (
        <p>
          The Specialty Coffee Association issues it, not the school. An authorised trainer runs
          the assessment and the SCA records the result. The academy teaches training aligned to
          the program. Whether a given batch is assessed for SCA certification is confirmed at
          enrolment, so ask before you book if that is what you are after.
        </p>
      ),
    },
    {
      id: "levels",
      question: "Which levels exist?",
      body: (
        <p>
          {certification.levels.join(" and ")}
          {isIbc
            ? ". Junior assumes no machine experience and starts at the grinder. Advanced assumes you already pull consistent shots and works on refinement, milk texture and bar workflow. There is no level above Advanced."
            : ". Foundation is an introduction, Intermediate goes into extraction theory and sensory work, and Professional is aimed at head baristas and trainers. Each module carries its own three levels."}
        </p>
      ),
    },
    {
      id: "cost",
      question: "What does it cost?",
      body: (
        <>
          <p className="flex flex-wrap items-center gap-3">
            {/* TODO(client): no certification or course fee is published anywhere. */}
            <TbcPill label="Fee TBC" />
          </p>
          <p className="mt-4">
            No fee is published for this certificate or for the courses that lead to it. The academy
            confirms the figure incl. GST for each batch before you pay.{" "}
            {isIbc
              ? "Ask on WhatsApp and you will be told the current number."
              : "Where the SCA charges its own assessment and certificate fee on top of the course fee, the academy says so before you pay."}
          </p>
        </>
      ),
    },
    {
      id: "courses",
      question: "Which courses lead to it?",
      body: (
        <p>
          {courseCount === 1
            ? "One course at the Bengaluru campus leads to it."
            : `${courseCount} courses at the Bengaluru campus lead to it.`}{" "}
          They are listed below with the level each one sits at. If you are not sure which rung
          matches what you can already do, send a message describing your experience and you will
          get a straight answer rather than an upsell.
        </p>
      ),
    },
    {
      id: "worth",
      question: "Will it get me a job?",
      body: (
        <p>
          A certificate helps you get an interview; your skills get you the job. {certification.recognitionNote}
        </p>
      ),
    },
  ];
}

export async function generateMetadata({
  params,
}: PageProps<"/certifications/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const certification = getCertification(slug);
  if (!certification) return { title: "Certification not found" };

  return pageMetadata({
    title: `${certification.shortName}: What It Is and What It Costs`,
    description: clampDescription(certification.summary),
    path: `/certifications/${certification.slug}`,
    type: "article",
  });
}

export default async function CertificationPage({ params }: PageProps<"/certifications/[slug]">) {
  const { slug } = await params;
  const certification = getCertification(slug);
  if (!certification) notFound();

  const courses = getCoursesForCertification(certification.slug);
  const answers = answersFor(certification, courses.length);
  const faqs = getFaqs("certification");
  const other = getCertification(
    certification.slug === "italian-barista-certificate"
      ? "sca-coffee-skills-program"
      : "italian-barista-certificate",
  );

  return (
    <>
      <PageHero
        above={
          <Breadcrumbs
            items={[
              { label: "Certifications", href: "/certifications" },
              { label: certification.name, href: `/certifications/${certification.slug}` },
            ]}
          />
        }
        eyebrow={`Issued by ${certification.issuer}`}
        title={certification.name}
        intro={<p>{certification.summary}</p>}
        actions={
          <>
            <ButtonLink href="/courses" variant="primary">
              See the courses
            </ButtonLink>
            <ButtonLink href="/certifications" variant="secondary">
              Compare both certificates
            </ButtonLink>
          </>
        }
      />

      <section className="section-y-sm" aria-labelledby="answers-heading">
        <Container>
          <h2 id="answers-heading" className="sr-only">
            Questions about the {certification.name}
          </h2>
          <div className="grid gap-10 md:grid-cols-12 md:gap-12">
            <nav aria-label="On this page" className="md:col-span-4">
              <div className="md:sticky md:top-28">
                <p className="type-label text-grey">On this page</p>
                <ul className="mt-4 flex flex-col gap-3">
                  {answers.map((answer) => (
                    <li key={answer.id}>
                      <Link
                        href={`#${answer.id}`}
                        className="type-small text-black underline decoration-white-2 underline-offset-4 hover:text-red hover:decoration-red"
                      >
                        {answer.question}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>

            <div className="md:col-span-8">
              {answers.map((answer, index) => (
                <article key={answer.id} className={index > 0 ? "mt-12 hairline pt-6" : undefined}>
                  <p className="eyebrow">
                    <span className="type-numeral text-h3-lg leading-none" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </p>
                  <h2 id={answer.id} className="mt-3 type-h2 text-black">
                    {answer.question}
                  </h2>
                  <div className="mt-4 measure type-body text-grey">{answer.body}</div>
                </article>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="section-y-sm bg-white-3" aria-labelledby="cert-courses-heading">
        <Container>
          <SectionHeading
            number="07"
            eyebrow="Courses"
            title={`Courses that lead to the ${certification.shortName}`}
            id="cert-courses-heading"
            action={
              <ButtonLink href="/courses" variant="tertiary" size="inline">
                See all courses
              </ButtonLink>
            }
          />
          <ul className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, index) => (
              <li key={course.slug}>
                <CourseCard course={course} priority={index === 0} />
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="section-y-sm" aria-labelledby="cert-faq-heading">
        <Container>
          <div className="grid gap-10 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-4">
              <SectionHeading
                number="08"
                eyebrow="Questions"
                title="What people ask"
                id="cert-faq-heading"
              />
              {other && (
                <p className="mt-6">
                  <ButtonLink
                    href={`/certifications/${other.slug}`}
                    variant="tertiary"
                    size="inline"
                  >
                    Read about the {other.shortName} instead
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
        number="09"
        title={`Ask whether the ${certification.shortName} is right for you`}
        body={
          <p>
            Send your background in one message. You will get an honest answer about whether this
            certificate helps you, and which course to start on if it does.
          </p>
        }
      />

      <JsonLd
        id="certification-jsonld"
        data={graph([
          webPageNode(
            `/certifications/${certification.slug}`,
            certification.name,
            clampDescription(certification.summary),
          ),
          certificationArticleNode(certification, `/certifications/${certification.slug}`),
          faqNode(faqs, `/certifications/${certification.slug}`),
        ])}
      />
    </>
  );
}
