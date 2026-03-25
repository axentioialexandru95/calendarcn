"use client"

import * as React from "react"

import { CodePanel } from "@/components/docs/code-panel"
import { cn } from "@/lib/utils"

type PreviewCodeTabsProps = {
  className?: string
  code: string
  fileName?: string
  preview: React.ReactNode
}

export function PreviewCodeTabs({
  className,
  code,
  fileName,
  preview,
}: PreviewCodeTabsProps) {
  const [activeTab, setActiveTab] = React.useState<"preview" | "code">(
    "preview"
  )

  return (
    <div className={cn("space-y-4", className)}>
      <div className="inline-flex rounded-full border border-border/70 bg-card p-1">
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

      {activeTab === "preview" ? (
        <div className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/70 p-3 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]">
          {preview}
        </div>
      ) : (
        <CodePanel code={code} fileName={fileName} />
      )}
    </div>
  )
}
