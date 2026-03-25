import { CalendarShowcase } from "@/components/calendar/calendar-showcase"

export const dynamic = "force-static"

const DEMO_INITIAL_DATE_ISO = "2026-03-24T09:00:00.000Z"

export default function CalendarLabPage() {
  return (
    <CalendarShowcase
      initialDateIso={DEMO_INITIAL_DATE_ISO}
      variant="standalone"
    />
  )
}
