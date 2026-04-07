"use client"

import { CalendarRoot as InternalCalendarScheduler } from "./internal/elements/root"
import { mergeCalendarClassNames } from "./internal/utils/class-names"
import type { CalendarRootProps as CalendarSchedulerProps } from "./internal/shared"
import type { CalendarClassNames } from "./types"

const starterSelectedEventClassNames = {
  agendaEvent:
    "data-[selected=true]:border-ring data-[selected=true]:ring-2 data-[selected=true]:ring-ring/60",
  monthEvent:
    "data-[selected=true]:border-ring data-[selected=true]:ring-2 data-[selected=true]:ring-ring/60",
  timeGridEvent:
    "data-[selected=true]:border-ring data-[selected=true]:ring-2 data-[selected=true]:ring-ring/60",
} satisfies CalendarClassNames

export function CalendarScheduler({
  classNames,
  ...props
}: CalendarSchedulerProps) {
  return (
    <InternalCalendarScheduler
      {...props}
      classNames={mergeCalendarClassNames(
        starterSelectedEventClassNames,
        classNames
      )}
    />
  )
}

export type { CalendarSchedulerProps }
