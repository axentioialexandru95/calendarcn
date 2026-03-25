import { CalendarCnCapabilityGrid } from "@/components/marketing/shared/capability-grid"
import {
  CalendarCnSectionFrame,
  CalendarCnSectionHeading,
} from "@/components/marketing/sections/primitives"

type CalendarCnCapabilitiesSectionProps = {
  content: {
    body: string
    eyebrow: string
    items: Array<{
      body: string
      icon: string
      title: string
    }>
    title: string
  }
}

export function CalendarCnCapabilitiesSection({
  content,
}: CalendarCnCapabilitiesSectionProps) {
  return (
    <CalendarCnSectionFrame className="bg-muted/20" id="capabilities">
      <CalendarCnSectionHeading
        body={content.body}
        className="mb-10"
        eyebrow={content.eyebrow}
        title={content.title}
      />
      <CalendarCnCapabilityGrid items={content.items} />
    </CalendarCnSectionFrame>
  )
}
