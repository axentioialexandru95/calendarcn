import type { ReactNode } from "react"

import { DocsLayout } from "fumadocs-ui/layouts/docs"

import { CalendarCnLogo } from "@/components/marketing/branding/logo"
import { docsSource } from "@/lib/docs/source"

export default function DocsRootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <DocsLayout
      githubUrl="https://github.com/axentioialexandru95/calendarcn"
      links={[
        {
          text: "Home",
          url: "/",
          active: "none",
        },
      ]}
      nav={{
        title: <CalendarCnLogo className="gap-2" iconClassName="size-7 rounded-lg" />,
        transparentMode: "none",
        url: "/",
      }}
      searchToggle={{
        enabled: true,
      }}
      sidebar={{
        enabled: true,
      }}
      tabs={false}
      themeSwitch={{
        enabled: false,
      }}
      tree={docsSource.pageTree}
    >
      {children}
    </DocsLayout>
  )
}
