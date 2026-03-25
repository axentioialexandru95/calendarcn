import { CalendarCnLanding } from "@/components/marketing/landing"

export const dynamic = "force-static"

const DEMO_INITIAL_DATE_ISO = "2026-03-24T09:00:00.000Z"

export default function Page() {
  return <CalendarCnLanding initialDateIso={DEMO_INITIAL_DATE_ISO} />
}
