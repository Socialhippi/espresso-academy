import { notFound } from "next/navigation";
import { getCourse, getCourseSlugs } from "@/lib/content";
import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from "@/lib/seo/og";

export const alt = "Course at Espresso Academy India, Bengaluru";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams(): { slug: string }[] {
  return getCourseSlugs().map((slug) => ({ slug }));
}

export default async function CourseOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = getCourse(slug);
  if (!course) notFound();

  return ogCard({
    eyebrow: course.levelLabel,
    title: course.title,
    subtitle: course.outcome,
  });
}
