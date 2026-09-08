import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { TbcPill } from "@/components/site/TbcPill";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { FinalCta } from "@/components/sections/FinalCta";
import { TrainerCard } from "@/components/sections/TrainerGrid";
import { CourseCard } from "@/components/course/CourseCard";
import { SanityPhoto } from "@/components/site/SanityPhoto";
import { getCoursesForTrainer, getTrainer, getTrainerSlugs, getTrainers } from "@/lib/content";
import { clampDescription, pageMetadata } from "@/lib/seo/metadata";
import { graph, trainerNode, webPageNode } from "@/lib/seo/schema";

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return (await getTrainerSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/trainers/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const trainer = await getTrainer(slug);
  if (!trainer) return { title: "Trainer not found" };

  /* seo.md's pattern is "{Name}, {Role}", but trainers[].role is null for every trainer, so the title
     uses the one role fact that is supported: they are trainers at the academy. Names vary in
     length, so take the longest variant that still fits the 50 to 60 character band. */
  const SUFFIX_LENGTH = " | Espresso Academy India".length;
  const titleCandidates = [
    `${trainer.name}, Coffee Trainer, Bengaluru`,
    `${trainer.name}, Coffee Trainer`,
  ];
  const title =
    titleCandidates.find((candidate) => candidate.length + SUFFIX_LENGTH <= 60) ??
    `${trainer.name}, Coffee Trainer`;

  return pageMetadata({
    title,
    description: clampDescription(trainer.bio),
    path: `/trainers/${trainer.slug}`,
    type: "article",
  });
}

export default async function TrainerPage({ params }: PageProps<"/trainers/[slug]">) {
  const { slug } = await params;
  const trainer = await getTrainer(slug);
  if (!trainer) notFound();

  const courses = await getCoursesForTrainer(trainer.slug);
  const others = (await getTrainers()).filter((candidate) => candidate.slug !== trainer.slug);

  return (
    <>
      <section className="border-b border-white-2 pt-6 pb-10 md:pt-8 md:pb-16">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Trainers", href: "/trainers" },
              { label: trainer.name, href: `/trainers/${trainer.slug}` },
            ]}
          />

          <div className="mt-6 grid gap-10 md:mt-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              {/* Placeholder branch preserved by SanityPhoto: no photograph is invented. */}
              <SanityPhoto
                image={trainer.image}
                slot={`trainer-${trainer.slug}`}
                fallbackAlt={`${trainer.name}, trainer at Espresso Academy India`}
                aspect="portrait"
                priority
                sizes="(min-width: 768px) 460px, 100vw"
                className="rounded-sm"
              />
            </div>

            <div className="lg:col-span-7">
              <p className="eyebrow">Trainer</p>
              <h1 className="mt-3 type-h1 text-black">{trainer.name}</h1>
              {/* TODO(client): trainers[].role. No job title is published for any trainer. */}
              <p className="mt-3 flex items-center gap-3 type-body text-grey">
                {trainer.role ?? (
                  <>
                    Role <TbcPill label="TBC" />
                  </>
                )}
              </p>
              <p className="mt-6 measure type-body text-grey">{trainer.bio}</p>

              <h2 className="mt-10 type-label text-grey">Credentials</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {trainer.credentials.map((credential) => (
                  <li key={credential.name} className="border-t border-white-2 pt-3">
                    <span className="type-body text-black">{credential.name}</span>
                    {credential.issuer && (
                      <span className="mt-1 block type-small text-grey">{credential.issuer}</span>
                    )}
                  </li>
                ))}
              </ul>

              {/*
                No link to the Florence authorised-trainer list. It records who holds a credential,
                not who works here, and reading the first as the second is how three people who are
                not part of the academy's team ended up on this site for weeks. The site does not
                cite it as evidence of faculty. (content/facts.md, Trainers, struck 8 Sept 2026.)
              */}
            </div>
          </div>
        </Container>
      </section>

      <section className="section-y-sm bg-white-3" aria-labelledby="philosophy-heading">
        <Container>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4">
              <SectionHeading
                number="01"
                eyebrow="Approach"
                title="How they teach"
                id="philosophy-heading"
              />
            </div>
            <div className="lg:col-span-8">
              {trainer.philosophy ? (
                <blockquote className="measure type-h3 text-black">
                  <p>{trainer.philosophy}</p>
                </blockquote>
              ) : (
                /* TODO(client): trainers[].philosophy. Marked as a placeholder per
                   .claude/rules/content.md and listed in docs/STATUS.md. It used to promise an
                   interview that is not scheduled and that content/facts.md does not record. */
                <div
                  data-placeholder="true"
                  className="border border-white-2 bg-white p-6 md:p-8"
                >
                  <TbcPill />
                  <p className="mt-4 type-h3 text-black">In their own words</p>
                  <p className="mt-3 measure type-body text-grey">
                    We would rather leave this blank than put words in a trainer&rsquo;s mouth. The
                    academy has not published anything {trainer.name.split(" ")[0]} has said about
                    how the teaching works, so nothing sits here yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      <section className="section-y-sm" aria-labelledby="teaches-heading">
        <Container>
          <SectionHeading
            number="02"
            eyebrow="Courses"
            title="What they teach"
            id="teaches-heading"
            action={
              <ButtonLink href="/courses" variant="tertiary" size="inline">
                See all courses
              </ButtonLink>
            }
          />
          {courses.length > 0 ? (
            <ul className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <li key={course.slug}>
                  <CourseCard course={course} />
                </li>
              ))}
            </ul>
          ) : (
            /* TODO(client): courses[].trainers is empty for all three courses. content/facts.md
               does not say which trainer takes which, and it says nothing about per-batch
               assignment either, so neither does this. */
            <p className="mt-8 measure type-body text-grey">
              The academy has not published which courses {trainer.name.split(" ")[0]} takes. Ask
              when you enquire and you will be told.{" "}
              <Link
                href="/courses"
                className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
              >
                See every course
              </Link>
              .
            </p>
          )}
        </Container>
      </section>

      {others.length > 0 && (
        <section className="section-y-sm bg-white-3" aria-labelledby="other-trainers-heading">
          <Container>
            <SectionHeading
              number="03"
              eyebrow="Faculty"
              title="The rest of the team"
              id="other-trainers-heading"
            />
            <ul className="mt-10 grid gap-10 md:grid-cols-2 md:gap-8">
              {others.map((other) => (
                <li key={other.slug}>
                  <TrainerCard trainer={other} />
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <FinalCta
        number="04"
        title={`Learn from ${trainer.name.split(" ")[0]}`}
        body={
          <p>
            Send your background in one message and ask which batch to book. The dates, and the
            seats capped on each, are on the course pages.
          </p>
        }
      />

      <JsonLd
        id="trainer-jsonld"
        data={graph([
          webPageNode(
            `/trainers/${trainer.slug}`,
            `${trainer.name}, trainer at Espresso Academy India`,
            clampDescription(trainer.bio),
          ),
          trainerNode(trainer),
        ])}
      />
    </>
  );
}
