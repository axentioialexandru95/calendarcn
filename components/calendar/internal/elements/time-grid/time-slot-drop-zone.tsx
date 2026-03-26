import type { PointerEvent as ReactPointerEvent } from "react"

import { isSameDay } from "date-fns"

import { cn } from "../../lib/utils"

import type { CalendarClassNames, CalendarCreateDraft } from "../../../types"
import { getCalendarSlotClassName } from "../../../utils"

import { formatTimeGridSlotLabel } from "./time-grid-utils"

type TimeSlotDropZoneProps = {
  active: boolean
  blocked: boolean
  classNames?: CalendarClassNames
  day: Date
  draft: CalendarCreateDraft | null
  focusVisible: boolean
  hourCycle?: 12 | 24
  isDragTarget: boolean
  locale?: string
  minuteOfDay: number
  onBeginCreate: () => void
  onExtendCreate: () => void
  onFocusCell: () => void
  onTouchCreatePointerDown?: (
    day: Date,
    minuteOfDay: number,
    event: ReactPointerEvent<HTMLDivElement>
  ) => void
  slotId: string
  timeZone?: string
}

export function TimeSlotDropZone({
  active,
  blocked,
  classNames,
  day,
  draft,
  focusVisible,
  hourCycle,
  isDragTarget,
  locale,
  minuteOfDay,
  onBeginCreate,
  onExtendCreate,
  onFocusCell,
  onTouchCreatePointerDown,
  slotId,
  timeZone,
}: TimeSlotDropZoneProps) {
  return (
    <div
      aria-disabled={blocked || undefined}
      aria-label={formatTimeGridSlotLabel(day, minuteOfDay, {
        blocked,
        hourCycle,
        locale,
        timeZone,
      })}
      aria-selected={active}
      data-calendar-drop-target-day={day.toISOString()}
      data-calendar-drop-target-kind="slot"
      data-calendar-drop-target-minute={minuteOfDay}
      id={slotId}
      className={getCalendarSlotClassName(
        classNames,
        "timeGridSlot",
        cn(
          "h-full border-b border-border/50 text-left transition-colors",
          isDragTarget ? "bg-muted/70" : "",
          active && focusVisible
            ? "bg-primary/8 ring-2 ring-primary/35 ring-inset"
            : "",
          blocked ? "cursor-not-allowed" : "",
          draft && isSameDay(draft.day, day) ? "cursor-crosshair" : ""
        )
      )}
      onPointerDownCapture={onFocusCell}
      onPointerDown={(event) => {
        if (event.button !== 0 || blocked) {
          return
        }

        if (event.pointerType === "touch") {
          onTouchCreatePointerDown?.(day, minuteOfDay, event)
          return
        }

        onBeginCreate()
      }}
      onPointerEnter={onExtendCreate}
      role="gridcell"
    />
  )
}
