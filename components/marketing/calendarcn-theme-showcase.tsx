"use client"

import { CalendarShowcase } from "@/components/calendar/calendar-showcase"

export function CalendarCnThemeShowcase({
  initialDateIso,
}: {
  initialDateIso: string
}) {
  return <CalendarShowcase initialDateIso={initialDateIso} variant="embed" />
}
