import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/env";
import {
  getCertificationSlugs,
  getCourseSlugs,
  getTrainerSlugs,
} from "@/lib/content";

/**
 * Built from content/data.ts, so a new course or trainer appears here with no extra step.
 * /thank-you and /dev/* are noindex and are deliberately absent.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/courses", priority: 0.9, changeFrequency: "weekly" },
    { path: "/calendar", priority: 0.8, changeFrequency: "daily" },
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
    ...getCourseSlugs().map((slug) => ({
      url: absoluteUrl(`/courses/${slug}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
    ...getCertificationSlugs().map((slug) => ({
      url: absoluteUrl(`/certifications/${slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...getTrainerSlugs().map((slug) => ({
      url: absoluteUrl(`/trainers/${slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
