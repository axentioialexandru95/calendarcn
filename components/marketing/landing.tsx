import { CalendarCnFloatingNav } from "@/components/marketing/navigation/floating-nav"
import {
  CalendarCnCapabilitiesSection,
  CalendarCnComponentsSection,
  CalendarCnFooterSection,
  CalendarCnHeroSection,
  CalendarCnIntegrationSection,
  CalendarCnThemesSection,
} from "@/components/marketing/sections"
import landingContent from "@/content/calendarcn-landing.json"

export function CalendarCnLanding({
  initialDateIso,
}: {
  initialDateIso: string
}) {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <CalendarCnFloatingNav items={landingContent.nav} />
      <CalendarCnHeroSection
        content={landingContent.hero}
        initialDateIso={initialDateIso}
      />
      <CalendarCnComponentsSection content={landingContent.components} />
      <CalendarCnCapabilitiesSection content={landingContent.capabilities} />
      <CalendarCnIntegrationSection content={landingContent.integration} />
      <CalendarCnThemesSection
        content={landingContent.demo}
        initialDateIso={initialDateIso}
      />
      <CalendarCnFooterSection content={landingContent.footer} />
    </main>
  )
}
