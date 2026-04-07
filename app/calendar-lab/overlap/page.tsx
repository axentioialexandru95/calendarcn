import { CalendarLabFixture } from "../_components/calendar-lab-fixture"

export const dynamic = "force-static"

const DEMO_INITIAL_DATE_ISO = "2026-03-24T09:00:00.000Z"

export default function CalendarLabOverlapPage() {
  return (
    <CalendarLabFixture
      initialDateIso={DEMO_INITIAL_DATE_ISO}
      scenario="overlap"
    />
  )
}
