import { cn } from "@/lib/utils"

import type { CalendarClassNames, CalendarSlot } from "./types"

export function getCalendarSlotClassName(
  classNames: CalendarClassNames | undefined,
  slot: CalendarSlot,
  ...values: Array<string | undefined>
) {
  return cn(values, classNames?.[slot])
}

export * from "./internal/utils/calendar/date-range"
export * from "./internal/utils/calendar/formatting"
export * from "./internal/utils/calendar/occurrences"
export * from "./internal/utils/calendar/operations"
export * from "./internal/utils/calendar/permissions"
export * from "./internal/utils/calendar/ics"
