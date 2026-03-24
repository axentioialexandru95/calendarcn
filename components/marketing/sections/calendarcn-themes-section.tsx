import { CalendarCnBackToTopButton } from "@/components/marketing/calendarcn-back-to-top-button"
import { CalendarCnThemeShowcase } from "@/components/marketing/calendarcn-theme-showcase"
import {
  CalendarCnSectionFrame,
  CalendarCnSectionHeading,
} from "@/components/marketing/sections/calendarcn-section-primitives"

type CalendarCnThemesSectionProps = {
  content: {
    backToTop: {
      href: string
      label: string
    }
    body: string
    eyebrow: string
    title: string
  }
  initialDateIso: string
}

export function CalendarCnThemesSection({
  content,
  initialDateIso,
}: CalendarCnThemesSectionProps) {
  return (
    <CalendarCnSectionFrame id="themes">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <CalendarCnSectionHeading
          body={content.body}
          eyebrow={content.eyebrow}
          title={content.title}
        />
        <CalendarCnBackToTopButton
          href={content.backToTop.href}
          label={content.backToTop.label}
        />
      </div>

      <CalendarCnThemeShowcase initialDateIso={initialDateIso} />
    </CalendarCnSectionFrame>
  )
}
