import * as React from "react"

import { addDays, addMinutes, startOfDay } from "date-fns"

import type {
  CalendarCreateOperation,
  CalendarEvent,
  CalendarEventChangeConfirmationContext,
  CalendarOccurrence,
  CalendarResource,
  CalendarView,
  CalendarWeekday,
} from "../../../types"
import {
  applyEventUpdateOperation,
  canArchiveOccurrence,
  canDeleteOccurrence,
  canDuplicateOccurrence,
  canOpenEventDetails,
  getNextVisibleDay,
  setMinuteOfDay,
  shiftDate,
} from "../../../utils"
import type { CalendarEventMenuPosition, CalendarRootProps } from "../../shared"

import {
  useCalendarActionHelpers,
} from "./use-calendar-core-actions"
import {
  createOccurrenceInteractionCallbacks,
  commitOptimisticMove,
  commitOptimisticResize,
  withResolvedOccurrenceScope,
} from "./event-operations"

type UseCalendarEventActionsOptions = {
  createEventSheet: CalendarRootProps["createEventSheet"]
  date: Date
  eventChangeConfirmation: CalendarRootProps["eventChangeConfirmation"]
  eventDetails: CalendarRootProps["eventDetails"]
  hourCycle?: 12 | 24
  isHydrated: boolean
  keyboardShortcuts: CalendarRootProps["keyboardShortcuts"]
  locale?: string
  minHour: number
  onDateChange: (date: Date) => void
  onEventArchive?: CalendarRootProps["onEventArchive"]
  onEventCreate?: CalendarRootProps["onEventCreate"]
  onEventDelete?: CalendarRootProps["onEventDelete"]
  onEventDuplicate?: CalendarRootProps["onEventDuplicate"]
  onEventMove?: CalendarRootProps["onEventMove"]
  onEventResize?: CalendarRootProps["onEventResize"]
  onEventSelect?: CalendarRootProps["onEventSelect"]
  onEventUpdate?: CalendarRootProps["onEventUpdate"]
  onNavigate?: CalendarRootProps["onNavigate"]
  onSelectedEventChange?: CalendarRootProps["onSelectedEventChange"]
  onToday?: CalendarRootProps["onToday"]
  optimisticEvents: CalendarEvent[]
  resolvedHiddenDays: CalendarWeekday[]
  resolvedResourceFilter: string[]
  resolvedView: CalendarView
  resources?: CalendarResource[]
  setOptimisticEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>
  shouldBlockTimedRange: (
    start: Date,
    end: Date,
    allDay: boolean | undefined
  ) => boolean
  slotDuration: number
  timeZone?: string
}

