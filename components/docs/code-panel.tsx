"use client"

import * as React from "react"
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CodePanelProps = {
  className?: string
  code: string
  fileName?: string
  lang?: string
}

const extensionLanguageMap: Record<string, string> = {
  bash: "bash",
  cjs: "js",
  css: "css",
  html: "html",
  js: "js",
  json: "json",
  jsx: "jsx",
  md: "md",
  mdx: "mdx",
  mjs: "js",
  sh: "bash",
  ts: "ts",
  tsx: "tsx",
  txt: "text",
  yaml: "yaml",
  yml: "yaml",
  zsh: "bash",
}

function inferLanguage(fileName?: string) {
  if (!fileName) {
    return "tsx"
  }

  const normalizedFileName = fileName.toLowerCase()

  if (normalizedFileName === "terminal") {
    return "bash"
  }

  const extension = normalizedFileName.split(".").pop()

  if (!extension) {
    return "tsx"
  }

  return extensionLanguageMap[extension] ?? "text"
}

export function CodePanel({ className, code, fileName, lang }: CodePanelProps) {
  const [copied, setCopied] = React.useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1_500)
  }

  return (
    <DynamicCodeBlock
      code={code}
      codeblock={{
        Actions: ({ className: actionsClassName }) => (
          <div className={actionsClassName}>
            <Button
              className="border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 hover:text-zinc-100"
              onClick={handleCopy}
              size="sm"
              variant="outline"
            >
              {copied ? "Copied" : "Copy code"}
            </Button>
          </div>
        ),
        "data-line-numbers": true,
        allowCopy: false,
        className: cn(
          "my-0 overflow-hidden rounded-[1.5rem] border border-zinc-800 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.45)]",
          "[&>div:first-child]:h-auto [&>div:first-child]:border-zinc-800 [&>div:first-child]:bg-zinc-950 [&>div:first-child]:px-4 [&>div:first-child]:py-3 [&>div:first-child]:text-zinc-400",
          "[&_.shiki]:text-[13px] [&_.shiki]:leading-6 [&_.shiki]:font-mono [&_.shiki]:[tab-size:2]",
          "[&_figcaption]:font-mono [&_figcaption]:text-xs",
          className
        ),
        icon: (
          <span aria-hidden="true" className="inline-flex gap-1">
            <span className="size-2 rounded-full bg-rose-400/80" />
            <span className="size-2 rounded-full bg-amber-400/80" />
            <span className="size-2 rounded-full bg-emerald-400/80" />
          </span>
        ),
        keepBackground: true,
        title: fileName ?? "source.tsx",
        viewportProps: {
          className: "max-h-[42rem] overflow-auto px-0 py-0",
        },
      }}
      lang={lang ?? inferLanguage(fileName)}
      options={{
        theme: "github-dark",
      }}
    />
  )
}
