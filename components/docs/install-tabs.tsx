"use client"

import * as React from "react"

import { CodePanel } from "@/components/docs/code-panel"
import {
  calendarRegistryNamespace,
  calendarCoreRegistryItem,
  calendarRegistryItem,
  calendarToolbarRegistryItem,
  getRegistryItem,
  toCalendarRegistryReference,
} from "@/lib/docs/registry"
import { cn } from "@/lib/utils"

const fallbackOrigin = "https://calendarcn.phantomtechind.com"

const installBundles = {
  primitive: {
    description:
      "Install the lean surface first. This gives you `CalendarRoot` plus the controlled toolbar, with the rest left open for composition.",
    importSnippet: `"use client"

import { CalendarRoot } from "@/components/calendar/root"
import { CalendarToolbar } from "@/components/calendar/toolbar"
import { getRangeLabel, shiftDate } from "@/components/calendar/utils"`,
    items: [calendarCoreRegistryItem, calendarToolbarRegistryItem],
    label: "Primitive",
  },
  starter: {
    description:
      "Install the batteries-included starter when you want the current full CalendarCN experience with sheets, context menu, confirmation, and shortcuts already composed.",
    importSnippet: `"use client"

import { CalendarScheduler } from "@/components/calendar/scheduler"
import { createEventFromOperation } from "@/components/calendar/utils"`,
    items: [calendarRegistryItem],
    label: "Starter",
  },
} as const

type InstallBundleId = keyof typeof installBundles

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

function collectBundleItems(bundleId: InstallBundleId) {
  const items = new Map()
  const queue = [...installBundles[bundleId].items]

  while (queue.length > 0) {
    const item = queue.shift()

    if (!item || items.has(item.name)) {
      continue
    }

    items.set(item.name, item)

    for (const dependencyName of item.registryDependencies ?? []) {
      queue.push(getRegistryItem(dependencyName))
    }
  }

  return Array.from(items.values())
}

function createRegistryConfigSnippet(origin: string) {
  return JSON.stringify(
    {
      registries: {
        [calendarRegistryNamespace]: `${origin}/r/{name}.json`,
      },
    },
    null,
    2
  )
}

function formatCommand(command: string, entries: string[]) {
  if (entries.length <= 1) {
    return [command, ...entries].join(" ")
  }

  return `${command} \\\n  ${entries.join(" \\\n  ")}`
}

export function InstallTabs() {
  const [activeBundle, setActiveBundle] =
    React.useState<InstallBundleId>("primitive")
  const [activeTab, setActiveTab] = React.useState<"cli" | "manual">("cli")
  const [origin, setOrigin] = React.useState(fallbackOrigin)

  React.useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const bundle = installBundles[activeBundle]
  const bundleItems = React.useMemo(
    () => collectBundleItems(activeBundle),
    [activeBundle]
  )
  const registryConfigSnippet = createRegistryConfigSnippet(origin)
  const installCommand = formatCommand(
    "npx shadcn@latest add",
    bundle.items.map((item) => toCalendarRegistryReference(item.name))
  )
  const dependencyCommand = formatCommand(
    "pnpm add",
    stripRegistryVersions(
      Array.from(
        new Set(bundleItems.flatMap((item) => item.dependencies ?? []))
      )
    )
  )
  const filesSnippet = bundleItems
    .flatMap((item) => item.files ?? [])
    .map((file) => file.path)
    .join("\n")

  return (
    <div className="not-prose my-6 space-y-4">
      <div className="space-y-3">
        <div className="inline-flex rounded-full border border-border/70 bg-card p-1">
          {(
            Object.entries(installBundles) as Array<
              [InstallBundleId, (typeof installBundles)[InstallBundleId]]
            >
          ).map(([bundleId, currentBundle]) => (
            <button
              key={bundleId}
              className={cn(
                "rounded-full px-4 py-2 text-sm transition-colors",
                activeBundle === bundleId
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveBundle(bundleId)}
              type="button"
            >
              {currentBundle.label}
            </button>
          ))}
        </div>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
          {bundle.description}
        </p>
      </div>

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
            Add the CalendarCN registry alias once, then pull the selected items
            into your app with the shadcn CLI. The primitive path installs
            separate open-code files; the starter path keeps the current
            composed scheduler.
          </p>
          <CodePanel code={registryConfigSnippet} fileName="components.json" />
          <CodePanel code={installCommand} fileName="terminal" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              Registry Alias
            </h3>
            <CodePanel
              code={registryConfigSnippet}
              fileName="components.json"
            />
          </div>

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
            <CodePanel
              code={bundle.importSnippet}
              fileName="app/schedule/page.tsx"
            />
          </div>
        </div>
      )}
    </div>
  )
}
