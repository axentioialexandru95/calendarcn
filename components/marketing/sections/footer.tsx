import { CalendarCnLogo } from "@/components/marketing/branding/logo"

type CalendarCnFooterSectionProps = {
  content: {
    body: string
    credit: {
      label: string
      siteHref: string
      siteLabel: string
    }
    support?: {
      helper?: string
      href: string
      label: string
    }
    title: string
  }
}

export function CalendarCnFooterSection({
  content,
}: CalendarCnFooterSectionProps) {
  return (
    <footer className="border-t border-border/70">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-3 text-center">
          <div className="flex justify-center">
            <CalendarCnLogo
              iconClassName="size-9 rounded-[1rem]"
              labelClassName="text-[1.08rem]"
            />
          </div>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-muted-foreground">
            {content.body}
          </p>
          {content.support ? (
            <div className="space-y-2 pt-2">
              <div className="flex justify-center">
                <a
                  className="inline-flex h-8 items-center justify-center gap-1 rounded-[min(var(--radius-md),10px)] border border-transparent bg-primary px-2.5 text-sm font-medium whitespace-nowrap text-primary-foreground transition-colors hover:bg-primary/80"
                  href={content.support.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  {content.support.label}
                </a>
              </div>
              {content.support.helper ? (
                <p className="text-xs text-muted-foreground">
                  {content.support.helper}
                </p>
              ) : null}
            </div>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {content.credit.label}
            {" · "}
            <a
              className="transition-colors hover:text-foreground"
              href={content.credit.siteHref}
              rel="noreferrer"
              target="_blank"
            >
              {content.credit.siteLabel}
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
