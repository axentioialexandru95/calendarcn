import type { CSSProperties } from "react"

import { addDays, addMinutes, startOfDay } from "date-fns"

import type {
  CalendarDragData,
  CalendarDropTarget,
  CalendarMoveOperation,
  CalendarOccurrence,
  CalendarResizeOperation,
  CalendarSurfaceShadow,
} from "../../../types"
import {
  clampResize,
  copyTimeParts,
  getDaySpan,
  setMinuteOfDay,
} from "../../../utils"

export const dragActivationDistance = 6

export type ActiveDragInteraction = {
  currentClientX: number
  currentClientY: number
  initialClientX: number
  initialClientY: number
  isDragging: boolean
  pointerId: number
}

export type ActiveResizeState = {
  edge: "start" | "end"
  occurrence: CalendarOccurrence
  pointerId: number
}

export function getCalendarSurfaceShadowClassName(
  surfaceShadow: CalendarSurfaceShadow
) {
  if (surfaceShadow === "sm") {
    return "shadow-[0_12px_36px_-24px_rgba(15,23,42,0.28)]"
  }

  if (surfaceShadow === "md") {
    return "shadow-[0_20px_80px_-48px_rgba(15,23,42,0.55)]"
  }

  return undefined
}

export function getPreviewOccurrence(
  activeDrag: CalendarDragData,
  target: CalendarDropTarget,
  slotDuration: number,
  dragOffsetMinutes = 0
) {
  if (activeDrag.kind === "event") {
    const operation = getMoveOperation(
      activeDrag.occurrence,
      target,
      activeDrag.variant === "time-grid" ? dragOffsetMinutes : 0
    )

    return {
      ...activeDrag.occurrence,
      start: operation.nextStart,
      end: operation.nextEnd,
      allDay: operation.allDay ?? activeDrag.occurrence.allDay,
    }
  }

  const operation = getResizeOperation(
    activeDrag.occurrence,
    activeDrag.edge,
    target,
    slotDuration
  )

  return {
    ...activeDrag.occurrence,
    start: operation.nextStart,
    end: operation.nextEnd,
  }
}

export function getMoveOperation(
  occurrence: CalendarOccurrence,
  target: CalendarDropTarget,
  dragOffsetMinutes = 0
): CalendarMoveOperation {
  const durationMs = occurrence.end.getTime() - occurrence.start.getTime()
  let nextStart: Date
  let nextEnd: Date
  let allDay = occurrence.allDay

  if (target.kind === "slot") {
    const durationMinutes = Math.max(1, Math.round(durationMs / 60_000))
    const latestStartMinute = Math.max(
      0,
      1_440 - Math.min(durationMinutes, 1_440)
    )
    const nextStartMinute = Math.min(
      latestStartMinute,
      Math.max(0, target.minuteOfDay - dragOffsetMinutes)
    )

    nextStart = setMinuteOfDay(startOfDay(target.day), nextStartMinute)
    nextEnd = new Date(nextStart.getTime() + durationMs)
    allDay = false
  } else {
    allDay = target.kind === "all-day" || occurrence.allDay

    if (allDay) {
      nextStart = startOfDay(target.day)
      nextEnd = addDays(nextStart, getDaySpan(occurrence))
    } else {
      nextStart = copyTimeParts(startOfDay(target.day), occurrence.start)
      nextEnd = new Date(nextStart.getTime() + durationMs)
    }
  }

  return {
    occurrence,
    nextStart,
    nextEnd,
    previousStart: occurrence.start,
    previousEnd: occurrence.end,
    allDay,
  }
}

export function getDragOffsetMinutes(
  dragData: CalendarDragData,
  dragRect: DOMRect | null,
  clientY: number
) {
  if (
    dragData.kind !== "event" ||
    dragData.variant !== "time-grid" ||
    dragData.occurrence.allDay ||
    !dragRect ||
    dragRect.height <= 0
  ) {
    return 0
  }

  const durationMinutes = Math.max(
    1,
    Math.round(
      (dragData.occurrence.end.getTime() - dragData.occurrence.start.getTime()) /
        60_000
    )
  )
  const pointerOffsetY = Math.min(
    dragRect.height,
    Math.max(0, clientY - dragRect.top)
  )

  return Math.min(
    Math.max(0, durationMinutes - 1),
    Math.round((pointerOffsetY / dragRect.height) * durationMinutes)
  )
}

