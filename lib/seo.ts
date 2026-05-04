import type { Metadata } from "next"

import { absoluteUrl, siteConfig, socialPreview } from "@/lib/site-config"

export const defaultMetadataTitle =
  "Open-source scheduling primitives for shadcn/ui apps"

export const siteKeywords = [
  "calendarcn",
  "shadcn calendar",
  "react scheduler component",
  "next.js calendar component",
  "open source scheduler",
  "resource scheduling react",
]

type PageMetadataOptions = {
  description?: string
  keywords?: string[]
  path: string
  robots?: Metadata["robots"]
  title: string
  type?: "article" | "website"
}

const socialImage = {
  alt: socialPreview.alt,
  height: socialPreview.height,
  secureUrl: absoluteUrl(socialPreview.path),
  type: socialPreview.type,
  url: absoluteUrl(socialPreview.path),
  width: socialPreview.width,
} as const

const twitterImage = {
  alt: socialPreview.alt,
  height: socialPreview.twitterHeight,
  secureUrl: absoluteUrl(socialPreview.twitterPath),
  type: socialPreview.type,
  url: absoluteUrl(socialPreview.twitterPath),
  width: socialPreview.width,
} as const

export function createPageMetadata({
  description = siteConfig.description,
  keywords = [],
  path,
  robots,
  title,
  type = "website",
}: PageMetadataOptions): Metadata {
  const resolvedKeywords = Array.from(new Set([...siteKeywords, ...keywords]))
  const url = absoluteUrl(path)

  return {
    alternates: {
      canonical: url,
    },
    description,
    keywords: resolvedKeywords,
    openGraph: {
      description,
      images: [socialImage],
      locale: "en_US",
      siteName: siteConfig.name,
      title,
      type,
      url,
    },
    robots,
    title,
    twitter: {
      card: "summary_large_image",
      description,
      images: [twitterImage],
      title,
    },
  }
}
