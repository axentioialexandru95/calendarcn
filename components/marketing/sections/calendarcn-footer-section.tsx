import { CalendarCnLogo } from "@/components/marketing/calendarcn-logo"

type CalendarCnFooterSectionProps = {
  content: {
    body: string
    credit: {
      label: string
      siteHref: string
      siteLabel: string
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
