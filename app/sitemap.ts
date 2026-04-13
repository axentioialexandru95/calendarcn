import type { MetadataRoute } from "next"

import { seoLandingPageSlugs } from "@/lib/marketing/seo-pages"
import { absoluteUrl } from "@/lib/site-config"
import { docsSource } from "@/lib/docs/source"

function toDocsPath(slug?: string[]) {
  if (!slug || slug.length === 0) {
    return "/docs"
  }

  return `/docs/${slug.join("/")}`
}

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  const docPaths = new Set<string>(["/docs"])

  for (const params of docsSource.generateParams()) {
    docPaths.add(toDocsPath(params.slug))
  }

  return [
    {
      changeFrequency: "weekly",
      lastModified,
      priority: 1,
      url: absoluteUrl("/"),
    },
    ...Array.from(docPaths).map((path) => ({
      changeFrequency: "weekly" as const,
      lastModified,
      priority: path === "/docs" || path === "/docs/calendar" ? 0.9 : 0.7,
      url: absoluteUrl(path),
    })),
    ...seoLandingPageSlugs.map((slug) => ({
      changeFrequency: "weekly" as const,
      lastModified,
      priority: 0.8,
      url: absoluteUrl(`/${slug}`),
    })),
  ]
}
