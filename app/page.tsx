import { CalendarCnLanding } from "@/components/marketing/landing"
import { setDateInTimeZone } from "@/lib/timezone-date"

export const dynamic = "force-dynamic"

const DEMO_TIME_ZONE = "Europe/Bucharest"

function getHomepageDemoInitialDateIso() {
  return setDateInTimeZone(new Date(), DEMO_TIME_ZONE, {
    hours: 9,
    minutes: 0,
    seconds: 0,
  }).toISOString()
}

export default function Page() {
  return <CalendarCnLanding initialDateIso={getHomepageDemoInitialDateIso()} />
}
