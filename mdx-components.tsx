import type { MDXComponents } from "mdx/types"

import defaultMdxComponents from "fumadocs-ui/mdx"

import { ApiTable } from "@/components/docs/api-table"
import {
  Callout,
  CalloutContainer,
  CalloutDescription,
  CalloutTitle,
} from "@/components/docs/callout"
import { CalendarExample } from "@/components/docs/calendar-example"
import { CalendarExampleDirectory } from "@/components/docs/calendar-example-directory"
import { CalendarExampleGallery } from "@/components/docs/calendar-example-gallery"
import { CalendarUsageSnippet } from "@/components/docs/calendar-usage-snippet"
import { CodeSnippet } from "@/components/docs/code-snippet"
import { InstallTabs } from "@/components/docs/install-tabs"

export function getMDXComponents(components: MDXComponents = {}): MDXComponents {
  return {
    ...defaultMdxComponents,
    ApiTable,
    CalendarExample,
    CalendarExampleDirectory,
    CalendarExampleGallery,
    CalendarUsageSnippet,
    Callout,
    CalloutContainer,
    CalloutDescription,
    CalloutTitle,
    CodeSnippet,
    InstallTabs,
    ...components,
  }
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return getMDXComponents(components)
}
