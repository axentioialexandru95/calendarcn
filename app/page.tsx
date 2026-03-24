import { CalendarShowcase } from "@/components/calendar/calendar-showcase"

export default function Page() {
  return <CalendarShowcase initialDateIso={new Date().toISOString()} />
}
