"use client"

import * as React from "react"
import {
  ArrowClockwiseIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CheckIcon,
  CopyIcon,
  ShareNetworkIcon,
} from "@phosphor-icons/react"

import { CalendarShowcase } from "@/components/calendar/calendar-showcase"
import { Button } from "@/components/ui/button"

type CalendarCnHeroSnippetProps = {
  content: {
    body: string
    commands: string[]
    copyLabel: string
    copiedLabel: string
    eyebrow: string
    title: string
  }
  initialDateIso: string
}

const fallbackOrigin = "https://calendarcn.phantomtechind.com"
const shellTokenPattern =
  /(https?:\/\/[^\s]+)|(\b(?:npx|pnpm|npm|bun)\b)|(\b(?:add|install)\b)|(\b(?:shadcn@latest|calendarcn\.json)\b)|([/.@_-][A-Za-z0-9/_:-]*)/g

export function CalendarCnHeroSnippet({
  content,
  initialDateIso,
}: CalendarCnHeroSnippetProps) {
  const [copied, setCopied] = React.useState(false)
  const [origin, setOrigin] = React.useState(fallbackOrigin)

  React.useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const commands = React.useMemo(
    () => content.commands.map((line) => line.replaceAll("{origin}", origin)),
    [content.commands, origin]
  )

  async function handleCopy() {
    await navigator.clipboard.writeText(commands.join("\n"))
    setCopied(true)
    window.setTimeout(() => {
      setCopied(false)
    }, 1800)
  }

  return (
    <div className="relative w-full min-w-0 max-w-6xl">
      <div className="pointer-events-none absolute inset-x-8 -bottom-10 h-36 rounded-full bg-primary/10 blur-3xl dark:bg-primary/12" />

      <div className="mx-auto mb-12 w-full max-w-xl text-left">
        <div className="relative rounded-[calc(var(--radius)*1.05)] border border-border/70 bg-background/75 px-3 py-2.5 pr-12 shadow-xs">
          <code className="block break-all font-mono text-[12px] leading-5 text-foreground sm:text-[13px]">
            {highlightCommandLine(commands[0])}
          </code>
          <Button
            aria-label={copied ? content.copiedLabel : content.copyLabel}
            className="absolute top-1/2 right-2 -translate-y-1/2 active:translate-y-[-50%]"
            onClick={handleCopy}
            size="icon-sm"
            variant="ghost"
          >
            {copied ? (
              <CheckIcon className="size-4" weight="bold" />
            ) : (
              <CopyIcon className="size-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[calc(var(--radius)*2.3)] border border-border/70 bg-card/88 text-left shadow-[0_32px_90px_-48px_rgba(15,23,42,0.62)] backdrop-blur">
        <div className="flex items-center justify-between gap-4 border-b border-border/70 bg-muted/55 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-rose-400/80" />
            <span className="size-2.5 rounded-full bg-amber-400/80" />
            <span className="size-2.5 rounded-full bg-emerald-400/80" />
            <div className="ml-4 hidden items-center gap-1 text-muted-foreground/70 md:flex">
              <CaretLeftIcon className="size-4" />
              <CaretRightIcon className="size-4" />
            </div>
          </div>

          <div className="hidden min-w-0 flex-1 items-center justify-center md:flex">
            <p className="relative w-full max-w-lg truncate rounded-full border border-border/70 bg-background/90 px-4 py-1.5 text-center text-sm text-muted-foreground shadow-xs">
              {origin}
              <ArrowClockwiseIcon className="absolute top-1/2 right-3 size-3.5 -translate-y-1/2" />
            </p>
          </div>

          <div className="hidden items-center gap-3 pr-0.5 text-muted-foreground/60 sm:flex">
            <ShareNetworkIcon className="size-4" />
            <CopyIcon className="size-4" />
          </div>
        </div>

        <div className="border-b border-border/70 bg-background/82 px-4 py-4 sm:px-6">
          <div className="max-w-3xl space-y-2">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold tracking-[0.28em] text-muted-foreground uppercase">
                {content.eyebrow}
              </p>
              <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                {content.title}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {content.body}
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-[linear-gradient(180deg,color-mix(in_oklab,var(--muted)_42%,transparent),transparent_20%)]">
          <CalendarShowcase initialDateIso={initialDateIso} variant="hero" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card via-card/55 to-transparent" />
        </div>
      </div>
    </div>
  )
}

function highlightCommandLine(line: string) {
  const tokens: React.ReactNode[] = []
  let lastIndex = 0

  for (const match of line.matchAll(shellTokenPattern)) {
    const token = match[0]
    const index = match.index ?? 0

    if (lastIndex < index) {
      tokens.push(line.slice(lastIndex, index))
    }

    tokens.push(
      <span key={`${index}-${token}`} className={getShellTokenClassName(match)}>
        {token}
      </span>
    )

    lastIndex = index + token.length
  }

  if (lastIndex < line.length) {
    tokens.push(line.slice(lastIndex))
  }

  return tokens
}

function getShellTokenClassName(match: RegExpMatchArray) {
  if (match[1]) {
    return "text-sky-500 dark:text-sky-300"
  }

  if (match[2]) {
    return "text-fuchsia-600 dark:text-fuchsia-300"
  }

  if (match[3]) {
    return "text-emerald-600 dark:text-emerald-300"
  }

  if (match[4]) {
    return "text-amber-700 dark:text-amber-300"
  }

  return "text-muted-foreground"
}
