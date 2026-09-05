import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/env";
import {
  getCertificationSlugs,
  getCourseSlugs,
  getGuideSlugs,
  getTrainerSlugs,
} from "@/lib/content";

/**
 * Built from Sanity, so a new course, guide or trainer appears here with no extra step.
 * /thank-you, /studio, /dev/*, /lp/*, /book/* and /booking/* are noindex and deliberately absent.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [courseSlugs, certificationSlugs, trainerSlugs, guideSlugs] = await Promise.all([
    getCourseSlugs(),
    getCertificationSlugs(),
    getTrainerSlugs(),
    getGuideSlugs(),
  ]);

  const staticRoutes: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/courses", priority: 0.9, changeFrequency: "weekly" },
    { path: "/workshops", priority: 0.8, changeFrequency: "weekly" },
    { path: "/calendar", priority: 0.8, changeFrequency: "daily" },
    { path: "/guides", priority: 0.7, changeFrequency: "weekly" },
    { path: "/for-cafes", priority: 0.7, changeFrequency: "monthly" },
    { path: "/student-stories", priority: 0.5, changeFrequency: "monthly" },
    { path: "/certifications", priority: 0.8, changeFrequency: "monthly" },
    { path: "/trainers", priority: 0.7, changeFrequency: "monthly" },
    { path: "/about", priority: 0.7, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
    { path: "/enquire", priority: 0.6, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
    { path: "/refund-policy", priority: 0.2, changeFrequency: "yearly" },
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route.path),
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...courseSlugs.map((slug) => ({
      url: absoluteUrl(`/courses/${slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...certificationSlugs.map((slug) => ({
      url: absoluteUrl(`/certifications/${slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...trainerSlugs.map((slug) => ({
      url: absoluteUrl(`/trainers/${slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...guideSlugs.map((slug) => ({
      url: absoluteUrl(`/guides/${slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
