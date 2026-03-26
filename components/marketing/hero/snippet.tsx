"use client"

import * as React from "react"
import { CheckIcon, CopyIcon, TerminalWindowIcon } from "@phosphor-icons/react"

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
}

const fallbackOrigin = "https://your-domain.com"
const shellTokenPattern =
  /(https?:\/\/[^\s]+)|(\b(?:npx|pnpm|cd)\b)|(\b(?:add|install|dev)\b)|(\b(?:calendarcn\.json|@calendarcn\/calendarcn)\b)|([/.@_-][A-Za-z0-9/_:-]*)/g

export function CalendarCnHeroSnippet({ content }: CalendarCnHeroSnippetProps) {
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
    <div className="w-full max-w-2xl min-w-0 overflow-hidden rounded-[calc(var(--radius)*1.8)] border border-border/70 bg-card/85 text-left shadow-[0_24px_60px_-36px_rgba(15,23,42,0.55)] backdrop-blur">
      <div className="flex flex-col gap-3 border-b border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-rose-400/80" />
            <span className="size-2.5 rounded-full bg-amber-400/80" />
            <span className="size-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] tracking-[0.28em] text-muted-foreground uppercase">
              {content.eyebrow}
            </p>
            <p className="text-sm font-medium text-foreground sm:truncate">
              {content.title}
            </p>
          </div>
        </div>

        <Button
          className="w-full sm:w-auto"
          onClick={handleCopy}
          size="sm"
          variant="outline"
        >
          {copied ? (
            <CheckIcon className="size-4" weight="bold" />
          ) : (
            <CopyIcon className="size-4" />
          )}
          {copied ? content.copiedLabel : content.copyLabel}
        </Button>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
        <div className="min-w-0 overflow-hidden rounded-[calc(var(--radius)*1.2)] border border-zinc-800/80 bg-zinc-950/95">
          <div className="flex items-center gap-2 border-b border-zinc-800/80 px-4 py-2.5 text-xs text-zinc-400">
            <TerminalWindowIcon className="size-4" />
            shell
          </div>
          <pre className="overflow-x-auto px-4 py-4 text-xs leading-6 sm:text-sm sm:leading-7">
            <code>
              {commands.map((line, index) => (
                <div
                  key={`${index}-${line}`}
                  className="grid grid-cols-[1.25rem_minmax(0,1fr)]"
                >
                  <span className="text-zinc-500 select-none">$</span>
                  <span className="block min-w-0 font-mono whitespace-pre text-zinc-100">
                    {highlightCommandLine(line)}
                  </span>
                </div>
              ))}
            </code>
          </pre>
        </div>

        <p className="text-sm leading-6 text-muted-foreground">
          {content.body}
        </p>
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
    return "text-emerald-300"
  }

  if (match[2]) {
    return "text-sky-300"
  }

  if (match[3]) {
    return "text-fuchsia-300"
  }

  if (match[4]) {
    return "text-amber-200"
  }

  return "text-amber-300"
}
