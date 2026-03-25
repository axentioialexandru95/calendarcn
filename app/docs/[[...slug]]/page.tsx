import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page"

import { getMDXComponents } from "@/mdx-components"
import { docsSource } from "@/lib/docs/source"

type DocsPageProps = {
  params: Promise<{
    slug?: string[]
  }>
}

export const dynamic = "force-static"

export function generateStaticParams() {
  return docsSource.generateParams()
}

export async function generateMetadata({
  params,
}: DocsPageProps): Promise<Metadata> {
  const { slug } = await params
  const page = docsSource.getPage(slug)

  if (!page) {
    return {}
  }

  return {
    title: `${page.data.title} | CalendarCN Docs`,
    description: page.data.description,
  }
}

export default async function DocsPageRoute({ params }: DocsPageProps) {
  const { slug } = await params
  const page = docsSource.getPage(slug)

  if (!page) {
    notFound()
  }

  const MDX = page.data.body

  return (
    <DocsPage
      editOnGithub={{
        owner: "axentioialexandru95",
        repo: "calendarcn",
        path: `content/docs/${page.path}`,
        sha: "main",
      }}
      full={page.data.full}
      toc={page.data.toc}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      {page.data.description ? (
        <DocsDescription>{page.data.description}</DocsDescription>
      ) : null}
      <DocsBody>
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  )
}
