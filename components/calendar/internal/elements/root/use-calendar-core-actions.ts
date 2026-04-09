import * as React from "react"

import type {
  CalendarCreateOperation,
  CalendarDropTarget,
  CalendarEvent,
  CalendarEventMenuPosition,
  CalendarMoveOperation,
  CalendarOccurrence,
  CalendarResizeOperation,
} from "../../../types"

import {
  commitOptimisticMove,
  commitOptimisticResize,
  formatCalendarAnnouncementRange,
  handleCalendarEventKeyCommand,
  moveOccurrenceWithDropTarget,
  resizeOccurrenceWithDropTarget,
  selectCalendarOccurrence,
  withResolvedOccurrenceScope,
} from "./event-operations"

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

  const formatAnnouncementRange = React.useCallback(
    (start: Date, end: Date, allDay: boolean | undefined) => {
      return formatCalendarAnnouncementRange(start, end, allDay, {
        hourCycle,
        locale,
        timeZone,
      })
    },
    [hourCycle, locale, timeZone]
  )

  function handleSelectEvent(occurrence: CalendarOccurrence) {
    selectCalendarOccurrence(occurrence, {
      onEventSelect,
      onSelectedEventChange,
    })
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
    commitOptimisticMove(operation, {
      announce,
      formatAnnouncementRange,
      onEventMove,
      setOptimisticEvents,
    })
  }

  function requestMoveEvent(operation: CalendarMoveOperation) {
    const nextOperation = withResolvedOccurrenceScope(operation)

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
    commitOptimisticResize(operation, {
      announce,
      formatAnnouncementRange,
      onEventResize,
      setOptimisticEvents,
    })
  }

  function requestResizeEvent(operation: CalendarResizeOperation) {
    const nextOperation = withResolvedOccurrenceScope(operation)

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
    target: CalendarDropTarget,
    dragOffsetMinutes = 0
  ) {
    moveOccurrenceWithDropTarget(occurrence, target, dragOffsetMinutes, {
      canMove: Boolean(onEventMove || onEventMoveRequest),
      onMoveOperation: requestMoveEvent,
      slotDuration,
    })
  }

  function resizeOccurrenceWithTarget(
    occurrence: CalendarOccurrence,
    edge: "start" | "end",
    target: CalendarDropTarget
  ) {
    resizeOccurrenceWithDropTarget(occurrence, edge, target, {
      canResize: Boolean(onEventResize || onEventResizeRequest),
      onResizeOperation: requestResizeEvent,
      slotDuration,
    })
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
    handleCalendarEventKeyCommand({
      announce,
      canMove: Boolean(onEventMove || onEventMoveRequest),
      canResize: Boolean(onEventResize || onEventResizeRequest),
      event,
      occurrence,
      onMoveOperation: requestMoveEvent,
      onResizeOperation: requestResizeEvent,
      slotDuration,
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
