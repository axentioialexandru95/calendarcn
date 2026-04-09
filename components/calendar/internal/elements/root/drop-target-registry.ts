import * as React from "react"

import type { CalendarDropTarget } from "../../../types"

export type CalendarDropTargetAttributes = Partial<
  Record<
    | "data-calendar-drop-target-day"
    | "data-calendar-drop-target-kind"
    | "data-calendar-drop-target-minute"
    | "data-calendar-drop-target-resource-id",
    string
  >
>

type DropTargetDatasetSource = {
  dataset?: {
    calendarDropTargetDay?: string
    calendarDropTargetKind?: string
    calendarDropTargetMinute?: string
    calendarDropTargetResourceId?: string
  }
}

const registeredDropTargets = new WeakMap<object, CalendarDropTarget>()
const registeredDropTargetElements = new Set<HTMLElement>()

export function getCalendarDropTargetDataAttributes(
  target: CalendarDropTarget
): CalendarDropTargetAttributes {
  return {
    "data-calendar-drop-target-day": target.day.toISOString(),
    "data-calendar-drop-target-kind": target.kind,
    "data-calendar-drop-target-minute":
      target.kind === "slot" ? String(target.minuteOfDay) : undefined,
    "data-calendar-drop-target-resource-id": target.resourceId,
  }
}

export function registerCalendarDropTarget(
  element: HTMLElement,
  target: CalendarDropTarget
) {
  registeredDropTargets.set(element, target)
  registeredDropTargetElements.add(element)

  return () => {
    if (registeredDropTargets.get(element) === target) {
      registeredDropTargets.delete(element)
    }

    registeredDropTargetElements.delete(element)
  }
}

export function useCalendarDropTargetRegistration<T extends HTMLElement>(
  target: CalendarDropTarget
) {
  const targetRef = React.useRef(target)

  React.useEffect(() => {
    targetRef.current = target
  }, [target])

  return React.useCallback((element: T | null) => {
    if (!element) {
      return
    }

    return registerCalendarDropTarget(element, targetRef.current)
  }, [])
}

export function getRegisteredCalendarDropTargetElements() {
  return registeredDropTargetElements
}

export function parseCalendarDropTargetDataset(
  source: DropTargetDatasetSource | null | undefined
): CalendarDropTarget | null {
  const kind = source?.dataset?.calendarDropTargetKind
  const dayValue = source?.dataset?.calendarDropTargetDay
  const resourceId =
    source?.dataset?.calendarDropTargetResourceId?.trim() || undefined

  if (!kind || !dayValue) {
    return null
  }

  const day = new Date(dayValue)

  if (Number.isNaN(day.getTime())) {
    return null
  }

  if (kind === "slot") {
    const minuteValue = source?.dataset?.calendarDropTargetMinute
    const minuteOfDay = Number(minuteValue)

    if (minuteValue === undefined || !Number.isFinite(minuteOfDay)) {
      return null
    }

    return {
      kind,
      day,
      minuteOfDay,
      resourceId,
    }
  }

  if (kind === "day" || kind === "all-day") {
    return {
      kind,
      day,
      resourceId,
    }
  }

  return null
}

export function getCalendarDropTargetFromElement(
  element: (DropTargetDatasetSource & object) | null | undefined
): CalendarDropTarget | null {
  if (!element) {
    return null
  }

  return registeredDropTargets.get(element) ?? parseCalendarDropTargetDataset(element)
}
