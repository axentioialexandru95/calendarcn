import { CalendarCnHeroSnippet } from "@/components/marketing/hero/snippet"

type CalendarCnHeroSectionProps = {
  content: {
    badge: string
    body: string
    points: string[]
    snippet: {
      body: string
      commands: string[]
      copiedLabel: string
      copyLabel: string
      eyebrow: string
      title: string
    }
    title: string
  }
  initialDateIso: string
}

export function CalendarCnHeroSection({
  content,
  initialDateIso,
}: CalendarCnHeroSectionProps) {
  return (
    <section
      id="top"
      className="relative isolate overflow-hidden border-b border-border/70"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-background" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklab, var(--color-background) 20%, transparent) 0%, color-mix(in oklab, var(--color-background) 80%, transparent) 26%, color-mix(in oklab, var(--color-background) 98%, transparent) 100%), radial-gradient(circle at 50% 0%, color-mix(in oklab, var(--color-primary) 18%, transparent), transparent 34%), radial-gradient(circle at 16% 18%, color-mix(in oklab, var(--color-primary) 9%, transparent), transparent 22%), radial-gradient(circle at 84% 16%, color-mix(in oklab, var(--color-muted) 70%, transparent), transparent 24%)",
          }}
        />
        <div className="absolute top-8 left-1/2 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/14" />
        <div className="absolute top-28 left-[8%] h-40 w-40 rounded-full bg-primary/8 blur-3xl dark:bg-primary/10" />
        <div className="absolute top-20 right-[8%] h-52 w-52 rounded-full bg-muted/70 blur-3xl dark:bg-muted/20" />
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-background via-background/86 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background via-background/72 to-transparent" />
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, color-mix(in oklab, var(--color-border) 90%, transparent), transparent)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-24 pb-18 sm:px-6 sm:pt-28 sm:pb-20 lg:px-8 lg:pt-32 lg:pb-24">
        <div className="mx-auto flex max-w-6xl min-w-0 flex-col items-center gap-10 text-center sm:gap-12">
          <div className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            {content.badge}
          </div>

          <div className="w-full max-w-4xl space-y-6 sm:space-y-7">
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-7xl">
              {content.title}
            </h1>
            <p className="mx-auto max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              {content.body}
            </p>

          </div>

          <CalendarCnHeroSnippet
            content={content.snippet}
            initialDateIso={initialDateIso}
          />
        </div>
      </div>
    </section>
  )
}
