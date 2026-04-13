import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CalendarCnSeoLandingPage } from "@/components/marketing/seo/landing-page"
import {
  getSeoLandingPage,
  seoLandingPageSlugs,
} from "@/lib/marketing/seo-pages"
import { createPageMetadata } from "@/lib/seo"

type SeoLandingPageRouteProps = {
  params: Promise<{
    slug: string
  }>
}

export const dynamicParams = false

export function generateStaticParams() {
  return seoLandingPageSlugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: SeoLandingPageRouteProps): Promise<Metadata> {
  const { slug } = await params
  const page = getSeoLandingPage(slug)

  if (!page) {
    return {}
  }

  return createPageMetadata({
    description: page.description,
    keywords: page.keywords,
    path: `/${page.slug}`,
    title: page.title,
  })
}

export default async function SeoLandingPageRoute({
  params,
}: SeoLandingPageRouteProps) {
  const { slug } = await params
  const page = getSeoLandingPage(slug)

  if (!page) {
    notFound()
  }

  return <CalendarCnSeoLandingPage page={page} />
}
