"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CodePanelProps = {
  className?: string
  code: string
  fileName?: string
}

export function CodePanel({ className, code, fileName }: CodePanelProps) {
  const [copied, setCopied] = React.useState(false)
  const lines = React.useMemo(() => code.split("\n"), [code])

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1_500)
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[1.5rem] border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          <span className="inline-flex gap-1">
            <span className="size-2 rounded-full bg-rose-400/80" />
            <span className="size-2 rounded-full bg-amber-400/80" />
            <span className="size-2 rounded-full bg-emerald-400/80" />
          </span>
          <span className="font-mono">{fileName ?? "source.tsx"}</span>
        </div>
        <Button
          className="border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-zinc-100"
          onClick={handleCopy}
          size="sm"
          variant="outline"
        >
          {copied ? "Copied" : "Copy code"}
        </Button>
      </div>
      <div className="max-h-[42rem] overflow-auto">
        <pre className="overflow-x-auto px-4 py-4 text-[13px] leading-6">
          <code className="grid min-w-full gap-y-0.5">
            {lines.map((line, index) => (
              <span className="grid grid-cols-[auto_1fr] gap-4" key={index}>
                <span className="select-none text-right font-mono text-xs text-zinc-600">
                  {index + 1}
                </span>
                <span className="font-mono whitespace-pre text-zinc-100">
                  {line || " "}
                </span>
              </span>
            ))}
          </code>
        </pre>
      </div>
    </div>
  )
}
