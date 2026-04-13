import Link from "next/link"

import { CalendarCnLogo } from "@/components/marketing/branding/logo"
import {
  CalendarCnSectionFrame,
  CalendarCnSectionHeading,
} from "@/components/marketing/sections"
import { Button } from "@/components/ui/button"
import type { getSeoLandingPage } from "@/lib/marketing/seo-pages"
import {
  primitiveInstallCommand,
  siteConfig,
  starterInstallCommand,
} from "@/lib/site-config"

type SeoLandingPageData = NonNullable<ReturnType<typeof getSeoLandingPage>>

const relatedLinkLabel = {
  alternative: "Comparison route",
  guide: "Builder route",
} as const

export function CalendarCnSeoLandingPage({
  page,
}: {
  page: SeoLandingPageData
}) {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border/70 bg-background/96 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="transition-opacity hover:opacity-85">
            <CalendarCnLogo
              className="gap-2"
              iconClassName="size-8 rounded-[0.95rem]"
              labelClassName="text-[1rem] text-foreground"
            />
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/docs/calendar">Docs</Link>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <a href={siteConfig.repoUrl} rel="noreferrer" target="_blank">
                GitHub
              </a>
            </Button>
          </div>
        </div>
      </header>

      <section className="border-b border-border/70 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--muted)_50%,transparent),transparent_38%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.1fr)_24rem] lg:px-8 lg:py-20">
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="inline-flex rounded-full border border-border/70 bg-background/75 px-3 py-1 text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
                {page.eyebrow}
              </span>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                  {page.heroTitle}
                </h1>
                <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
                  {page.heroBody}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/docs/calendar#installation">
                  Install now
                  <span aria-hidden className="text-base">
                    {"->"}
                  </span>
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/calendar-lab">Open demo</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/docs/calendar/api">Read API</Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {page.bestFit.map((item) => (
                <article
                  key={item}
                  className="rounded-[calc(var(--radius)*1.2)] border border-border/70 bg-card/80 p-4 shadow-xs"
                >
                  <p className="text-sm leading-6 text-muted-foreground">
                    {item}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <aside className="rounded-[calc(var(--radius)*1.7)] border border-border/70 bg-card p-5 shadow-xs">
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold tracking-[0.24em] text-primary uppercase">
                  Install route
                </p>
                <h2 className="text-xl font-semibold tracking-tight">
                  Start with the scheduler wrapper
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Use the starter bundle first to evaluate the current
                  CalendarCN experience quickly, then drop down to the primitive
                  install when you need more control.
                </p>
              </div>

              <CodeCard
                command={starterInstallCommand}
                label="Starter install"
              />
              <CodeCard
                command={primitiveInstallCommand}
                label="Primitive install"
              />
            </div>
          </aside>
        </div>
      </section>

      <CalendarCnSectionFrame>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <CalendarCnSectionHeading
            body={page.description}
            eyebrow={relatedLinkLabel[page.category]}
            title="What you get out of the box"
          />
          <div className="grid gap-4 md:grid-cols-2">
            {page.highlights.map((item) => (
              <article
                key={item}
                className="rounded-[calc(var(--radius)*1.35)] border border-border/70 bg-card p-5 shadow-xs"
              >
                <p className="text-sm leading-6 text-muted-foreground">
                  {item}
                </p>
              </article>
            ))}
          </div>
        </div>
      </CalendarCnSectionFrame>

      <CalendarCnSectionFrame className="bg-muted/15">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <CalendarCnSectionHeading
            body="Use these criteria to decide whether this route actually matches your product and evaluation context."
            eyebrow="Evaluation"
            title={page.evaluationTitle}
          />
          <div className="rounded-[calc(var(--radius)*1.5)] border border-border/70 bg-card p-6 shadow-xs">
            <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
              {page.evaluationPoints.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/80" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CalendarCnSectionFrame>

      <CalendarCnSectionFrame>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <CalendarCnSectionHeading
            body="Move from search intent into evaluation fast: docs, patterns, and API pages that match this use case."
            eyebrow="Next step"
            title="Go deeper without losing the install path"
          />
          <div className="grid gap-4 md:grid-cols-2">
            {page.relatedDocs.map((item) => (
              <Link
                key={item.href}
                className="group rounded-[calc(var(--radius)*1.35)] border border-border/70 bg-card p-5 shadow-xs transition-colors hover:border-primary/35"
                href={item.href}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Continue the evaluation with the matching implementation
                      detail.
                    </p>
                  </div>
                  <span
                    aria-hidden
                    className="mt-1 shrink-0 text-sm font-medium text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                  >
                    {"->"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </CalendarCnSectionFrame>
    </main>
  )
}

function CodeCard({ command, label }: { command: string; label: string }) {
  return (
    <div className="overflow-hidden rounded-[calc(var(--radius)*1.2)] border border-border/70 bg-zinc-950 shadow-xs">
      <div className="border-b border-zinc-800 px-4 py-2">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-zinc-400 uppercase">
          {label}
        </p>
      </div>
      <pre className="overflow-x-auto px-4 py-4 text-[12px] leading-6 text-zinc-100 sm:text-[13px]">
        <code>{command}</code>
      </pre>
    </div>
  )
}
