import * as React from "react"
import type { PointerEvent as ReactPointerEvent } from "react"

import { cn } from "../../lib/utils"

import type { CalendarClassNames } from "../../../types"
import { getCalendarSlotClassName } from "../../../utils"

import { formatTimeGridSlotLabel } from "./time-grid-utils"

type TimeSlotDropZoneProps = {
  active: boolean
  blocked: boolean
  classNames?: CalendarClassNames
  day: Date
  dayIndex: number
  focusVisible: boolean
  hourCycle?: 12 | 24
  isDragTarget: boolean
  isDraftDay: boolean
  locale?: string
  minuteOfDay: number
  onBeginCreate: (day: Date, minuteOfDay: number) => void
  onExtendCreate: (day: Date, minuteOfDay: number) => void
  onFocusCell: (dayIndex: number, minuteOfDay: number) => void
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
  dayIndex,
  focusVisible,
  hourCycle,
  isDragTarget,
  isDraftDay,
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
          isDraftDay ? "cursor-crosshair" : ""
        )
      )}
      onPointerDownCapture={() => onFocusCell(dayIndex, minuteOfDay)}
      onPointerDown={(event) => {
        if (event.button !== 0 || blocked) {
          return
        }

        if (event.pointerType === "touch") {
          onTouchCreatePointerDown?.(day, minuteOfDay, event)
          return
        }

        onBeginCreate(day, minuteOfDay)
      }}
      onPointerEnter={() => onExtendCreate(day, minuteOfDay)}
      role="gridcell"
    />
  )
}

export const MemoizedTimeSlotDropZone = React.memo(
  TimeSlotDropZone,
  (previousProps, nextProps) => {
    return (
      previousProps.active === nextProps.active &&
      previousProps.blocked === nextProps.blocked &&
      previousProps.classNames === nextProps.classNames &&
      previousProps.day.getTime() === nextProps.day.getTime() &&
      previousProps.dayIndex === nextProps.dayIndex &&
      previousProps.focusVisible === nextProps.focusVisible &&
      previousProps.hourCycle === nextProps.hourCycle &&
      previousProps.isDragTarget === nextProps.isDragTarget &&
      previousProps.isDraftDay === nextProps.isDraftDay &&
      previousProps.locale === nextProps.locale &&
      previousProps.minuteOfDay === nextProps.minuteOfDay &&
      previousProps.onBeginCreate === nextProps.onBeginCreate &&
      previousProps.onExtendCreate === nextProps.onExtendCreate &&
      previousProps.onFocusCell === nextProps.onFocusCell &&
      previousProps.onTouchCreatePointerDown ===
        nextProps.onTouchCreatePointerDown &&
      previousProps.slotId === nextProps.slotId &&
      previousProps.timeZone === nextProps.timeZone
    )
  }
)
