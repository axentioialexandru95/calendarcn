import { CalendarCnHeroSnippet } from "@/components/marketing/calendarcn-hero-snippet"
import DarkVeil from "@/components/dark-veil"

type CalendarCnHeroSectionProps = {
  content: {
    badge: string
    body: string
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
}

export function CalendarCnHeroSection({ content }: CalendarCnHeroSectionProps) {
  return (
    <section
      id="top"
      className="relative isolate overflow-hidden border-b border-border/70"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-background" />
        <div
          className="absolute inset-0 opacity-45 dark:opacity-95"
          style={{
            filter: "saturate(1.08) brightness(0.92) contrast(1.06)",
          }}
        >
          <DarkVeil
            hueShift={18}
            noiseIntensity={0.02}
            resolutionScale={1}
            scanlineFrequency={1.8}
            scanlineIntensity={0.05}
            speed={0.34}
            warpAmount={0.18}
          />
        </div>
        <div
          className="absolute inset-0 dark:hidden"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklab, white 66%, transparent) 0%, color-mix(in oklab, white 82%, transparent) 24%, color-mix(in oklab, white 92%, transparent) 54%, color-mix(in oklab, white 97%, transparent) 100%), radial-gradient(circle at 50% -8%, color-mix(in oklab, var(--color-primary) 16%, transparent), transparent 42%), radial-gradient(circle at 12% 18%, color-mix(in oklab, var(--color-primary) 8%, transparent), transparent 28%), radial-gradient(circle at 88% 14%, color-mix(in oklab, var(--color-muted) 54%, transparent), transparent 24%)",
          }}
        />
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklab, var(--color-background) 20%, transparent) 0%, color-mix(in oklab, var(--color-background) 46%, transparent) 20%, color-mix(in oklab, var(--color-background) 74%, transparent) 52%, color-mix(in oklab, var(--color-background) 96%, transparent) 100%), radial-gradient(circle at 50% -8%, color-mix(in oklab, var(--color-primary) 18%, transparent), transparent 40%), radial-gradient(circle at 14% 20%, color-mix(in oklab, var(--color-primary) 8%, transparent), transparent 26%), radial-gradient(circle at 86% 14%, color-mix(in oklab, var(--color-muted) 18%, transparent), transparent 24%)",
          }}
        />
        <div className="absolute top-0 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20" />
        <div className="absolute top-28 left-[8%] h-40 w-40 rounded-full bg-primary/8 blur-3xl dark:bg-primary/12" />
        <div className="absolute top-24 right-[10%] h-52 w-52 rounded-full bg-muted/90 blur-3xl dark:bg-muted/22" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background via-background/88 to-transparent dark:from-background dark:via-background/60" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background via-background/70 to-transparent dark:via-background/42" />
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, color-mix(in oklab, var(--color-border) 90%, transparent), transparent)",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-[68svh] max-w-5xl items-center justify-center px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="flex w-full max-w-3xl min-w-0 flex-col items-center gap-7 text-center sm:gap-8">
          <div className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            {content.badge}
          </div>

          <div className="w-full space-y-6 sm:space-y-7">
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {content.title}
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              {content.body}
            </p>
          </div>

          <CalendarCnHeroSnippet content={content.snippet} />
        </div>
      </div>
    </section>
  )
}
