"use client"

import * as React from "react"

import {
  calendarExamples,
  type CalendarExampleId,
} from "@/content/docs/calendar"
import { CodePanel } from "@/components/docs/code-panel"
import { cn } from "@/lib/utils"

type CalendarExampleGalleryClientProps = {
  defaultId?: CalendarExampleId
  ids: CalendarExampleId[]
  sources: Record<
    string,
    {
      code: string
      fileName: string
    }
  >
}

export function CalendarExampleGalleryClient({
  defaultId,
  ids,
  sources,
}: CalendarExampleGalleryClientProps) {
  const initialId = defaultId ?? ids[0]
  const [activeId, setActiveId] = React.useState<CalendarExampleId>(initialId)
  const [activeTab, setActiveTab] = React.useState<"preview" | "code">(
    "preview"
  )
  const activeExample = calendarExamples[activeId]
  const ActivePreview = activeExample.component
  const activeSource = sources[activeId]

  return (
    <div className="not-prose my-8 overflow-hidden rounded-[2rem] border border-border/70 bg-linear-to-b from-card via-card/98 to-background shadow-[0_28px_120px_-60px_rgba(15,23,42,0.55)]">
      <div className="space-y-5 border-b border-border/70 px-5 py-5 md:px-6 md:py-6">
        <div className="space-y-2">
          <p className="text-[0.72rem] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
            Example Variants
          </p>
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              {activeExample.title}
            </h3>
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              {activeExample.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {ids.map((id) => {
            const example = calendarExamples[id]
            const isActive = activeId === id

            return (
              <button
                className={cn(
                  "rounded-full border px-3.5 py-2 text-sm transition-[background-color,border-color,color,box-shadow]",
                  isActive
                    ? "border-foreground/10 bg-foreground text-background shadow-[0_12px_30px_-18px_rgba(15,23,42,0.55)]"
                    : "border-border/70 bg-background text-muted-foreground hover:border-border hover:text-foreground"
                )}
                key={id}
                onClick={() => setActiveId(id)}
                type="button"
              >
                {example.tabLabel}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4 border-b border-border/70 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex flex-wrap gap-2">
          {activeExample.highlights.map((highlight) => (
            <span
              className="rounded-full border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground"
              key={highlight}
            >
              {highlight}
            </span>
          ))}
        </div>

        <div className="inline-flex rounded-full border border-border/70 bg-background p-1">
          <button
            className={cn(
              "rounded-full px-4 py-2 text-sm transition-colors",
              activeTab === "preview"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab("preview")}
            type="button"
          >
            Preview
          </button>
          <button
            className={cn(
              "rounded-full px-4 py-2 text-sm transition-colors",
              activeTab === "code"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActiveTab("code")}
            type="button"
          >
            Code
          </button>
        </div>
      </div>

      <div className="p-4 md:p-5">
        {activeTab === "preview" ? (
          <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-background/80 p-3 md:p-4">
            <ActivePreview />
          </div>
        ) : (
          <CodePanel
            code={activeSource.code}
            fileName={activeSource.fileName}
          />
        )}
      </div>
    </div>
  )
}
