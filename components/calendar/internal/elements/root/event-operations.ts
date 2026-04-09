import { addDays, addMinutes } from "date-fns"
import type {
  Dispatch,
  KeyboardEvent as ReactKeyboardEvent,
  SetStateAction,
} from "react"

import type {
  CalendarDropTarget,
  CalendarEvent,
  CalendarMoveOperation,
  CalendarOccurrence,
  CalendarRecurrenceEditScope,
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

type CalendarEventListSetter = Dispatch<SetStateAction<CalendarEvent[]>>

type AnnouncementFormattingOptions = {
  hourCycle?: 12 | 24
  locale?: string
  timeZone?: string
}

type ScopedOccurrenceOperation = {
  occurrence: CalendarOccurrence
  scope?: CalendarRecurrenceEditScope
}

type CommitMoveOptions = {
  announce: (message: string) => void
  formatAnnouncementRange: (
    start: Date,
    end: Date,
    allDay: boolean | undefined
  ) => string
  onEventMove?: (operation: CalendarMoveOperation) => void
  setOptimisticEvents: CalendarEventListSetter
}

type CommitResizeOptions = {
  announce: (message: string) => void
  formatAnnouncementRange: (
    start: Date,
    end: Date,
    allDay: boolean | undefined
  ) => string
  onEventResize?: (operation: CalendarResizeOperation) => void
  setOptimisticEvents: CalendarEventListSetter
}

type MoveWithTargetOptions = {
  canMove: boolean
  onMoveOperation: (operation: CalendarMoveOperation) => void
  slotDuration: number
}

type ResizeWithTargetOptions = {
  canResize: boolean
  onResizeOperation: (operation: CalendarResizeOperation) => void
  slotDuration: number
}

type CalendarKeyCommandHandlers = {
  canMove: boolean
  canResize: boolean
  onMoveOperation: (operation: CalendarMoveOperation) => void
  onResizeOperation: (operation: CalendarResizeOperation) => void
}

type CreateOccurrenceInteractionCallbacksOptions = {
  canMove: boolean
  canResize: boolean
  onMoveOperation: (operation: CalendarMoveOperation) => void
  onResizeOperation: (operation: CalendarResizeOperation) => void
  runEventKeyCommand: (
    occurrence: CalendarOccurrence,
    event: ReactKeyboardEvent<HTMLButtonElement>,
    handlers: CalendarKeyCommandHandlers
  ) => void
  slotDuration: number
}

type HandleKeyCommandOptions = AnnouncementFormattingOptions & {
  announce: (message: string) => void
  canMove: boolean
  canResize: boolean
  event: ReactKeyboardEvent<HTMLButtonElement>
  occurrence: CalendarOccurrence
  onMoveOperation: (operation: CalendarMoveOperation) => void
  onResizeOperation: (operation: CalendarResizeOperation) => void
  slotDuration: number
}

type SelectOccurrenceOptions = {
  onEventSelect?: (occurrence: CalendarOccurrence) => void
  onSelectedEventChange?: (id?: string) => void
}

export function formatCalendarAnnouncementRange(
  start: Date,
  end: Date,
  allDay: boolean | undefined,
  options: AnnouncementFormattingOptions
) {
  return formatEventTimeLabel(start, end, {
    allDay,
    hourCycle: options.hourCycle,
    locale: options.locale,
    timeZone: options.timeZone,
  })
}

export function withResolvedOccurrenceScope<T extends ScopedOccurrenceOperation>(
  operation: T
): T & { scope: CalendarRecurrenceEditScope } {
  return {
    ...operation,
    scope:
      operation.scope ??
      (operation.occurrence.isRecurringInstance ? "series" : "occurrence"),
  }
}

export function selectCalendarOccurrence(
  occurrence: CalendarOccurrence,
  options: SelectOccurrenceOptions
) {
  options.onSelectedEventChange?.(occurrence.occurrenceId)
  options.onEventSelect?.(occurrence)
}

export function commitOptimisticMove(
  operation: CalendarMoveOperation,
  options: CommitMoveOptions
) {
  if (!options.onEventMove) {
    return
  }

  const nextOperation = withResolvedOccurrenceScope(operation)

  options.setOptimisticEvents((currentEvents) =>
    applyMoveOperation(currentEvents, nextOperation)
  )
  options.onEventMove(nextOperation)
  options.announce(
    `Moved ${nextOperation.occurrence.title} to ${options.formatAnnouncementRange(
      nextOperation.nextStart,
      nextOperation.nextEnd,
      nextOperation.allDay ?? nextOperation.occurrence.allDay
    )}.`
  )
}

export function commitOptimisticResize(
  operation: CalendarResizeOperation,
  options: CommitResizeOptions
) {
  if (!options.onEventResize) {
    return
  }

  const nextOperation = withResolvedOccurrenceScope(operation)

  options.setOptimisticEvents((currentEvents) =>
    applyResizeOperation(currentEvents, nextOperation)
  )
  options.onEventResize(nextOperation)
  options.announce(
    `Resized ${nextOperation.occurrence.title} to ${options.formatAnnouncementRange(
      nextOperation.nextStart,
      nextOperation.nextEnd,
      nextOperation.occurrence.allDay
    )}.`
  )
}

export function moveOccurrenceWithDropTarget(
  occurrence: CalendarOccurrence,
  target: CalendarDropTarget,
  dragOffsetMinutes: number,
  options: MoveWithTargetOptions
) {
  if (!options.canMove || !canMoveOccurrence(occurrence)) {
    return
  }

  options.onMoveOperation(
    getMoveOperation(occurrence, target, dragOffsetMinutes, options.slotDuration)
  )
}

export function resizeOccurrenceWithDropTarget(
  occurrence: CalendarOccurrence,
  edge: "start" | "end",
  target: CalendarDropTarget,
  options: ResizeWithTargetOptions
) {
  if (!options.canResize || !canResizeOccurrence(occurrence)) {
    return
  }

  options.onResizeOperation(
    getResizeOperation(occurrence, edge, target, options.slotDuration)
  )
}

export function createOccurrenceInteractionCallbacks({
  canMove,
  canResize,
  onMoveOperation,
  onResizeOperation,
  runEventKeyCommand,
  slotDuration,
}: CreateOccurrenceInteractionCallbacksOptions) {
  return {
    handleEventKeyCommand(
      occurrence: CalendarOccurrence,
      event: ReactKeyboardEvent<HTMLButtonElement>
    ) {
      runEventKeyCommand(occurrence, event, {
        canMove,
        canResize,
        onMoveOperation,
        onResizeOperation,
      })
    },
    moveOccurrenceWithTarget(
      occurrence: CalendarOccurrence,
      target: CalendarDropTarget,
      dragOffsetMinutes = 0
    ) {
      moveOccurrenceWithDropTarget(occurrence, target, dragOffsetMinutes, {
        canMove,
        onMoveOperation,
        slotDuration,
      })
    },
    resizeOccurrenceWithTarget(
      occurrence: CalendarOccurrence,
      edge: "start" | "end",
      target: CalendarDropTarget
    ) {
      resizeOccurrenceWithDropTarget(occurrence, edge, target, {
        canResize,
        onResizeOperation,
        slotDuration,
      })
    },
  }
}

export function handleCalendarEventKeyCommand({
  announce,
  canMove,
  canResize,
  event,
  occurrence,
  onMoveOperation,
  onResizeOperation,
  slotDuration,
}: HandleKeyCommandOptions) {
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

  if (event.shiftKey && canResize) {
    if (!canResizeOccurrence(occurrence)) {
      announce("This event cannot be resized.")
      return
    }

    onResizeOperation({
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

  if (event.altKey && canResize) {
    if (!canResizeOccurrence(occurrence)) {
      announce("This event cannot be resized.")
      return
    }

    onResizeOperation({
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

  if (!canMove || !canMoveOccurrence(occurrence)) {
    announce("This event cannot be moved.")
    return
  }

  onMoveOperation({
    occurrence,
    nextStart: addMinutes(addDays(occurrence.start, dayDelta), minuteDelta),
    nextEnd: addMinutes(addDays(occurrence.end, dayDelta), minuteDelta),
    previousStart: occurrence.start,
    previousEnd: occurrence.end,
    allDay: occurrence.allDay,
    scope: occurrence.isRecurringInstance ? "series" : "occurrence",
  })
}
