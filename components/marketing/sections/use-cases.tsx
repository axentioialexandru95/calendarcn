import Link from "next/link"

import {
  CalendarCnSectionFrame,
  CalendarCnSectionHeading,
} from "@/components/marketing/sections/primitives"
import type { seoLandingPages } from "@/lib/marketing/seo-pages"

type CalendarCnUseCasesSectionProps = {
  audience: {
    bestFit: readonly string[]
    notFor: readonly string[]
  }
  content: {
    body: string
    eyebrow: string
    notForTitle: string
    title: string
    bestFitTitle: string
  }
  items: typeof seoLandingPages
}

export function CalendarCnUseCasesSection({
  audience,
  content,
  items,
}: CalendarCnUseCasesSectionProps) {
  return (
    <CalendarCnSectionFrame id="use-cases">
      <div className="space-y-10">
        <CalendarCnSectionHeading
          body={content.body}
          eyebrow={content.eyebrow}
          title={content.title}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <AudienceCard
            items={audience.bestFit}
            title={content.bestFitTitle}
            tone="good"
          />
          <AudienceCard
            items={audience.notFor}
            title={content.notForTitle}
            tone="muted"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.slug}
              className="group rounded-[calc(var(--radius)*1.5)] border border-border/70 bg-card p-6 shadow-xs transition-colors hover:border-primary/35"
              href={`/${item.slug}`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex rounded-full border border-border/70 bg-muted/50 px-2.5 py-1 text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
                    {item.category === "alternative"
                      ? "Alternative"
                      : "Use case"}
                  </span>
                  <span
                    aria-hidden
                    className="text-sm font-medium text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
                  >
                    {"->"}
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold tracking-tight text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </CalendarCnSectionFrame>
  )
}

function AudienceCard({
  items,
  title,
  tone,
}: {
  items: readonly string[]
  title: string
  tone: "good" | "muted"
}) {
  return (
    <article
      className={
        tone === "good"
          ? "rounded-[calc(var(--radius)*1.5)] border border-primary/18 bg-primary/6 p-6 shadow-xs"
          : "rounded-[calc(var(--radius)*1.5)] border border-border/70 bg-muted/25 p-6 shadow-xs"
      }
    >
      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
          {items.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-current opacity-70" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
