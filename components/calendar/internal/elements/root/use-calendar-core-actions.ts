import * as React from "react"

import { addDays, addMinutes } from "date-fns"

import type {
  CalendarCreateOperation,
  CalendarEvent,
  CalendarEventMenuPosition,
  CalendarMoveOperation,
  CalendarOccurrence,
  CalendarResizeOperation,
} from "../../../types"
import {
  applyMoveOperation,
  applyResizeOperation,
  canMoveOccurrence,
  canResizeOccurrence,
  clampResize,
  formatEventTimeLabel,
} from "../../../utils"

import { getMoveOperation, getResizeOperation } from "./root-utils"

type UseCalendarCoreActionsOptions = {
  hourCycle?: 12 | 24
  locale?: string
  onEventContextMenu?: (
    occurrence: CalendarOccurrence,
    position: CalendarEventMenuPosition
  ) => void
  onEventCreate?: (operation: CalendarCreateOperation) => void
  onEventCreateRequest?: (operation: CalendarCreateOperation) => void
  onEventMove?: (operation: CalendarMoveOperation) => void
  onEventMoveRequest?: (operation: CalendarMoveOperation) => void
  onEventResize?: (operation: CalendarResizeOperation) => void
  onEventResizeRequest?: (operation: CalendarResizeOperation) => void
  onEventSelect?: (occurrence: CalendarOccurrence) => void
  onSelectedEventChange?: (id?: string) => void
  setOptimisticEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>
  shouldBlockTimedRange: (
    start: Date,
    end: Date,
    allDay: boolean | undefined
  ) => boolean
  slotDuration: number
  timeZone?: string
}

