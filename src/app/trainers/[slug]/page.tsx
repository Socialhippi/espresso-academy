import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { ButtonLink } from "@/components/site/Button";
import { TbcPill } from "@/components/site/TbcPill";
import { Placeholder } from "@/components/site/Placeholder";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { FinalCta } from "@/components/sections/FinalCta";
import { TrainerCard } from "@/components/sections/TrainerGrid";
import { CourseCard } from "@/components/course/CourseCard";
import { getCoursesForTrainer, getTrainer, getTrainerSlugs, getTrainers } from "@/lib/content";
import { clampDescription, pageMetadata } from "@/lib/seo/metadata";
import { graph, trainerNode, webPageNode } from "@/lib/seo/schema";

export function generateStaticParams(): { slug: string }[] {
  return getTrainerSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/trainers/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const trainer = getTrainer(slug);
  if (!trainer) return { title: "Trainer not found" };

  return pageMetadata({
    /* seo.md's pattern is "{Name}, {Role}", but trainers[].role is null for all three, so the
       title uses the one role fact that is supported: they are trainers at the academy. */
    title: `${trainer.name}, Coffee Trainer`,
    description: clampDescription(trainer.bio),
    path: `/trainers/${trainer.slug}`,
    type: "article",
  });
}

export default async function TrainerPage({ params }: PageProps<"/trainers/[slug]">) {
  const { slug } = await params;
  const trainer = getTrainer(slug);
  if (!trainer) notFound();

  const courses = getCoursesForTrainer(trainer.slug);
  const others = getTrainers().filter((candidate) => candidate.slug !== trainer.slug);

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

          <div className="mt-6 grid gap-10 md:mt-8 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-5">
              {trainer.image ? (
                <Image
                  src={trainer.image}
                  alt={`${trainer.name}, trainer at Espresso Academy India`}
                  width={800}
                  height={1000}
                  priority
                  sizes="(min-width: 768px) 460px, 100vw"
                  className="aspect-portrait w-full rounded-sm object-cover"
                />
              ) : (
                <Placeholder slot={`trainer-${trainer.slug}`} aspect="portrait" />
              )}
            </div>

            <div className="md:col-span-7">
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

              {trainer.sameAs.length > 0 && (
                <p className="mt-6 type-small text-grey">
                  Listed on the{" "}
                  <a
                    href={trainer.sameAs[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red underline decoration-1 underline-offset-4 hover:text-red-deep"
                  >
                    Espresso Academy authorised trainer list
                  </a>
                  .
                </p>
              )}
            </div>
          </div>
        </Container>
      </section>

      <section className="section-y-sm bg-white-3" aria-labelledby="philosophy-heading">
        <Container>
          <div className="grid gap-10 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-4">
              <SectionHeading
                number="01"
                eyebrow="Approach"
                title="How they teach"
                id="philosophy-heading"
              />
            </div>
            <div className="md:col-span-8">
              {trainer.philosophy ? (
                <blockquote className="measure type-h3 text-black">
                  <p>{trainer.philosophy}</p>
                </blockquote>
              ) : (
                /* TODO(client): trainers[].philosophy. Needs a ten-minute interview with each trainer. */
                <div className="border border-white-2 bg-white p-6 md:p-8">
                  <TbcPill label="Coming soon" />
                  <p className="mt-4 type-h3 text-black">In their own words, coming soon</p>
                  <p className="mt-3 measure type-body text-grey">
                    We would rather leave this blank than put words in a trainer&rsquo;s mouth.{" "}
                    {trainer.name.split(" ")[0]} is being interviewed and this space will carry
                    what they actually said about how they teach.
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
            /* TODO(client): courses[].trainers is empty for every course except roasting-and-cupping. */
            <p className="mt-8 measure type-body text-grey">
              Assigned per batch. The academy sets which trainer takes which intake nearer the
              date. If you want to learn from {trainer.name.split(" ")[0]} in particular, say so
              when you enquire and you will be told which batches they are on.{" "}
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
            Say which trainer you want when you enquire. The academy will tell you which batches
            they are teaching and whether a seat is open.
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
