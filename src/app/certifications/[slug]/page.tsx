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

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return (await getCertificationSlugs()).map((slug) => ({ slug }));
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
          Espresso Academy in Florence issues it. The diploma is issued in Italy and sent to the
          authorised partner school that taught you, which in Bengaluru is Espresso Academy India,
          an Official Partner of Espresso Academy, Florence. The certificate names the academy as
          &ldquo;Espresso Academy India, under the supervision of Espresso Academy Florence&rdquo;.
          The teaching happens here; the certificate comes from there.
        </p>
      ) : (
        <p>
          The Specialty Coffee Association issues it, not the school, and only on an assessed
          module taught by an authorised trainer. One of the trainers listed here is an SCA
          Authorised Trainer, and assessed modules run on batches the academy confirms. The academy
          does not currently sell an SCA course, so if SCA certification is what you are after, ask
          first.
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
            ? ". IBC Basic is four days and assumes no machine experience. Above it sit two Advanced courses of two days each, Advanced Barista for the bar and Advanced Roasting for the roaster, and neither requires the other."
            : ". Each of the five SCA areas is examined at all three levels. The academy runs no SCA course of its own, so no level of it is offered here."}
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
            {isIbc
              ? "The certificate is part of the course fee, so there is nothing separate to pay for it. The fee for each course is on that course's page; ₹5,000 holds a seat and the balance is paid at the academy."
              : "Nothing, here. The academy does not sell an SCA course, so there is no fee to publish. What the SCA itself charges for an assessment is between you and the SCA."}
          </p>
        </>
      ),
    },
    {
      id: "courses",
      question: "Which courses lead to it?",
      body:
        courseCount === 0 ? (
          /* facts.md line 53: the client's document lists no SCA course, fee or date the academy
             offers, so this page explains the framework and stops there. */
          <p>
            None. The academy runs the Italian Barista Course, not an SCA course, and this page is
            here so you can tell the two apart before you choose. Ask if the SCA route is what you
            want and you will get a straight answer about where to take it.
          </p>
        ) : (
          <p>
            {courseCount === 1
              ? "One course at the Bengaluru campus leads to it."
              : `${courseCount} courses at the Bengaluru campus lead to it.`}{" "}
            Each is listed below with the level it sits at. If you are not sure which one matches
            what you can already do, send a message describing your experience and ask which to
            start at.
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
  const certification = await getCertification(slug);
  if (!certification) return { title: "Certification not found" };

  return pageMetadata({
    title: `${certification.shortName}: What It Is and Who Issues It`,
    description: clampDescription(certification.summary),
    path: `/certifications/${certification.slug}`,
    type: "article",
  });
}

export default async function CertificationPage({ params }: PageProps<"/certifications/[slug]">) {
  const { slug } = await params;
  const certification = await getCertification(slug);
  if (!certification) notFound();

  const courses = await getCoursesForCertification(certification.slug);
  const answers = answersFor(certification, courses.length);
  const faqs = await getFaqs("certification");
  const other = await getCertification(
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
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <nav aria-label="On this page" className="lg:col-span-4">
              <div className="md:sticky md:top-28">
                <p className="type-label text-grey">On this page</p>
                <ul className="mt-4 flex flex-col gap-3">
                  {answers.map((answer) => (
                    <li key={answer.id}>
                      <Link
                        href={`#${answer.id}`}
                        className="inline-flex min-h-11 items-center type-small text-black underline decoration-white-2 underline-offset-4 hover:text-red hover:decoration-red"
                      >
                        {answer.question}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>

            <div className="lg:col-span-8">
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

      {/* No cards when no course leads here. An empty grid under a heading promising courses is
          the page asserting a pathway the academy does not sell. */}
      {courses.length > 0 && (
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
      )}

      <section className="section-y-sm" aria-labelledby="cert-faq-heading">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4">
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
            <div className="lg:col-span-8">
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
            Send your background in one message and ask whether this certificate helps you, and
            which course to start on if it does. The fee is not published yet.
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