export function useCalendarEventActions({
  createEventSheet,
  date,
  eventChangeConfirmation,
  eventDetails,
  hourCycle,
  isHydrated,
  keyboardShortcuts,
  locale,
  minHour,
  onDateChange,
  onEventArchive,
  onEventCreate,
  onEventDelete,
  onEventDuplicate,
  onEventMove,
  onEventResize,
  onEventSelect,
  onEventUpdate,
  onNavigate,
  onSelectedEventChange,
  onToday,
  optimisticEvents,
  resolvedHiddenDays,
  resolvedResourceFilter,
  resolvedView,
  resources,
  setOptimisticEvents,
  shouldBlockTimedRange,
  slotDuration,
  timeZone,
}: UseCalendarEventActionsOptions) {
  const [contextMenu, setContextMenu] = React.useState<{
    occurrence: CalendarOccurrence
    position: CalendarEventMenuPosition
  } | null>(null)
  const [pendingEventChange, setPendingEventChange] =
    React.useState<CalendarEventChangeConfirmationContext | null>(null)
  const [createSheetOperation, setCreateSheetOperation] =
    React.useState<CalendarCreateOperation | null>(null)
  const [detailsOccurrence, setDetailsOccurrence] =
    React.useState<CalendarOccurrence | null>(null)
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] =
    React.useState(false)
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
  const openEventDetailsOnSelect =
    typeof eventDetails === "object"
      ? (eventDetails.openOnSelect ?? true)
      : true
  const keyboardShortcutsEnabled =
    keyboardShortcuts !== undefined && keyboardShortcuts !== false
  const keyboardShortcutsTrigger =
    typeof keyboardShortcuts === "object"
      ? (keyboardShortcuts.trigger ?? "both")
      : keyboardShortcutsEnabled
        ? "both"
        : null
  const keyboardShortcutsKeyTriggerEnabled =
    keyboardShortcutsTrigger === "both" || keyboardShortcutsTrigger === "?"

  const eventDetailsEnabled =
    eventDetails !== undefined && eventDetails !== false

  React.useEffect(() => {
    if (!isHydrated || !keyboardShortcutsKeyTriggerEnabled) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        !(event.key === "?" || (event.key === "/" && event.shiftKey))
      ) {
        return
      }

      const target = event.target

      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "SELECT" ||
          target.tagName === "TEXTAREA")
      ) {
        return
      }

      event.preventDefault()
      setIsKeyboardShortcutsOpen(true)
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isHydrated, keyboardShortcutsKeyTriggerEnabled])

  function closeContextMenu() {
    setContextMenu(null)
  }

  function openEventDetails(occurrence: CalendarOccurrence) {
    if (!eventDetailsEnabled || !canOpenEventDetails(occurrence)) {
      return
    }

    closeContextMenu()
    setDetailsOccurrence(occurrence)
  }

  function closeEventDetails() {
    setDetailsOccurrence(null)
  }

  function handleSelectEvent(
    occurrence: CalendarOccurrence,
    options: {
      openDetails?: boolean
    } = {}
  ) {
    setContextMenu(null)
    selectOccurrence(occurrence)

    if (options.openDetails ?? openEventDetailsOnSelect) {
      openEventDetails(occurrence)
    }
  }

  function closeCreateSheet() {
    setCreateSheetOperation(null)
  }

  function closePendingEventChange() {
    setPendingEventChange(null)
  }

  function handleOpenContextMenu(
    occurrence: CalendarOccurrence,
    position: CalendarEventMenuPosition
  ) {
    const hasActions =
      (eventDetailsEnabled && canOpenEventDetails(occurrence)) ||
      (canDuplicateOccurrence(occurrence) && !!onEventDuplicate) ||
      (canArchiveOccurrence(occurrence) && !!onEventArchive) ||
      (canDeleteOccurrence(occurrence) && !!onEventDelete)

    if (!hasActions) {
      return
    }

    handleSelectEvent(occurrence, {
      openDetails: false,
    })
    closeEventDetails()
    setContextMenu({
      occurrence,
      position,
    })
  }

  function handleNavigate(direction: -1 | 1) {
    if (onNavigate) {
      onNavigate(direction)
      return
    }

    onDateChange(shiftDate(date, resolvedView, direction, resolvedHiddenDays))
  }

  function handleToday() {
    if (onToday) {
      onToday()
      return
    }

    onDateChange(new Date())
  }

  function getDefaultCreateOperation(
    operation: CalendarCreateOperation
  ): CalendarCreateOperation {
    const defaultResource =
      resources?.find((resource) =>
        resolvedResourceFilter.includes(resource.id)
      ) ?? resources?.[0]

    return {
      calendarId: operation.calendarId ?? defaultResource?.id,
      calendarLabel: operation.calendarLabel ?? defaultResource?.label,
      color: operation.color ?? defaultResource?.color,
      resourceId: operation.resourceId ?? defaultResource?.id,
      timeZone: operation.timeZone ?? timeZone,
      ...operation,
    }
  }

  function commitCreateEvent(operation: CalendarCreateOperation) {
    if (!onEventCreate) {
      return
    }

    if (
      shouldBlockTimedRange(operation.start, operation.end, operation.allDay)
    ) {
      announce("Blocked time is unavailable.")
      return "Blocked time is unavailable."
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
    if (!onEventCreate) {
      return
    }

    const nextOperation = getDefaultCreateOperation(operation)

    if (
      shouldBlockTimedRange(
        nextOperation.start,
        nextOperation.end,
        nextOperation.allDay
      )
    ) {
      announce("Blocked time is unavailable.")
      return
    }

    const shouldOpenSheet =
      createEventSheet !== undefined && createEventSheet !== false

    if (shouldOpenSheet) {
      closeContextMenu()
      setCreateSheetOperation(nextOperation)
      return
    }

    commitCreateEvent(nextOperation)
  }

  function shouldConfirmEventChange(
    context: CalendarEventChangeConfirmationContext
  ) {
    if (!eventChangeConfirmation) {
      return false
    }

    if (typeof eventChangeConfirmation === "boolean") {
      return eventChangeConfirmation
    }

    return eventChangeConfirmation.shouldConfirm?.(context) ?? true
  }

  function commitEventChange(context: CalendarEventChangeConfirmationContext) {
    if (context.action === "move") {
      commitOptimisticMove(context, {
        announce,
        formatAnnouncementRange,
        onEventMove,
        setOptimisticEvents,
      })
      return
    }

    commitOptimisticResize(context, {
      announce,
      formatAnnouncementRange,
      onEventResize,
      setOptimisticEvents,
    })
  }

  function commitEventUpdate(nextEvent: CalendarEvent) {
    if (!detailsOccurrence || !onEventUpdate) {
      return
    }

    const previousEvent = optimisticEvents.find(
      (event) => event.id === detailsOccurrence.sourceEventId
    ) ?? {
      ...detailsOccurrence,
      id: detailsOccurrence.sourceEventId,
    }
    const operation = {
      occurrence: detailsOccurrence,
      nextEvent,
      previousEvent,
      scope: detailsOccurrence.isRecurringInstance ? "series" : "occurrence",
    } as const

    setOptimisticEvents((currentEvents) =>
      applyEventUpdateOperation(currentEvents, operation)
    )
    setDetailsOccurrence((currentOccurrence) =>
      currentOccurrence
        ? {
            ...currentOccurrence,
            ...nextEvent,
            occurrenceId: currentOccurrence.occurrenceId,
            sourceEventId: currentOccurrence.sourceEventId,
          }
        : currentOccurrence
    )
    onEventUpdate(operation)
    announce(
      `Updated ${nextEvent.title} to ${formatAnnouncementRange(
        nextEvent.start,
        nextEvent.end,
        nextEvent.allDay
      )}.`
    )
  }

  function requestEventChange(context: CalendarEventChangeConfirmationContext) {
    closeContextMenu()

    const allDay =
      context.action === "move"
        ? (context.allDay ?? context.occurrence.allDay)
        : context.occurrence.allDay

    if (shouldBlockTimedRange(context.nextStart, context.nextEnd, allDay)) {
      announce("Blocked time is unavailable.")
      return
    }

    if (shouldConfirmEventChange(context)) {
      setPendingEventChange(context)
      return
    }

    commitEventChange(context)
  }

  function handleQuickCreate() {
    if (!onEventCreate) {
      return
    }

    const quickCreateDay = getNextVisibleDay(date, resolvedHiddenDays)
    const start = setMinuteOfDay(
      startOfDay(quickCreateDay),
      Math.max(minHour * 60, 9 * 60)
    )

    requestEventCreate({
      start,
      end: addMinutes(start, 60),
    })
  }

  const occurrenceInteractions = createOccurrenceInteractionCallbacks({
    canMove: Boolean(onEventMove),
    canResize: Boolean(onEventResize),
    onMoveOperation: (operation) =>
      requestEventChange({
        action: "move",
        ...withResolvedOccurrenceScope(operation),
      }),
    onResizeOperation: (operation) =>
      requestEventChange({
        action: "resize",
        ...withResolvedOccurrenceScope(operation),
      }),
    runEventKeyCommand,
    slotDuration,
  })

  function handleDuplicateEvent(occurrence: CalendarOccurrence) {
    if (!canDuplicateOccurrence(occurrence)) {
      announce("This event cannot be duplicated.")
      return
    }

    onEventDuplicate?.(occurrence)
    onSelectedEventChange?.(undefined)
    closeContextMenu()
    closeEventDetails()
    announce(`Duplicated ${occurrence.title}.`)
  }

  function handleArchiveEvent(occurrence: CalendarOccurrence) {
    if (!canArchiveOccurrence(occurrence)) {
      announce("This event cannot be archived.")
      return
    }

    onEventArchive?.(occurrence)
    onSelectedEventChange?.(undefined)
    closeContextMenu()
    closeEventDetails()
    announce(`Archived ${occurrence.title}.`)
  }

  function handleDeleteEvent(occurrence: CalendarOccurrence) {
    if (!canDeleteOccurrence(occurrence)) {
      announce("This event cannot be deleted.")
      return
    }

    onEventDelete?.(occurrence)
    onSelectedEventChange?.(undefined)
    closeContextMenu()
    closeEventDetails()
    announce(`Deleted ${occurrence.title}.`)
  }

  function handleConfirmPendingEventChange() {
    if (!pendingEventChange) {
      return
    }

    commitEventChange(pendingEventChange)
    closePendingEventChange()
  }

  function handleEventKeyCommand(
    occurrence: CalendarOccurrence,
    event: React.KeyboardEvent<HTMLButtonElement>
  ) {
    occurrenceInteractions.handleEventKeyCommand(occurrence, event)
  }

  return {
    announce,
    closeContextMenu,
    closeCreateSheet,
    closeEventDetails,
    closePendingEventChange,
    commitCreateEvent,
    commitEventUpdate,
    contextMenu,
    createSheetOperation,
    detailsOccurrence,
    eventDetailsEnabled,
    handleArchiveEvent,
    handleConfirmPendingEventChange,
    handleDeleteEvent,
    handleDuplicateEvent,
    handleEventKeyCommand,
    handleNavigate,
    handleOpenContextMenu,
    handleQuickCreate,
    handleSelectEvent,
    handleToday,
    isKeyboardShortcutsOpen,
    keyboardShortcutsKeyTriggerEnabled,
    keyboardShortcutsEnabled,
    liveAnnouncement,
    moveOccurrenceWithTarget: occurrenceInteractions.moveOccurrenceWithTarget,
    openEventDetails,
    openEventDetailsOnSelect,
    pendingEventChange,
    requestEventCreate,
    resizeOccurrenceWithTarget:
      occurrenceInteractions.resizeOccurrenceWithTarget,
    setDetailsOccurrence,
    setIsKeyboardShortcutsOpen,
  }
}
