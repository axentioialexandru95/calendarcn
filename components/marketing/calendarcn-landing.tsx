import { CalendarCnCapabilityGrid } from "@/components/marketing/calendarcn-capability-grid"
import { CalendarCnFloatingNav } from "@/components/marketing/calendarcn-floating-nav"
import { CalendarCnThemeShowcase } from "@/components/marketing/calendarcn-theme-showcase"
import landingContent from "@/content/calendarcn-landing.json"
import { Button } from "@/components/ui/button"

export function CalendarCnLanding({
  initialDateIso,
}: {
  initialDateIso: string
}) {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <CalendarCnFloatingNav
        brand={landingContent.brand}
        items={landingContent.nav}
      />

      <section
        id="top"
        className="relative isolate overflow-hidden border-b border-border/70"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-background" />
          <div
            className="absolute inset-0 dark:hidden"
            style={{
              background:
                "radial-gradient(circle at 50% -8%, color-mix(in oklab, var(--color-primary) 18%, transparent), transparent 42%), radial-gradient(circle at 12% 18%, color-mix(in oklab, var(--color-primary) 9%, transparent), transparent 28%), radial-gradient(circle at 88% 14%, color-mix(in oklab, var(--color-muted) 60%, transparent), transparent 22%)",
            }}
          />
          <div
            className="absolute inset-0 hidden dark:block"
            style={{
              background:
                "linear-gradient(180deg, color-mix(in oklab, var(--color-background) 50%, transparent) 0%, color-mix(in oklab, var(--color-background) 82%, transparent) 44%, color-mix(in oklab, var(--color-background) 100%, transparent) 100%), radial-gradient(circle at 50% -8%, color-mix(in oklab, var(--color-primary) 24%, transparent), transparent 40%), radial-gradient(circle at 12% 18%, color-mix(in oklab, var(--color-primary) 12%, transparent), transparent 26%), radial-gradient(circle at 88% 14%, color-mix(in oklab, var(--color-muted) 58%, transparent), transparent 22%)",
            }}
          />
          <div className="absolute top-0 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/16" />
          <div className="absolute top-28 left-[8%] h-40 w-40 rounded-full bg-primary/8 blur-3xl dark:bg-primary/12" />
          <div className="absolute top-24 right-[10%] h-52 w-52 rounded-full bg-muted/90 blur-3xl dark:bg-muted/30" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background via-background/92 to-transparent dark:from-background dark:via-background/85" />
          <div
            className="absolute inset-x-0 bottom-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, color-mix(in oklab, var(--color-border) 90%, transparent), transparent)",
            }}
          />
        </div>

        <div className="relative mx-auto flex min-h-[68svh] max-w-5xl items-center justify-center px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="flex max-w-3xl flex-col items-center gap-6 text-center">
            <div className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              {landingContent.hero.badge}
            </div>

            <div className="space-y-5">
              <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                {landingContent.hero.title}
              </h1>
              <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                {landingContent.hero.body}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg">
                <a href={landingContent.hero.primaryCta.href}>
                  {landingContent.hero.primaryCta.label}
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={landingContent.hero.secondaryCta.href}>
                  {landingContent.hero.secondaryCta.label}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="components" className="border-b border-border/70">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-10 max-w-3xl space-y-3">
            <p className="text-sm font-medium text-primary">
              {landingContent.components.eyebrow}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {landingContent.components.title}
            </h2>
            <p className="text-base leading-7 text-muted-foreground">
              {landingContent.components.body}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {landingContent.components.items.map((primitive) => (
              <article
                key={primitive.name}
                className="rounded-3xl border border-border/70 bg-card p-6 shadow-xs"
              >
                <div className="space-y-4">
                  <div className="inline-flex rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                    {primitive.name}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold tracking-tight">
                      {primitive.title}
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {primitive.body}
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {primitive.detail}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="capabilities"
        className="border-b border-border/70 bg-muted/20"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-10 max-w-3xl space-y-3">
            <p className="text-sm font-medium text-primary">
              {landingContent.capabilities.eyebrow}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {landingContent.capabilities.title}
            </h2>
            <p className="text-base leading-7 text-muted-foreground">
              {landingContent.capabilities.body}
            </p>
          </div>
          <CalendarCnCapabilityGrid items={landingContent.capabilities.items} />
        </div>
      </section>

      <section className="border-b border-border/70">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-20">
          <div className="space-y-4">
            <p className="text-sm font-medium text-primary">
              {landingContent.integration.eyebrow}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {landingContent.integration.title}
            </h2>
            <p className="text-base leading-7 text-muted-foreground">
              {landingContent.integration.body}
            </p>
          </div>

          <div className="grid gap-4">
            {landingContent.integration.items.map((note) => (
              <div
                key={note}
                className="rounded-2xl border border-border/70 bg-card px-5 py-4 text-sm leading-6 text-muted-foreground shadow-xs"
              >
                {note}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="themes" className="border-b border-border/70">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <p className="text-sm font-medium text-primary">
                {landingContent.demo.eyebrow}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {landingContent.demo.title}
              </h2>
              <p className="text-base leading-7 text-muted-foreground">
                {landingContent.demo.body}
              </p>
            </div>
            <Button asChild variant="outline">
              <a href={landingContent.demo.backToTop.href}>
                {landingContent.demo.backToTop.label}
              </a>
            </Button>
          </div>

          <CalendarCnThemeShowcase initialDateIso={initialDateIso} />
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 rounded-3xl border border-border/70 bg-card p-6 shadow-xs sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">
              {landingContent.footer.eyebrow}
            </p>
            <h2 className="text-2xl font-semibold tracking-tight">
              {landingContent.footer.title}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {landingContent.footer.body}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <a href={landingContent.footer.primaryCta.href}>
                {landingContent.footer.primaryCta.label}
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={landingContent.footer.secondaryCta.href}>
                {landingContent.footer.secondaryCta.label}
              </a>
            </Button>
            <Button asChild variant="outline">
              <a
                href={landingContent.footer.externalCta.href}
                rel="noreferrer"
                target="_blank"
              >
                {landingContent.footer.externalCta.label}
              </a>
            </Button>
          </div>
        </div>
      </footer>
    </main>
  )
}
