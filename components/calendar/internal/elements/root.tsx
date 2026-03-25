"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import { addDays, addMinutes, startOfDay } from "date-fns"

import type {
  CalendarCreateOperation,
  CalendarDragData,
  CalendarEvent,
  CalendarEventChangeConfirmationContext,
  CalendarDropTarget,
  CalendarMoveOperation,
  CalendarOccurrence,
  CalendarResizeOperation,
} from "../../types"
import {
  applyEventUpdateOperation,
  applyMoveOperation,
  applyResizeOperation,
  canArchiveOccurrence,
  canDeleteOccurrence,
  canDuplicateOccurrence,
  canMoveOccurrence,
  canOpenEventDetails,
  canResizeOccurrence,
  clampResize,
  copyTimeParts,
  expandOccurrences,
  formatEventTimeLabel,
  filterOccurrencesByResource,
  formatDurationLabel,
  getNextVisibleDay,
  getCalendarSlotClassName,
  getDaySpan,
  getEventMetaLabel,
  getRangeLabel,
  getVisibleRange,
  intervalOverlapsBlockedRanges,
  normalizeAvailableViews,
  normalizeHiddenDays,
  resolveCalendarView,
  setMinuteOfDay,
  shiftDate,
} from "../../utils"
import { CalendarAgendaView } from "./agenda-view"
import { EventSurface, getResolvedAccentColor } from "./event-card"
import { CalendarMonthView } from "./month-view"
import { CalendarToolbar } from "./toolbar"
import { CalendarDayView, CalendarWeekView } from "./time-grid-view"
import {
  compactSlotHeight,
  defaultMaxHour,
  defaultMinHour,
  defaultSlotDuration,
  slotHeight as defaultSlotHeight,
  type CalendarEventMenuPosition,
  type CalendarRootProps,
  type SharedViewProps,
} from "../shared"
import { CalendarEventChangeConfirmationDialog } from "./event-change-confirmation-dialog"
import { CalendarEventCreateSheet } from "./event-create-sheet"
import { CalendarEventContextMenu } from "./event-context-menu"
import { CalendarEventDetailsSheet } from "./event-details-sheet"
import { CalendarKeyboardShortcutsDialog } from "./keyboard-shortcuts-dialog"

const dragActivationDistance = 6

type ActiveDragInteraction = {
  currentClientX: number
  currentClientY: number
  initialClientX: number
  initialClientY: number
  isDragging: boolean
  pointerId: number
}