export function getResizeOperation(
  occurrence: CalendarOccurrence,
  edge: "start" | "end",
  target: CalendarDropTarget,
  slotDuration: number
): CalendarResizeOperation {
  const rawDate =
    target.kind === "slot"
      ? setMinuteOfDay(startOfDay(target.day), target.minuteOfDay)
      : startOfDay(target.day)

  if (edge === "start") {
    return {
      occurrence,
      edge,
      nextStart: clampResize(rawDate, occurrence.end, "start", slotDuration),
      nextEnd: occurrence.end,
      previousStart: occurrence.start,
      previousEnd: occurrence.end,
    }
  }

  const adjustedEnd =
    target.kind === "slot" ? addMinutes(rawDate, slotDuration) : addDays(rawDate, 1)

  return {
    occurrence,
    edge,
    nextStart: occurrence.start,
    nextEnd: clampResize(adjustedEnd, occurrence.start, "end", slotDuration),
    previousStart: occurrence.start,
    previousEnd: occurrence.end,
  }
}

export function areDropTargetsEqual(
  left: CalendarDropTarget | null,
  right: CalendarDropTarget | null
) {
  if (left === right) {
    return true
  }

  if (!left || !right || left.kind !== right.kind) {
    return false
  }

  if (left.day.getTime() !== right.day.getTime()) {
    return false
  }

  if (left.kind === "slot" && right.kind === "slot") {
    return left.minuteOfDay === right.minuteOfDay
  }

  return true
}

export function getPointerDistance(
  startClientX: number,
  startClientY: number,
  currentClientX: number,
  currentClientY: number
) {
  return Math.hypot(currentClientX - startClientX, currentClientY - startClientY)
}

export function getDragOverlayStyle(
  dragRect: DOMRect | null,
  interaction: ActiveDragInteraction | null
): CSSProperties | undefined {
  if (!dragRect || !interaction) {
    return undefined
  }

  return {
    height: dragRect.height,
    left: dragRect.left + interaction.currentClientX - interaction.initialClientX,
    position: "fixed",
    top: dragRect.top + interaction.currentClientY - interaction.initialClientY,
    width: dragRect.width,
  }
}

export function getDragSurfaceRect(target: EventTarget | null): DOMRect | null {
  if (!(target instanceof Element)) {
    return null
  }

  return (
    target
      .closest<HTMLElement>("[data-calendar-drag-surface]")
      ?.getBoundingClientRect() ?? null
  )
}

export function getCalendarDropTargetFromPoint(
  clientX: number,
  clientY: number
): CalendarDropTarget | null {
  if (typeof document === "undefined") {
    return null
  }

  const match = document
    .elementsFromPoint(clientX, clientY)
    .find((element): element is HTMLElement => {
      return (
        element instanceof HTMLElement &&
        !!element.dataset.calendarDropTargetKind
      )
    })

  if (!match) {
    return null
  }

  const kind = match.dataset.calendarDropTargetKind
  const dayValue = match.dataset.calendarDropTargetDay

  if (!kind || !dayValue) {
    return null
  }

  const day = new Date(dayValue)

  if (Number.isNaN(day.getTime())) {
    return null
  }

  if (kind === "slot") {
    const minuteValue = match.dataset.calendarDropTargetMinute
    const minuteOfDay = Number(minuteValue)

    if (minuteValue === undefined || !Number.isFinite(minuteOfDay)) {
      return null
    }

    return {
      kind,
      day,
      minuteOfDay,
    }
  }

  if (kind === "day" || kind === "all-day") {
    return {
      kind,
      day,
    }
  }

  return null
}

export function getTimeGridDropTargetFromPoint(
  clientX: number,
  clientY: number
): CalendarDropTarget | null {
  const target = getCalendarDropTargetFromPoint(clientX, clientY)

  return target?.kind === "slot" ? target : null
}
