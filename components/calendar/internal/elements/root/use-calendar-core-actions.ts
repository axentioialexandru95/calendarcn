import * as React from "react"

import type {
  CalendarCreateOperation,
  CalendarEvent,
  CalendarEventMenuPosition,
  CalendarMoveOperation,
  CalendarOccurrence,
  CalendarResizeOperation,
} from "../../../types"

import {
  createOccurrenceInteractionCallbacks,
  commitOptimisticMove,
  commitOptimisticResize,
  formatCalendarAnnouncementRange,
  handleCalendarEventKeyCommand,
  selectCalendarOccurrence,
  withResolvedOccurrenceScope,
} from "./event-operations"

type UseCalendarActionHelpersOptions = {
  hourCycle?: 12 | 24
  locale?: string
  onEventSelect?: (occurrence: CalendarOccurrence) => void
  onSelectedEventChange?: (id?: string) => void
  slotDuration: number
  timeZone?: string
}

type CalendarKeyCommandHandlers = {
  canMove: boolean
  canResize: boolean
  onMoveOperation: (operation: CalendarMoveOperation) => void
  onResizeOperation: (operation: CalendarResizeOperation) => void
}

type UseCalendarCoreActionsOptions = UseCalendarActionHelpersOptions & {
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
  setOptimisticEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>
  shouldBlockTimedRange: (
    start: Date,
    end: Date,
    allDay: boolean | undefined
  ) => boolean
}

export function useCalendarActionHelpers({
  hourCycle,
  locale,
  onEventSelect,
  onSelectedEventChange,
  slotDuration,
  timeZone,
}: UseCalendarActionHelpersOptions) {
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

  const selectOccurrence = React.useCallback(
    (occurrence: CalendarOccurrence) => {
      selectCalendarOccurrence(occurrence, {
        onEventSelect,
        onSelectedEventChange,
      })
    },
    [onEventSelect, onSelectedEventChange]
  )

  const runEventKeyCommand = React.useCallback(
    (
      occurrence: CalendarOccurrence,
      event: React.KeyboardEvent<HTMLButtonElement>,
      handlers: CalendarKeyCommandHandlers
    ) => {
      handleCalendarEventKeyCommand({
        announce,
        canMove: handlers.canMove,
        canResize: handlers.canResize,
        event,
        occurrence,
        onMoveOperation: handlers.onMoveOperation,
        onResizeOperation: handlers.onResizeOperation,
        slotDuration,
      })
    },
    [announce, slotDuration]
  )

  return {
    announce,
    formatAnnouncementRange,
    liveAnnouncement,
    runEventKeyCommand,
    selectOccurrence,
  }
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
  const {
    announce,
    formatAnnouncementRange,
    liveAnnouncement,
    runEventKeyCommand,
    selectOccurrence,
  } = useCalendarActionHelpers({
    hourCycle,
    locale,
    onEventSelect,
    onSelectedEventChange,
    slotDuration,
    timeZone,
  })

  function handleSelectEvent(occurrence: CalendarOccurrence) {
    selectOccurrence(occurrence)
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

  const occurrenceInteractions = createOccurrenceInteractionCallbacks({
    canMove: Boolean(onEventMove || onEventMoveRequest),
    canResize: Boolean(onEventResize || onEventResizeRequest),
    onMoveOperation: requestMoveEvent,
    onResizeOperation: requestResizeEvent,
    runEventKeyCommand,
    slotDuration,
  })

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
    occurrenceInteractions.handleEventKeyCommand(occurrence, event)
  }

  return {
    announce,
    handleEventKeyCommand,
    handleOpenContextMenu,
    handleSelectEvent,
    liveAnnouncement,
    moveOccurrenceWithTarget: occurrenceInteractions.moveOccurrenceWithTarget,
    requestEventCreate,
    resizeOccurrenceWithTarget:
      occurrenceInteractions.resizeOccurrenceWithTarget,
  }
}
