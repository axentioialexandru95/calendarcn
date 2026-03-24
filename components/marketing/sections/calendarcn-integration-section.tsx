import type { ReactNode } from "react"

import {
  CalendarCnSectionFrame,
  CalendarCnSectionHeading,
} from "@/components/marketing/sections/calendarcn-section-primitives"

type CalendarCnIntegrationSectionProps = {
  content: {
    body: string
    codeLines: string[]
    codeTitle: string
    eyebrow: string
    flow: Array<{
      body: string
      title: string
    }>
    title: string
  }
}

export function CalendarCnIntegrationSection({
  content,
}: CalendarCnIntegrationSectionProps) {
  return (
    <CalendarCnSectionFrame>
      <div className="grid gap-8 xl:grid-cols-[0.88fr_1.12fr]">
        <div className="space-y-6">
          <CalendarCnSectionHeading
            body={content.body}
            eyebrow={content.eyebrow}
            title={content.title}
          />

          <article className="overflow-hidden rounded-[calc(var(--radius)*1.8)] border border-border/70 bg-card shadow-xs">
            <div className="border-b border-border/70 px-5 py-3">
              <p className="text-[11px] tracking-[0.28em] text-muted-foreground uppercase">
                {content.codeTitle}
              </p>
            </div>
            <pre className="overflow-x-auto bg-zinc-950 px-0 py-4 text-sm leading-7">
              <code>
                {content.codeLines.map((line, index) => (
                  <div
                    key={`${index}-${line}`}
                    className="grid grid-cols-[3rem_1fr] px-5"
                  >
                    <span className="pr-4 text-right text-xs text-zinc-500 select-none">
                      {index + 1}
                    </span>
                    <span className="font-mono whitespace-pre text-zinc-100">
                      {highlightCodeLine(line)}
                    </span>
                  </div>
                ))}
              </code>
            </pre>
          </article>
        </div>

        <div className="grid gap-4">
          {content.flow.map((item, index) => (
            <article
              key={item.title}
              className="rounded-[calc(var(--radius)*1.6)] border border-border/70 bg-card/90 p-5 shadow-xs"
            >
              <div className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-background text-sm font-semibold text-foreground">
                  {index + 1}
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {item.body}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </CalendarCnSectionFrame>
  )
}

const tokenPattern =
  /(".*?")|(\b(?:import|from|const|type|new)\b)|(\b(?:useState)\b)|(\b(?:CalendarRoot|CalendarEvent)\b)|(\b(?:date|events|view|blockedRanges|availableViews|hiddenDays|businessHours|density|hourCycle|locale|scrollToTime|onDateChange|onViewChange)\b(?==))|(<\/?[A-Z][A-Za-z0-9]*)|(\/?>)|([{}[\](),.=<>])/g

function highlightCodeLine(line: string) {
  const tokens: ReactNode[] = []
  let lastIndex = 0

  for (const match of line.matchAll(tokenPattern)) {
    const token = match[0]
    const index = match.index ?? 0

    if (lastIndex < index) {
      tokens.push(line.slice(lastIndex, index))
    }

    tokens.push(
      <span
        key={`${index}-${token}`}
        className={getTokenClassName(match)}
      >
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

function getTokenClassName(match: RegExpMatchArray) {
  if (match[1]) {
    return "text-emerald-300"
  }

  if (match[2]) {
    return "text-fuchsia-300"
  }

  if (match[3]) {
    return "text-sky-300"
  }

  if (match[4]) {
    return "text-violet-300"
  }

  if (match[5]) {
    return "text-amber-300"
  }

  if (match[6]) {
    return "text-sky-300"
  }

  if (match[7]) {
    return "text-zinc-400"
  }

  return "text-zinc-500"
}
