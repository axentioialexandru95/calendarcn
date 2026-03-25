import { addDays, addMinutes } from "date-fns"

import type {
  CalendarCreateOperation,
  CalendarEvent,
  CalendarEventUpdateOperation,
  CalendarMoveOperation,
  CalendarOccurrence,
  CalendarResizeOperation,
} from "../../../types"
import { getDaySpan } from "./date-range"

export function applyMoveOperation(
  events: CalendarEvent[],
  operation: CalendarMoveOperation
) {
  return events.map((event) => {
    if (event.id !== operation.occurrence.sourceEventId) {
      return event
    }

    return {
      ...event,
      start: operation.nextStart,
      end: operation.nextEnd,
      allDay: operation.allDay ?? event.allDay,
    }
  })
}

export function applyResizeOperation(
  events: CalendarEvent[],
  operation: CalendarResizeOperation
) {
  return events.map((event) => {
    if (event.id !== operation.occurrence.sourceEventId) {
      return event
    }

    return {
      ...event,
      start: operation.nextStart,
      end: operation.nextEnd,
    }
  })
}

export function applyEventUpdateOperation(
  events: CalendarEvent[],
  operation: CalendarEventUpdateOperation
) {
  return events.map((event) => {
    if (event.id !== operation.occurrence.sourceEventId) {
      return event
    }

    return {
      ...operation.nextEvent,
      id: event.id,
    }
  })
}

export function createEventFromOperation(
  operation: CalendarCreateOperation,
  overrides: Partial<CalendarEvent> = {}
): CalendarEvent {
  return {
    id: crypto.randomUUID(),
    title: operation.title ?? overrides.title ?? "New event",
    start: operation.start,
    end: operation.end,
    allDay: operation.allDay,
    archived: overrides.archived,
    color: operation.color ?? overrides.color,
    calendarId: operation.calendarId ?? overrides.calendarId,
    calendarLabel: operation.calendarLabel ?? overrides.calendarLabel,
    timeZone: operation.timeZone ?? overrides.timeZone,
    resourceId: operation.resourceId ?? overrides.resourceId,
    description: operation.description ?? overrides.description,
    location: operation.location ?? overrides.location,
    readOnly: operation.readOnly ?? overrides.readOnly,
    data: operation.data ?? overrides.data,
  }
}

export function duplicateOccurrenceAsEvent(
  occurrence: CalendarOccurrence
): CalendarEvent {
  const durationMs = occurrence.end.getTime() - occurrence.start.getTime()
  const nextStart = occurrence.allDay
    ? addDays(occurrence.start, getDaySpan(occurrence))
    : addMinutes(occurrence.end, 30)
  const nextEnd = new Date(nextStart.getTime() + durationMs)

  return {
    id: crypto.randomUUID(),
    title: occurrence.title,
    start: nextStart,
    end: nextEnd,
    allDay: occurrence.allDay,
    archived: false,
    color: occurrence.color,
    calendarId: occurrence.calendarId,
    calendarLabel: occurrence.calendarLabel,
    timeZone: occurrence.timeZone,
    recurrence: undefined,
    resourceId: occurrence.resourceId,
    description: occurrence.description,
    location: occurrence.location,
    readOnly: false,
    data: occurrence.data,
  }
}

export function clampResize(
  nextDate: Date,
  oppositeDate: Date,
  edge: "start" | "end",
  minimumMinutes: number
) {
  if (edge === "start") {
    const latestStart = addMinutes(oppositeDate, -minimumMinutes)

    if (nextDate > latestStart) {
      return latestStart
    }

    return nextDate
  }

  const earliestEnd = addMinutes(oppositeDate, minimumMinutes)

  if (nextDate < earliestEnd) {
    return earliestEnd
  }

  return nextDate
}