export function CalendarRoot({
  agendaDays = 14,
  availableViews,
  blockedRanges,
  businessHours,
  classNames,
  createEventSheet,
  date,
  density = "comfortable",
  eventChangeConfirmation,
  eventDetails,
  events,
  getEventColor,
  hiddenDays,
  hourCycle,
  keyboardShortcuts,
  locale,
  maxHour = defaultMaxHour,
  minHour = defaultMinHour,
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
  onResourceFilterChange,
  onSelectedEventChange,
  onToday,
  onViewChange,
  renderEmptyState,
  renderEvent,
  renderEventDetails,
  renderToolbarExtras,
  resources,
  resourceFilter,
  scrollToTime,
  secondaryTimeZone,
  selectedEventId,
  showCreatePreviewMeta = true,
  showDragPreviewMeta = true,
  showSecondaryTimeZone = false,
  slotDuration = defaultSlotDuration,
  slotHeight: customSlotHeight,
  surfaceShadow = "none",
  defaultResourceFilter,
  timeZone,
  view,
  weekStartsOn = 1,
}: CalendarRootProps) {
  const [optimisticEvents, setOptimisticEvents] =
    React.useState<CalendarEvent[]>(events)
  const allResourceIds = React.useMemo(
    () => resources?.map((resource) => resource.id) ?? [],
    [resources]
  )
  const [internalResourceFilter, setInternalResourceFilter] = React.useState<
    string[]
  >(() => defaultResourceFilter ?? allResourceIds)
  const resolvedAvailableViews = React.useMemo(
    () => normalizeAvailableViews(availableViews),
    [availableViews]
  )
  const resolvedHiddenDays = React.useMemo(
    () => normalizeHiddenDays(hiddenDays),
    [hiddenDays]
  )
  const resolvedView = React.useMemo(
    () => resolveCalendarView(view, resolvedAvailableViews),
    [resolvedAvailableViews, view]
  )
  const resolvedSlotHeight =
    customSlotHeight ??
    (density === "compact" ? compactSlotHeight : defaultSlotHeight)
  const range = getVisibleRange(date, resolvedView, {
    agendaDays,
    hiddenDays: resolvedHiddenDays,
    hourCycle,
    locale,
    timeZone,
    weekStartsOn,
  })
  const [isHydrated, setIsHydrated] = React.useState(false)
  const [activeDrag, setActiveDrag] = React.useState<CalendarDragData | null>(
    null
  )
  const [activeDropTarget, setActiveDropTarget] =
    React.useState<CalendarDropTarget | null>(null)
  const activeDropTargetRef = React.useRef<CalendarDropTarget | null>(null)
  const lastDropTargetRef = React.useRef<CalendarDropTarget | null>(null)
  const [activeDragOffsetMinutes, setActiveDragOffsetMinutes] =
    React.useState(0)
  const activeDragOffsetMinutesRef = React.useRef(0)
  const [activeDragInteraction, setActiveDragInteraction] =
    React.useState<ActiveDragInteraction | null>(null)
  const activeDragRef = React.useRef<CalendarDragData | null>(null)
  const activeDragInteractionRef = React.useRef<ActiveDragInteraction | null>(null)
  const [activeResize, setActiveResize] = React.useState<{
    edge: "start" | "end"
    occurrence: CalendarOccurrence
    pointerId: number
  } | null>(null)
  const [activeResizeTarget, setActiveResizeTarget] =
    React.useState<CalendarDropTarget | null>(null)
  const activeResizeTargetRef = React.useRef<CalendarDropTarget | null>(null)
  const lastResizeTargetRef = React.useRef<CalendarDropTarget | null>(null)
  const [activeDragRect, setActiveDragRect] = React.useState<DOMRect | null>(null)
  const activeDragRectRef = React.useRef<DOMRect | null>(null)
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
  const [liveAnnouncement, setLiveAnnouncement] = React.useState("")
  const suppressedPointerClickOccurrenceIdRef = React.useRef<string | null>(null)
  const resolvedResourceFilter = React.useMemo(() => {
    const nextFilter = resourceFilter ?? internalResourceFilter
    const dedupedFilter = Array.from(new Set(nextFilter)).filter((id) =>
      allResourceIds.includes(id)
    )

    if (allResourceIds.length === 0) {
      return dedupedFilter
    }

    return dedupedFilter.length > 0 ? dedupedFilter : allResourceIds
  }, [allResourceIds, internalResourceFilter, resourceFilter])
  const eventDetailsEnabled = eventDetails !== undefined && eventDetails !== false
  const openEventDetailsOnSelect =
    typeof eventDetails === "object" ? eventDetails.openOnSelect ?? true : true
  const keyboardShortcutsEnabled =
    keyboardShortcuts !== undefined && keyboardShortcuts !== false

  React.useEffect(() => {
    activeDragRef.current = activeDrag
  }, [activeDrag])

  React.useEffect(() => {
    activeDragInteractionRef.current = activeDragInteraction
  }, [activeDragInteraction])

  React.useEffect(() => {
    activeDragOffsetMinutesRef.current = activeDragOffsetMinutes
  }, [activeDragOffsetMinutes])

  React.useEffect(() => {
    activeDragRectRef.current = activeDragRect
  }, [activeDragRect])

  React.useEffect(() => {
    setIsHydrated(true)
  }, [])

  React.useLayoutEffect(() => {
    setOptimisticEvents(events)
  }, [events])

  React.useEffect(() => {
    setInternalResourceFilter((currentFilter) => {
      if (resourceFilter) {
        return currentFilter
      }

      const nextFilter =
        currentFilter.length > 0
          ? currentFilter.filter((id) => allResourceIds.includes(id))
          : defaultResourceFilter ?? allResourceIds

      return nextFilter.length > 0 || allResourceIds.length === 0
        ? nextFilter
        : allResourceIds
    })
  }, [allResourceIds, defaultResourceFilter, resourceFilter])

  React.useEffect(() => {
    if (!isHydrated || !keyboardShortcutsEnabled) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        !(
          event.key === "?" ||
          (event.key === "/" && event.shiftKey)
        )
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
  }, [isHydrated, keyboardShortcutsEnabled])

  function setActiveResourceIds(nextResourceIds: string[]) {
    const dedupedResourceIds = Array.from(new Set(nextResourceIds)).filter((id) =>
      allResourceIds.includes(id)
    )

    if (!resourceFilter) {
      setInternalResourceFilter(dedupedResourceIds)
    }

    onResourceFilterChange?.(dedupedResourceIds)
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

  function updateActiveDropTarget(target: CalendarDropTarget | null) {
    if (areDropTargetsEqual(activeDropTargetRef.current, target)) {
      return
    }

    activeDropTargetRef.current = target
    setActiveDropTarget(target)

    if (target) {
      lastDropTargetRef.current = target
    }
  }

  function updateActiveResizeTarget(target: CalendarDropTarget | null) {
    if (areDropTargetsEqual(activeResizeTargetRef.current, target)) {
      return
    }

    activeResizeTargetRef.current = target
    setActiveResizeTarget(target)

    if (target) {
      lastResizeTargetRef.current = target
    }
  }

  function clearActiveDragState() {
    setActiveDrag(null)
    setActiveDragInteraction(null)
    updateActiveDropTarget(null)
    setActiveDragOffsetMinutes(0)
    setActiveDragRect(null)
    lastDropTargetRef.current = null
  }

  function clearActiveResize() {
    setActiveResize(null)
    updateActiveResizeTarget(null)
    lastResizeTargetRef.current = null
  }

  const shouldSuppressEventClick = React.useCallback((occurrenceId: string) => {
    if (suppressedPointerClickOccurrenceIdRef.current !== occurrenceId) {
      return false
    }

    suppressedPointerClickOccurrenceIdRef.current = null
    return true
  }, [])

  const shouldBlockTimedRange = React.useCallback(
    (start: Date, end: Date, allDay: boolean | undefined) => {
      if (
        allDay ||
        resolvedView === "month" ||
        resolvedView === "agenda" ||
        !blockedRanges?.length
      ) {
        return false
      }

      return intervalOverlapsBlockedRanges(start, end, blockedRanges)
    },
    [blockedRanges, resolvedView]
  )

  const previewOccurrence = React.useMemo(() => {
    if (activeResize && activeResizeTarget) {
      const operation = getResizeOperation(
        activeResize.occurrence,
        activeResize.edge,
        activeResizeTarget,
        slotDuration
      )

      if (
        shouldBlockTimedRange(
          operation.nextStart,
          operation.nextEnd,
          activeResize.occurrence.allDay
        )
      ) {
        return null
      }

      return {
        ...activeResize.occurrence,
        start: operation.nextStart,
        end: operation.nextEnd,
      }
    }

    if (!activeDrag || !activeDropTarget) {
      return null
    }

    const nextPreviewOccurrence = getPreviewOccurrence(
      activeDrag,
      activeDropTarget,
      slotDuration,
      activeDragOffsetMinutes
    )
    const previewAllDay =
      activeDrag.kind === "event"
        ? nextPreviewOccurrence.allDay
        : activeDrag.occurrence.allDay

    if (
      shouldBlockTimedRange(
        nextPreviewOccurrence.start,
        nextPreviewOccurrence.end,
        previewAllDay
      )
    ) {
      return null
    }

    return nextPreviewOccurrence
  }, [
    activeDrag,
    activeDragOffsetMinutes,
    activeDropTarget,
    activeResize,
    activeResizeTarget,
    shouldBlockTimedRange,
    slotDuration,
  ])

  const filteredOccurrences = React.useMemo(() => {
    return filterOccurrencesByResource(
      expandOccurrences(optimisticEvents, range),
      resolvedResourceFilter
    )
  }, [optimisticEvents, range, resolvedResourceFilter])

  const occurrences = React.useMemo(() => {
    if (!previewOccurrence || !activeResize) {
      return filteredOccurrences
    }

    return filteredOccurrences.map((occurrence) =>
      occurrence.occurrenceId === previewOccurrence.occurrenceId
        ? previewOccurrence
        : occurrence
    )
  }, [activeResize, filteredOccurrences, previewOccurrence])

  React.useEffect(() => {
    if (
      selectedEventId &&
      !occurrences.some((occurrence) => occurrence.occurrenceId === selectedEventId)
    ) {
      onSelectedEventChange?.(undefined)
    }

    if (
      detailsOccurrence &&
      !occurrences.some(
        (occurrence) =>
          occurrence.occurrenceId === detailsOccurrence.occurrenceId
      )
    ) {
      setDetailsOccurrence(null)
    }
  }, [detailsOccurrence, occurrences, onSelectedEventChange, selectedEventId])

  function announce(message: string) {
    setLiveAnnouncement(message)
  }

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

  function handleSelectEvent(
    occurrence: CalendarOccurrence,
    options: {
      openDetails?: boolean
    } = {}
  ) {
    setContextMenu(null)
    onSelectedEventChange?.(occurrence.occurrenceId)
    onEventSelect?.(occurrence)

    if (options.openDetails ?? openEventDetailsOnSelect) {
      openEventDetails(occurrence)
    }
  }

  function closeContextMenu() {
    setContextMenu(null)
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
      resources?.find((resource) => resolvedResourceFilter.includes(resource.id)) ??
      resources?.[0]

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

    if (shouldBlockTimedRange(operation.start, operation.end, operation.allDay)) {
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
      const operation: CalendarMoveOperation = {
        allDay: context.allDay,
        nextEnd: context.nextEnd,
        nextStart: context.nextStart,
        occurrence: context.occurrence,
        previousEnd: context.previousEnd,
        previousStart: context.previousStart,
        scope:
          context.scope ??
          (context.occurrence.isRecurringInstance ? "series" : "occurrence"),
      }

      setOptimisticEvents((currentEvents) =>
        applyMoveOperation(currentEvents, operation)
      )
      onEventMove?.(operation)
      announce(
        `Moved ${context.occurrence.title} to ${formatAnnouncementRange(
          context.nextStart,
          context.nextEnd,
          context.allDay ?? context.occurrence.allDay
        )}.`
      )
      return
    }

    const operation: CalendarResizeOperation = {
      edge: context.edge,
      nextEnd: context.nextEnd,
      nextStart: context.nextStart,
      occurrence: context.occurrence,
      previousEnd: context.previousEnd,
      previousStart: context.previousStart,
      scope:
        context.scope ??
        (context.occurrence.isRecurringInstance ? "series" : "occurrence"),
    }

    setOptimisticEvents((currentEvents) =>
      applyResizeOperation(currentEvents, operation)
    )
    onEventResize?.(operation)
    announce(
      `Resized ${context.occurrence.title} to ${formatAnnouncementRange(
        context.nextStart,
        context.nextEnd,
        context.occurrence.allDay
      )}.`
    )
  }

  function commitEventUpdate(nextEvent: CalendarEvent) {
    if (!detailsOccurrence || !onEventUpdate) {
      return
    }

    const previousEvent =
      optimisticEvents.find((event) => event.id === detailsOccurrence.sourceEventId) ??
      {
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

  function requestEventChange(
    context: CalendarEventChangeConfirmationContext
  ) {
    closeContextMenu()

    const allDay =
      context.action === "move"
        ? context.allDay ?? context.occurrence.allDay
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

  function moveOccurrenceWithTarget(
    occurrence: CalendarOccurrence,
    target: CalendarDropTarget,
    dragOffsetMinutes = 0
  ) {
    if (!onEventMove || !canMoveOccurrence(occurrence)) {
      return
    }

    const operation = getMoveOperation(occurrence, target, dragOffsetMinutes)
    requestEventChange({
      action: "move",
      ...operation,
    })
  }

  function resizeOccurrenceWithTarget(
    occurrence: CalendarOccurrence,
    edge: "start" | "end",
    target: CalendarDropTarget
  ) {
    if (!onEventResize || !canResizeOccurrence(occurrence)) {
      return
    }

    const operation = getResizeOperation(occurrence, edge, target, slotDuration)
    requestEventChange({
      action: "resize",
      ...operation,
    })
  }

  function handleResizeHandlePointerDown(
    occurrence: CalendarOccurrence,
    edge: "start" | "end",
    event: React.PointerEvent<HTMLSpanElement>
  ) {
    if (!onEventResize || !canResizeOccurrence(occurrence)) {
      announce("This event cannot be resized.")
      return
    }

    closeContextMenu()
    closeEventDetails()
    setActiveResize({
      edge,
      occurrence,
      pointerId: event.pointerId,
    })
    updateActiveResizeTarget(
      getTimeGridDropTargetFromPoint(event.clientX, event.clientY)
    )
  }

  function handleEventDragPointerDown(
    occurrence: CalendarOccurrence,
    variant: CalendarDragData["variant"],
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    if (!onEventMove || !canMoveOccurrence(occurrence)) {
      return
    }

    closeContextMenu()
    closeEventDetails()
    suppressedPointerClickOccurrenceIdRef.current = null
    setActiveDrag({
      kind: "event",
      occurrence,
      variant,
    })
    setActiveDragInteraction({
      currentClientX: event.clientX,
      currentClientY: event.clientY,
      initialClientX: event.clientX,
      initialClientY: event.clientY,
      isDragging: false,
      pointerId: event.pointerId,
    })
    updateActiveDropTarget(null)
    lastDropTargetRef.current = null
    setActiveDragRect(getDragSurfaceRect(event.currentTarget))
    setActiveDragOffsetMinutes(0)
  }

  const commitPointerResize = React.useEffectEvent(
    (
      resize: NonNullable<typeof activeResize>,
      target: CalendarDropTarget
    ) => {
      resizeOccurrenceWithTarget(resize.occurrence, resize.edge, target)
    }
  )
  const clearPointerResize = React.useEffectEvent(() => {
    clearActiveResize()
  })
  const commitPointerDrag = React.useEffectEvent(
    (
      drag: Extract<CalendarDragData, { kind: "event" }>,
      target: CalendarDropTarget,
      dragOffsetMinutes: number
    ) => {
      moveOccurrenceWithTarget(drag.occurrence, target, dragOffsetMinutes)
    }
  )
  const selectPointerDragOccurrence = React.useEffectEvent(
    (drag: Extract<CalendarDragData, { kind: "event" }>) => {
      handleSelectEvent(drag.occurrence)
    }
  )
  const clearPointerDrag = React.useEffectEvent(() => {
    clearActiveDragState()
  })

  React.useEffect(() => {
    if (!activeResize) {
      return
    }

    const resize = activeResize

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerId !== resize.pointerId) {
        return
      }

      updateActiveResizeTarget(
        getTimeGridDropTargetFromPoint(event.clientX, event.clientY)
      )
    }

    function handlePointerUp(event: PointerEvent) {
      if (event.pointerId !== resize.pointerId) {
        return
      }

      const target =
        getTimeGridDropTargetFromPoint(event.clientX, event.clientY) ??
        activeResizeTargetRef.current ??
        lastResizeTargetRef.current

      if (!target) {
        clearPointerResize()
        return
      }

      commitPointerResize(resize, target)
      clearPointerResize()
    }

    function handlePointerCancel(event: PointerEvent) {
      if (event.pointerId !== resize.pointerId) {
        return
      }

      clearPointerResize()
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
    window.addEventListener("pointercancel", handlePointerCancel)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("pointercancel", handlePointerCancel)
    }
  }, [activeResize])

  const activeDragPointerId = activeDragInteraction?.pointerId

  React.useEffect(() => {
    if (activeDragPointerId == null) {
      return
    }

    const pointerId = activeDragPointerId

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerId !== pointerId) {
        return
      }

      const drag = activeDragRef.current
      const interaction = activeDragInteractionRef.current

      if (!drag || !interaction || drag.kind !== "event") {
        return
      }

      const nextTarget =
        getCalendarDropTargetFromPoint(event.clientX, event.clientY) ??
        lastDropTargetRef.current

      if (!interaction.isDragging) {
        if (
          getPointerDistance(
            interaction.initialClientX,
            interaction.initialClientY,
            event.clientX,
            event.clientY
          ) < dragActivationDistance
        ) {
          return
        }

        setActiveDragInteraction({
          ...interaction,
          currentClientX: event.clientX,
          currentClientY: event.clientY,
          isDragging: true,
        })
        setActiveDragOffsetMinutes(
          getDragOffsetMinutes(drag, activeDragRectRef.current, event.clientY)
        )
        updateActiveDropTarget(nextTarget)
        return
      }

      event.preventDefault()
      setActiveDragInteraction((currentInteraction) => {
        if (
          !currentInteraction ||
          currentInteraction.pointerId !== pointerId ||
          (currentInteraction.currentClientX === event.clientX &&
            currentInteraction.currentClientY === event.clientY)
        ) {
          return currentInteraction
        }

        return {
          ...currentInteraction,
          currentClientX: event.clientX,
          currentClientY: event.clientY,
        }
      })
      updateActiveDropTarget(nextTarget)
    }

    function handlePointerUp(event: PointerEvent) {
      if (event.pointerId !== pointerId) {
        return
      }

      const drag = activeDragRef.current
      const interaction = activeDragInteractionRef.current

      if (!drag || !interaction || drag.kind !== "event") {
        clearPointerDrag()
        return
      }

      const target =
        getCalendarDropTargetFromPoint(event.clientX, event.clientY) ??
        activeDropTargetRef.current ??
        lastDropTargetRef.current
      const dragOffsetMinutes = activeDragOffsetMinutesRef.current
      const wasDragging = interaction.isDragging

      suppressedPointerClickOccurrenceIdRef.current = drag.occurrence.occurrenceId
      clearPointerDrag()

      if (!wasDragging) {
        selectPointerDragOccurrence(drag)
        return
      }

      if (target) {
        commitPointerDrag(drag, target, dragOffsetMinutes)
      }
    }

    function handlePointerCancel(event: PointerEvent) {
      if (event.pointerId !== pointerId) {
        return
      }

      const drag = activeDragRef.current

      if (drag?.kind === "event") {
        suppressedPointerClickOccurrenceIdRef.current = drag.occurrence.occurrenceId
      }

      clearPointerDrag()
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
    window.addEventListener("pointercancel", handlePointerCancel)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("pointercancel", handlePointerCancel)
    }
  }, [activeDragPointerId])

  function getDragSurfaceRect(target: EventTarget | null): DOMRect | null {
    if (!(target instanceof Element)) {
      return null
    }

    return (
      target
        .closest<HTMLElement>("[data-calendar-drag-surface]")
        ?.getBoundingClientRect() ?? null
    )
  }

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

    if (event.shiftKey && onEventResize) {
      if (!canResizeOccurrence(occurrence)) {
        announce("This event cannot be resized.")
        return
      }

      const operation: CalendarResizeOperation = {
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
      }

      requestEventChange({
        action: "resize",
        ...operation,
      })
      return
    }

    if (event.altKey && onEventResize) {
      if (!canResizeOccurrence(occurrence)) {
        announce("This event cannot be resized.")
        return
      }

      const operation: CalendarResizeOperation = {
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
      }

      requestEventChange({
        action: "resize",
        ...operation,
      })
      return
    }

    if (!onEventMove || !canMoveOccurrence(occurrence)) {
      announce("This event cannot be moved.")
      return
    }

    const operation: CalendarMoveOperation = {
      occurrence,
      nextStart: addMinutes(addDays(occurrence.start, dayDelta), minuteDelta),
      nextEnd: addMinutes(addDays(occurrence.end, dayDelta), minuteDelta),
      previousStart: occurrence.start,
      previousEnd: occurrence.end,
      allDay: occurrence.allDay,
      scope: occurrence.isRecurringInstance ? "series" : "occurrence",
    }

    requestEventChange({
      action: "move",
      ...operation,
    })
  }

  const requestEventCreateRef = React.useRef(requestEventCreate)
  const handleEventDragPointerDownRef = React.useRef(handleEventDragPointerDown)
  const handleEventKeyCommandRef = React.useRef(handleEventKeyCommand)
  const handleOpenContextMenuRef = React.useRef(handleOpenContextMenu)
  const handleResizeHandlePointerDownRef = React.useRef(
    handleResizeHandlePointerDown
  )
  const handleSelectEventRef = React.useRef(handleSelectEvent)

  React.useLayoutEffect(() => {
    requestEventCreateRef.current = requestEventCreate
    handleEventDragPointerDownRef.current = handleEventDragPointerDown
    handleEventKeyCommandRef.current = handleEventKeyCommand
    handleOpenContextMenuRef.current = handleOpenContextMenu
    handleResizeHandlePointerDownRef.current = handleResizeHandlePointerDown
    handleSelectEventRef.current = handleSelectEvent
  })

  const handleEventCreateRequest = React.useCallback(
    (operation: CalendarCreateOperation) => {
      requestEventCreateRef.current(operation)
    },
    []
  )
  const handleEventDragPointerDownEvent = React.useCallback(
    (
      occurrence: CalendarOccurrence,
      variant: CalendarDragData["variant"],
      event: React.PointerEvent<HTMLButtonElement>
    ) => {
      handleEventDragPointerDownRef.current(occurrence, variant, event)
    },
    []
  )
  const handleEventKeyCommandEvent = React.useCallback(
    (
      occurrence: CalendarOccurrence,
      event: React.KeyboardEvent<HTMLButtonElement>
    ) => {
      handleEventKeyCommandRef.current(occurrence, event)
    },
    []
  )
  const handleOpenContextMenuEvent = React.useCallback(
    (
      occurrence: CalendarOccurrence,
      position: CalendarEventMenuPosition
    ) => {
      handleOpenContextMenuRef.current(occurrence, position)
    },
    []
  )
  const handleResizeHandlePointerDownEvent = React.useCallback(
    (
      occurrence: CalendarOccurrence,
      edge: "start" | "end",
      event: React.PointerEvent<HTMLSpanElement>
    ) => {
      handleResizeHandlePointerDownRef.current(occurrence, edge, event)
    },
    []
  )
  const handleSelectEventOnly = React.useCallback(
    (occurrence: CalendarOccurrence) => {
      handleSelectEventRef.current(occurrence)
    },
    []
  )

  const currentLabel = getRangeLabel(date, resolvedView, {
    agendaDays,
    hiddenDays: resolvedHiddenDays,
    hourCycle,
    locale,
    timeZone,
    weekStartsOn,
  })
  const isPointerDragging =
    activeDrag?.kind === "event" && !!activeDragInteraction?.isDragging
  const sharedViewProps = React.useMemo<SharedViewProps>(() => {
    return {
      activeDropTarget: isPointerDragging ? activeDropTarget : null,
      anchorDate: date,
      blockedRanges,
      businessHours,
      classNames,
      density,
      dragPreviewOccurrence:
        activeDrag?.kind === "event" ? previewOccurrence ?? undefined : undefined,
      draggingOccurrenceId:
        isPointerDragging && activeDrag?.kind === "event"
          ? activeDrag.occurrence.occurrenceId
          : undefined,
      getEventColor,
      hiddenDays: resolvedHiddenDays,
      hourCycle,
      interactive: isHydrated,
      locale,
      occurrences,
      onEventCreate: onEventCreate ? handleEventCreateRequest : undefined,
      onEventDragPointerDown: handleEventDragPointerDownEvent,
      onEventKeyCommand: handleEventKeyCommandEvent,
      onOpenContextMenu: handleOpenContextMenuEvent,
      onResizeHandlePointerDown: handleResizeHandlePointerDownEvent,
      onSelectEvent: handleSelectEventOnly,
      previewOccurrenceId: activeResize ? previewOccurrence?.occurrenceId : undefined,
      renderEvent,
      scrollToTime,
      secondaryTimeZone,
      selectedEventId,
      shouldSuppressEventClick: shouldSuppressEventClick,
      showCreatePreviewMeta,
      showDragPreviewMeta,
      showSecondaryTimeZone,
      slotDuration,
      slotHeight: resolvedSlotHeight,
      timeZone,
      weekStartsOn,
    }
  }, [
    activeDrag,
    activeDropTarget,
    activeResize,
    blockedRanges,
    businessHours,
    classNames,
    date,
    density,
    getEventColor,
    handleEventCreateRequest,
    handleEventDragPointerDownEvent,
    handleEventKeyCommandEvent,
    handleOpenContextMenuEvent,
    handleResizeHandlePointerDownEvent,
    handleSelectEventOnly,
    hourCycle,
    isHydrated,
    isPointerDragging,
    locale,
    occurrences,
    onEventCreate,
    previewOccurrence,
    renderEvent,
    resolvedHiddenDays,
    resolvedSlotHeight,
    scrollToTime,
    secondaryTimeZone,
    selectedEventId,
    shouldSuppressEventClick,
    showCreatePreviewMeta,
    showDragPreviewMeta,
    showSecondaryTimeZone,
    slotDuration,
    timeZone,
    weekStartsOn,
  ])
  const emptyStateContent = renderEmptyState?.({
    activeResourceIds: resolvedResourceFilter,
    clearResourceFilter: () => setActiveResourceIds(allResourceIds),
    resources: resources ?? [],
    view: resolvedView,
  })
  const portals = (
    <>
      {isPointerDragging && activeDrag?.kind === "event" && activeDragRect ? (
        <div className="pointer-events-none fixed inset-0 z-50">
          <EventSurface
            accentColor={getResolvedAccentColor(
              activeDrag.occurrence,
              getEventColor
            )}
            className={getCalendarSlotClassName(
              classNames,
              "dragOverlay",
              activeDragRect ? undefined : "w-64 max-w-[80vw]"
            )}
            density={density}
            dragging
            event={activeDrag.occurrence}
            overlay
            renderEvent={renderEvent}
            shouldSuppressClick={shouldSuppressEventClick}
            style={getDragOverlayStyle(activeDragRect, activeDragInteraction)}
            previewMetaLabel={
              showDragPreviewMeta
                ? formatDurationLabel(
                    activeDrag.occurrence.start,
                    activeDrag.occurrence.end,
                    activeDrag.occurrence.allDay
                  )
                : undefined
            }
            timeLabel={getEventMetaLabel(activeDrag.occurrence, {
              hourCycle,
              locale,
              timeZone,
            })}
            variant={activeDrag.variant}
          />
        </div>
      ) : null}
      {contextMenu ? (
        <CalendarEventContextMenu
          hourCycle={hourCycle}
          locale={locale}
          occurrence={contextMenu.occurrence}
          onArchive={
            canArchiveOccurrence(contextMenu.occurrence) && onEventArchive
              ? () => handleArchiveEvent(contextMenu.occurrence)
              : undefined
          }
          onClose={closeContextMenu}
          onDelete={
            canDeleteOccurrence(contextMenu.occurrence) && onEventDelete
              ? () => handleDeleteEvent(contextMenu.occurrence)
              : undefined
          }
          onDuplicate={
            canDuplicateOccurrence(contextMenu.occurrence) && onEventDuplicate
              ? () => handleDuplicateEvent(contextMenu.occurrence)
              : undefined
          }
          onOpenDetails={
            eventDetailsEnabled && canOpenEventDetails(contextMenu.occurrence)
              ? () => openEventDetails(contextMenu.occurrence)
              : undefined
          }
          timeZone={timeZone}
          x={contextMenu.position.x}
          y={contextMenu.position.y}
        />
      ) : null}
      <CalendarEventChangeConfirmationDialog
        config={eventChangeConfirmation}
        context={pendingEventChange}
        hourCycle={hourCycle}
        locale={locale}
        onCancel={closePendingEventChange}
        onConfirm={handleConfirmPendingEventChange}
        timeZone={timeZone}
      />
      <CalendarEventCreateSheet
        config={createEventSheet}
        initialOperation={createSheetOperation}
        onOpenChange={(open) => {
          if (!open) {
            closeCreateSheet()
          }
        }}
        onSubmit={commitCreateEvent}
        resources={resources}
        timeZone={timeZone}
      />
      <CalendarEventDetailsSheet
        config={eventDetails}
        hourCycle={hourCycle}
        locale={locale}
        occurrence={detailsOccurrence}
        onOpenChange={(open) => {
          if (!open) {
            closeEventDetails()
          }
        }}
        onSubmit={onEventUpdate ? commitEventUpdate : undefined}
        renderContent={renderEventDetails}
        resources={resources}
        secondaryTimeZone={showSecondaryTimeZone ? secondaryTimeZone : undefined}
        timeZone={timeZone}
      />
      <CalendarKeyboardShortcutsDialog
        config={keyboardShortcuts}
        onOpenChange={setIsKeyboardShortcutsOpen}
        open={isKeyboardShortcutsOpen}
      />
    </>
  )

  return (
    <div
      className={getCalendarSlotClassName(
        classNames,
        "root",
        "flex min-h-[42rem] flex-col overflow-hidden rounded-[calc(var(--radius)*1.6)] border border-border/70 bg-background",
        getCalendarSurfaceShadowClassName(surfaceShadow)
      )}
      data-testid="calendar-root"
    >
      <CalendarToolbar
        activeResourceIds={resolvedResourceFilter}
        availableViews={resolvedAvailableViews}
        classNames={classNames}
        currentLabel={currentLabel}
        density={density}
        onNavigate={handleNavigate}
        onQuickCreate={onEventCreate ? handleQuickCreate : undefined}
        onResourceFilterChange={
          resources?.length && resources.length > 1 ? setActiveResourceIds : undefined
        }
        onToday={handleToday}
        onViewChange={onViewChange}
        renderToolbarExtras={renderToolbarExtras}
        resources={resources}
        secondaryTimeZone={secondaryTimeZone}
        showSecondaryTimeZone={showSecondaryTimeZone}
        timeZone={timeZone}
        view={resolvedView}
      />
      <div
        className={getCalendarSlotClassName(
          classNames,
          "shell",
          "relative flex min-h-0 flex-1 flex-col bg-background"
        )}
      >
        {resolvedView === "month" ? (
          <CalendarMonthView {...sharedViewProps} />
        ) : null}
        {resolvedView === "week" ? (
          <CalendarWeekView
            {...sharedViewProps}
            maxHour={maxHour}
            minHour={minHour}
          />
        ) : null}
        {resolvedView === "day" ? (
          <CalendarDayView
            {...sharedViewProps}
            maxHour={maxHour}
            minHour={minHour}
          />
        ) : null}
        {resolvedView === "agenda" ? (
          <CalendarAgendaView
            {...sharedViewProps}
            range={getVisibleRange(date, "agenda", {
              agendaDays,
              hiddenDays: resolvedHiddenDays,
              hourCycle,
              locale,
              timeZone,
            })}
          />
        ) : null}
        {occurrences.length === 0 ? (
          <div className="pointer-events-none absolute inset-x-4 bottom-4 z-20 flex justify-center">
            <div className="pointer-events-auto max-w-md rounded-[calc(var(--radius)*1.1)] border border-border/70 bg-background/95 px-4 py-3 text-center shadow-lg backdrop-blur-sm">
              {emptyStateContent ?? (
                <>
                  <p className="font-medium">No events match this view.</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Adjust the resource filters or create a new event to start
                    filling the schedule.
                  </p>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>
      {isHydrated ? createPortal(portals, document.body) : null}
      <p
        aria-live="polite"
        className="sr-only"
        data-testid="calendar-live-announcement"
      >
        {liveAnnouncement}
      </p>
    </div>
  )
}

function getCalendarSurfaceShadowClassName(surfaceShadow: "none" | "sm" | "md") {
  if (surfaceShadow === "sm") {
    return "shadow-[0_12px_36px_-24px_rgba(15,23,42,0.28)]"
  }

  if (surfaceShadow === "md") {
    return "shadow-[0_20px_80px_-48px_rgba(15,23,42,0.55)]"
  }

  return undefined
}

function getPreviewOccurrence(
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

function getMoveOperation(
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

function getDragOffsetMinutes(
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

function getResizeOperation(
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

function areDropTargetsEqual(
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

function getPointerDistance(
  startClientX: number,
  startClientY: number,
  currentClientX: number,
  currentClientY: number
) {
  return Math.hypot(currentClientX - startClientX, currentClientY - startClientY)
}

function getDragOverlayStyle(
  dragRect: DOMRect | null,
  interaction: ActiveDragInteraction | null
): React.CSSProperties | undefined {
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

function getCalendarDropTargetFromPoint(
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

function getTimeGridDropTargetFromPoint(
  clientX: number,
  clientY: number
): CalendarDropTarget | null {
  const target = getCalendarDropTargetFromPoint(clientX, clientY)

  return target?.kind === "slot" ? target : null
}
