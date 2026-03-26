"use client"

import * as React from "react"

import { CodePanel } from "@/components/docs/code-panel"
import { calendarRegistryItem } from "@/lib/docs/registry"
import { cn } from "@/lib/utils"

const fallbackOrigin = "https://calendarcn.phantomtechind.com"

function stripRegistryVersions(packages: string[]) {
  return packages.map((entry) => {
    const scopedPackageMatch = /^(@[^@]+\/[^@]+)(?:@.+)?$/.exec(entry)

    if (scopedPackageMatch) {
      return scopedPackageMatch[1]
    }

    const packageMatch = /^([^@]+)(?:@.+)?$/.exec(entry)

    return packageMatch?.[1] ?? entry
  })
}

export function InstallTabs() {
  const [activeTab, setActiveTab] = React.useState<"cli" | "manual">("cli")
  const [origin, setOrigin] = React.useState(fallbackOrigin)

  React.useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const registryUrl = `${origin}/r/${calendarRegistryItem.name}.json`
  const installCommand = `npx shadcn@latest add ${registryUrl}`
  const dependencyCommand = `pnpm add ${stripRegistryVersions(
    calendarRegistryItem.dependencies ?? []
  ).join(" ")}`
  const importSnippet = `import { CalendarRoot } from "@/components/calendar"
import {
  applyMoveOperation,
  applyResizeOperation,
  createEventFromOperation,
} from "@/components/calendar/utils"`
  const filesSnippet = (calendarRegistryItem.files ?? [])
    .map((file) => file.path)
    .join("\n")

  return (
    <div className="not-prose my-6 space-y-4">
      <div className="inline-flex rounded-full border border-border/70 bg-card p-1">
        <button
          className={cn(
            "rounded-full px-4 py-2 text-sm transition-colors",
            activeTab === "cli"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("cli")}
          type="button"
        >
          CLI
        </button>
        <button
          className={cn(
            "rounded-full px-4 py-2 text-sm transition-colors",
            activeTab === "manual"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("manual")}
          type="button"
        >
          Manual
        </button>
      </div>

      {activeTab === "cli" ? (
        <div className="space-y-3">
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
            Pull the registry item directly into your app with the shadcn CLI.
            On your deployed site this resolves to the live ` /r/calendarcn.json
            ` registry endpoint.
          </p>
          <CodePanel code={installCommand} fileName="terminal" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Dependencies
            </h3>
            <CodePanel code={dependencyCommand} fileName="terminal" />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Installed Files
            </h3>
            <CodePanel code={filesSnippet} fileName="registry.txt" />
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Imports
            </h3>
            <CodePanel code={importSnippet} fileName="app/schedule/page.tsx" />
          </div>
        </div>
      )}
    </div>
  )
}
