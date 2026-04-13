import type { MetadataRoute } from "next"

import { siteConfig } from "@/lib/site-config"

export default function robots(): MetadataRoute.Robots {
  return {
    host: siteConfig.url,
    rules: [
      {
        allow: "/",
        disallow: ["/api/"],
        userAgent: "*",
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}