export function useCalendarCoreActions({
  hourCycle,
  locale,
  onEventContextMenu,
  onEventCreate,
  onEventCreateRequest,
  onEventMove,
  onEventMoveRequest,
  onEventResize,
  onEventResizeRequest,
  onEventSelect,
  onSelectedEventChange,
  setOptimisticEvents,
  shouldBlockTimedRange,
  slotDuration,
  timeZone,
}: UseCalendarCoreActionsOptions) {
  const [liveAnnouncement, setLiveAnnouncement] = React.useState("")

  const announce = React.useCallback((message: string) => {
    setLiveAnnouncement(message)
  }, [])

  function formatAnnouncementRange(
    start: Date,
    end: Date,
    allDay: boolean | undefined
  ) {
    return formatEventTimeLabel(start, end, {
      allDay,
      hourCycle,
      locale,
      timeZone,
    })
  }

  function handleSelectEvent(occurrence: CalendarOccurrence) {
    onSelectedEventChange?.(occurrence.occurrenceId)
    onEventSelect?.(occurrence)
  }

  function commitCreateEvent(operation: CalendarCreateOperation) {
    if (!onEventCreate) {
      return
    }

    if (
      shouldBlockTimedRange(operation.start, operation.end, operation.allDay)
    ) {
      announce("Blocked time is unavailable.")
      return
    }

    onEventCreate(operation)
    onSelectedEventChange?.(undefined)
    announce(
      `Created ${operation.title ?? "a new appointment"} for ${formatAnnouncementRange(
        operation.start,
        operation.end,
        operation.allDay
      )}.`
    )
  }

  function requestEventCreate(operation: CalendarCreateOperation) {
    if (
      shouldBlockTimedRange(operation.start, operation.end, operation.allDay)
    ) {
      announce("Blocked time is unavailable.")
      return
    }

    if (onEventCreateRequest) {
      onEventCreateRequest(operation)
      onSelectedEventChange?.(undefined)
      return
    }

    commitCreateEvent(operation)
  }

  function commitMoveEvent(operation: CalendarMoveOperation) {
    if (!onEventMove) {
      return
    }

    const nextOperation = {
      ...operation,
      scope:
        operation.scope ??
        (operation.occurrence.isRecurringInstance ? "series" : "occurrence"),
    } as const

    setOptimisticEvents((currentEvents) =>
      applyMoveOperation(currentEvents, nextOperation)
    )
    onEventMove(nextOperation)
    announce(
      `Moved ${nextOperation.occurrence.title} to ${formatAnnouncementRange(
        nextOperation.nextStart,
        nextOperation.nextEnd,
        nextOperation.allDay ?? nextOperation.occurrence.allDay
      )}.`
    )
  }

  function requestMoveEvent(operation: CalendarMoveOperation) {
    const nextOperation = {
      ...operation,
      scope:
        operation.scope ??
        (operation.occurrence.isRecurringInstance ? "series" : "occurrence"),
    } as const

    if (
      shouldBlockTimedRange(
        nextOperation.nextStart,
        nextOperation.nextEnd,
        nextOperation.allDay ?? nextOperation.occurrence.allDay
      )
    ) {
      announce("Blocked time is unavailable.")
      return
    }

    if (onEventMoveRequest) {
      onEventMoveRequest(nextOperation)
      return
    }

    commitMoveEvent(nextOperation)
  }

  function commitResizeEvent(operation: CalendarResizeOperation) {
    if (!onEventResize) {
      return
    }

    const nextOperation = {
      ...operation,
      scope:
        operation.scope ??
        (operation.occurrence.isRecurringInstance ? "series" : "occurrence"),
    } as const

    setOptimisticEvents((currentEvents) =>
      applyResizeOperation(currentEvents, nextOperation)
    )
    onEventResize(nextOperation)
    announce(
      `Resized ${nextOperation.occurrence.title} to ${formatAnnouncementRange(
        nextOperation.nextStart,
        nextOperation.nextEnd,
        nextOperation.occurrence.allDay
      )}.`
    )
  }

  function requestResizeEvent(operation: CalendarResizeOperation) {
    const nextOperation = {
      ...operation,
      scope:
        operation.scope ??
        (operation.occurrence.isRecurringInstance ? "series" : "occurrence"),
    } as const

    if (
      shouldBlockTimedRange(
        nextOperation.nextStart,
        nextOperation.nextEnd,
        nextOperation.occurrence.allDay
      )
    ) {
      announce("Blocked time is unavailable.")
      return
    }

    if (onEventResizeRequest) {
      onEventResizeRequest(nextOperation)
      return
    }

    commitResizeEvent(nextOperation)
  }

  function moveOccurrenceWithTarget(
    occurrence: CalendarOccurrence,
    target: Parameters<typeof getMoveOperation>[1],
    dragOffsetMinutes = 0
  ) {
    if (
      (!onEventMove && !onEventMoveRequest) ||
      !canMoveOccurrence(occurrence)
    ) {
      return
    }

    requestMoveEvent(
      getMoveOperation(occurrence, target, dragOffsetMinutes, slotDuration)
    )
  }

  function resizeOccurrenceWithTarget(
    occurrence: CalendarOccurrence,
    edge: "start" | "end",
    target: Parameters<typeof getResizeOperation>[2]
  ) {
    if (
      (!onEventResize && !onEventResizeRequest) ||
      !canResizeOccurrence(occurrence)
    ) {
      return
    }

    requestResizeEvent(
      getResizeOperation(occurrence, edge, target, slotDuration)
    )
  }

  function handleOpenContextMenu(
    occurrence: CalendarOccurrence,
    position: CalendarEventMenuPosition
  ) {
    if (!onEventContextMenu) {
      return
    }

    handleSelectEvent(occurrence)
    onEventContextMenu(occurrence, position)
  }

  function handleEventKeyCommand(
    occurrence: CalendarOccurrence,
    event: React.KeyboardEvent<HTMLButtonElement>
  ) {
    const dayDelta =
      event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0
    const minuteDelta =
      event.key === "ArrowUp"
        ? -slotDuration
        : event.key === "ArrowDown"
          ? slotDuration
          : 0

    if (dayDelta === 0 && minuteDelta === 0) {
      return
    }

    event.preventDefault()

    if (event.shiftKey && (onEventResize || onEventResizeRequest)) {
      if (!canResizeOccurrence(occurrence)) {
        announce("This event cannot be resized.")
        return
      }

      requestResizeEvent({
        occurrence,
        edge: "end",
        nextStart: occurrence.start,
        nextEnd: clampResize(
          addMinutes(addDays(occurrence.end, dayDelta), minuteDelta),
          occurrence.start,
          "end",
          slotDuration
        ),
        previousStart: occurrence.start,
        previousEnd: occurrence.end,
        scope: occurrence.isRecurringInstance ? "series" : "occurrence",
      })
      return
    }

    if (event.altKey && (onEventResize || onEventResizeRequest)) {
      if (!canResizeOccurrence(occurrence)) {
        announce("This event cannot be resized.")
        return
      }

      requestResizeEvent({
        occurrence,
        edge: "start",
        nextStart: clampResize(
          addMinutes(addDays(occurrence.start, dayDelta), minuteDelta),
          occurrence.end,
          "start",
          slotDuration
        ),
        nextEnd: occurrence.end,
        previousStart: occurrence.start,
        previousEnd: occurrence.end,
        scope: occurrence.isRecurringInstance ? "series" : "occurrence",
      })
      return
    }

    if (!onEventMove && !onEventMoveRequest) {
      announce("This event cannot be moved.")
      return
    }

    if (!canMoveOccurrence(occurrence)) {
      announce("This event cannot be moved.")
      return
    }

    requestMoveEvent({
      occurrence,
      nextStart: addMinutes(addDays(occurrence.start, dayDelta), minuteDelta),
      nextEnd: addMinutes(addDays(occurrence.end, dayDelta), minuteDelta),
      previousStart: occurrence.start,
      previousEnd: occurrence.end,
      allDay: occurrence.allDay,
      scope: occurrence.isRecurringInstance ? "series" : "occurrence",
    })
  }

  return {
    announce,
    handleEventKeyCommand,
    handleOpenContextMenu,
    handleSelectEvent,
    liveAnnouncement,
    moveOccurrenceWithTarget,
    requestEventCreate,
    resizeOccurrenceWithTarget,
  }
}
