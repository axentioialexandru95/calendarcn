import { calendarSlots, type CalendarClassNames } from "../../types"
import { cn } from "../lib/utils"

export function mergeCalendarClassNames(
  ...classNameSets: Array<CalendarClassNames | undefined>
) {
  const mergedClassNames: CalendarClassNames = {}

  for (const slot of calendarSlots) {
    const slotClassName = cn(
      classNameSets.map((classNames) => classNames?.[slot])
    )

    if (slotClassName) {
      mergedClassNames[slot] = slotClassName
    }
  }

  return Object.keys(mergedClassNames).length > 0 ? mergedClassNames : undefined
}
