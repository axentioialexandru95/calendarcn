import { Fragment, type ReactNode } from "react"

import {
  CalendarCnSectionFrame,
  CalendarCnSectionHeading,
} from "@/components/marketing/sections/primitives"

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
    <CalendarCnSectionFrame
      className="bg-[linear-gradient(180deg,color-mix(in_oklab,var(--muted)_48%,transparent),transparent_44%)]"
      id="integration"
      containerClassName="max-w-7xl"
    >
      <div className="min-w-0 space-y-8">
        <CalendarCnSectionHeading
          body={content.body}
          eyebrow={content.eyebrow}
          title={content.title}
        />

        <article className="min-w-0 overflow-hidden rounded-[calc(var(--radius)*1.8)] border border-border/70 bg-card shadow-xs">
          <div className="flex items-center justify-between gap-4 border-b border-border/70 bg-card px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-rose-400/80" />
                <span className="size-2.5 rounded-full bg-amber-400/80" />
                <span className="size-2.5 rounded-full bg-emerald-400/80" />
              </div>
              <p className="text-[11px] tracking-[0.28em] text-muted-foreground uppercase">
                {content.codeTitle}
              </p>
            </div>
            <span className="hidden rounded-full border border-border/80 bg-muted/60 px-2.5 py-1 text-[10px] font-medium tracking-[0.24em] text-muted-foreground uppercase sm:inline-flex">
              Controlled React surface
            </span>
          </div>
          <pre className="overflow-x-auto bg-zinc-950 px-0 py-4 text-xs leading-6 sm:text-sm sm:leading-7">
            <code>
              {content.codeLines.map((line, index) => (
                <div
                  key={`${index}-${line}`}
                  className="grid grid-cols-[2.5rem_minmax(0,1fr)] px-4 sm:grid-cols-[3rem_minmax(0,1fr)] sm:px-5"
                >
                  <span className="pr-4 text-right text-xs text-zinc-500 select-none">
                    {index + 1}
                  </span>
                  <span className="block min-w-0 font-mono whitespace-pre text-zinc-100">
                    {highlightCodeLine(line)}
                  </span>
                </div>
              ))}
            </code>
          </pre>
        </article>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold tracking-[0.24em] text-primary uppercase">
              Integration notes
            </p>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              What this controlled setup actually gives you
            </h3>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
              Your app owns the scheduling truth. CalendarCN turns that state
              into visible occurrences and returns user actions through handlers
              you control.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {content.flow.map((item) => (
              <article
                key={item.title}
                className="rounded-[calc(var(--radius)*1.4)] border border-border/70 bg-card/92 p-5 shadow-xs"
              >
                <div className="min-w-0">
                  <h4 className="text-lg font-semibold tracking-tight text-foreground">
                    {item.title}
                  </h4>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {renderInlineCode(item.body)}
                  </p>
                </div>
              </article>
            ))}
          </div>
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

function renderInlineCode(text: string) {
  return text.split(/(`[^`]+`)/g).map((segment, index) => {
    if (!segment) {
      return null
    }

    if (segment.startsWith("`") && segment.endsWith("`")) {
      return (
        <code
          key={`${segment}-${index}`}
          className="rounded-md bg-foreground/6 px-1.5 py-0.5 font-mono text-[0.92em] text-foreground"
        >
          {segment.slice(1, -1)}
        </code>
      )
    }

    return <Fragment key={`${segment}-${index}`}>{segment}</Fragment>
  })
}
