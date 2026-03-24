"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useSensor,
  useSensors,
  type ClientRect,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
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
} from "../types"
import {
  applyMoveOperation,
  applyResizeOperation,
  clampResize,
  copyTimeParts,
  expandOccurrences,
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
} from "../utils"
import { CalendarAgendaView } from "./calendar-agenda-view"
import { EventSurface, getResolvedAccentColor } from "./calendar-event-card"
import { CalendarMonthView } from "./calendar-month-view"
import { CalendarToolbar } from "./calendar-toolbar"
import { CalendarDayView, CalendarWeekView } from "./calendar-time-grid-view"
import {
  compactSlotHeight,
  defaultMaxHour,
  defaultMinHour,
  defaultSlotDuration,
  slotHeight as defaultSlotHeight,
  type CalendarEventMenuPosition,
  type CalendarRootProps,
  type SharedViewProps,
} from "./shared"
import { CalendarEventChangeConfirmationDialog } from "./calendar-event-change-confirmation-dialog"
import { CalendarEventCreateSheet } from "./calendar-event-create-sheet"
import { CalendarEventContextMenu } from "./calendar-event-context-menu"

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
  events,
  getEventColor,
  hiddenDays,
  hourCycle,
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
  onNavigate,
  onSelectedEventChange,
  onToday,
  onViewChange,
  renderEvent,
  resources,
  scrollToTime,
  selectedEventId,
  slotDuration = defaultSlotDuration,
  slotHeight: customSlotHeight,
  timeZone,
  view,
  weekStartsOn = 1,
}: CalendarRootProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    })
  )
  const [optimisticEvents, setOptimisticEvents] =
    React.useState<CalendarEvent[]>(events)
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
  const deferredEvents = React.useDeferredValue(events)
  const displayEvents =
    optimisticEvents === events ? deferredEvents : optimisticEvents
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
  const lastDropTargetRef = React.useRef<CalendarDropTarget | null>(null)
  const [activeDragRect, setActiveDragRect] = React.useState<ClientRect | null>(
    null
  )
  const [contextMenu, setContextMenu] = React.useState<{
    occurrence: CalendarOccurrence
    position: CalendarEventMenuPosition
  } | null>(null)
  const [pendingEventChange, setPendingEventChange] =
    React.useState<CalendarEventChangeConfirmationContext | null>(null)
  const [createSheetOperation, setCreateSheetOperation] =
    React.useState<CalendarCreateOperation | null>(null)
  const [liveAnnouncement, setLiveAnnouncement] = React.useState("")

  React.useEffect(() => {
    setIsHydrated(true)
  }, [])

  React.useEffect(() => {
    setOptimisticEvents(events)
  }, [events])

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
    if (!activeDrag || !activeDropTarget) {
      return null
    }

    const nextPreviewOccurrence = getPreviewOccurrence(
      activeDrag,
      activeDropTarget,
      slotDuration
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
  }, [activeDrag, activeDropTarget, shouldBlockTimedRange, slotDuration])

  const occurrences = React.useMemo(() => {
    const nextOccurrences = expandOccurrences(displayEvents, range)

    if (!previewOccurrence) {
      return nextOccurrences
    }

    return nextOccurrences.map((occurrence) =>
      occurrence.occurrenceId === previewOccurrence.occurrenceId
        ? previewOccurrence
        : occurrence
    )
  }, [displayEvents, previewOccurrence, range])

  function announce(message: string) {
    setLiveAnnouncement(message)
  }

  function handleSelectEvent(occurrence: CalendarOccurrence) {
    setContextMenu(null)
    onSelectedEventChange?.(occurrence.occurrenceId)
    onEventSelect?.(occurrence)
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
    const canMutate = !occurrence.readOnly
    const hasActions =
      !!onEventDuplicate || (canMutate && (!!onEventArchive || !!onEventDelete))

    if (!hasActions) {
      return
    }

    handleSelectEvent(occurrence)
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
    const defaultResource = resources?.[0]

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
    announce(`Created ${operation.title ?? "a new appointment"}.`)
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
      }

      setOptimisticEvents((currentEvents) =>
        applyMoveOperation(currentEvents, operation)
      )
      onEventMove?.(operation)
      announce(`Moved ${context.occurrence.title}.`)
      return
    }

    const operation: CalendarResizeOperation = {
      edge: context.edge,
      nextEnd: context.nextEnd,
      nextStart: context.nextStart,
      occurrence: context.occurrence,
      previousEnd: context.previousEnd,
      previousStart: context.previousStart,
    }

    setOptimisticEvents((currentEvents) =>
      applyResizeOperation(currentEvents, operation)
    )
    onEventResize?.(operation)
    announce(`Resized ${context.occurrence.title}.`)
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
    target: CalendarDropTarget
  ) {
    if (!onEventMove) {
      return
    }

    const operation = getMoveOperation(occurrence, target)
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
    if (!onEventResize) {
      return
    }

    const operation = getResizeOperation(occurrence, edge, target, slotDuration)
    requestEventChange({
      action: "resize",
      ...operation,
    })
  }

  function handleDragStart(event: DragStartEvent) {
    const dragData = isCalendarDragData(event.active.data.current)
      ? event.active.data.current
      : undefined

    if (!dragData) {
      return
    }

    closeContextMenu()
    setActiveDrag(dragData)
    setActiveDropTarget(null)
    lastDropTargetRef.current = null
    const dragSurfaceRect = getDragSurfaceRect(event.activatorEvent.target)

    setActiveDragRect(dragSurfaceRect ?? event.active.rect.current.initial)
  }

  function handleDragEnd(event: DragEndEvent) {
    const dragData = isCalendarDragData(event.active.data.current)
      ? event.active.data.current
      : undefined
    const target =
      (isCalendarDropTarget(event.over?.data.current)
        ? event.over?.data.current
        : undefined) ??
      lastDropTargetRef.current ??
      undefined

    setActiveDrag(null)
    setActiveDropTarget(null)
    setActiveDragRect(null)
    lastDropTargetRef.current = null

    if (!dragData || !target) {
      return
    }

    if (dragData.kind === "event") {
      moveOccurrenceWithTarget(dragData.occurrence, target)
      return
    }

    resizeOccurrenceWithTarget(dragData.occurrence, dragData.edge, target)
  }

  function getDragSurfaceRect(target: EventTarget | null): ClientRect | null {
    if (!(target instanceof Element)) {
      return null
    }

    return (
      target
        .closest<HTMLElement>("[data-calendar-drag-surface]")
        ?.getBoundingClientRect() ?? null
    )
  }

  function handleDragCancel() {
    setActiveDrag(null)
    setActiveDropTarget(null)
    setActiveDragRect(null)
    lastDropTargetRef.current = null
    closeContextMenu()
  }

  function handleDuplicateEvent(occurrence: CalendarOccurrence) {
    onEventDuplicate?.(occurrence)
    onSelectedEventChange?.(undefined)
    closeContextMenu()
    announce(`Duplicated ${occurrence.title}.`)
  }

  function handleArchiveEvent(occurrence: CalendarOccurrence) {
    onEventArchive?.(occurrence)
    onSelectedEventChange?.(undefined)
    closeContextMenu()
    announce(`Archived ${occurrence.title}.`)
  }

  function handleDeleteEvent(occurrence: CalendarOccurrence) {
    onEventDelete?.(occurrence)
    onSelectedEventChange?.(undefined)
    closeContextMenu()
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
      }

      requestEventChange({
        action: "resize",
        ...operation,
      })
      return
    }

    if (event.altKey && onEventResize) {
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
      }

      requestEventChange({
        action: "resize",
        ...operation,
      })
      return
    }

    if (!onEventMove) {
      return
    }

    const operation: CalendarMoveOperation = {
      occurrence,
      nextStart: addMinutes(addDays(occurrence.start, dayDelta), minuteDelta),
      nextEnd: addMinutes(addDays(occurrence.end, dayDelta), minuteDelta),
      previousStart: occurrence.start,
      previousEnd: occurrence.end,
      allDay: occurrence.allDay,
    }

    requestEventChange({
      action: "move",
      ...operation,
    })
  }

  const currentLabel = getRangeLabel(date, resolvedView, {
    agendaDays,
    hiddenDays: resolvedHiddenDays,
    hourCycle,
    locale,
    timeZone,
    weekStartsOn,
  })
  const sharedViewProps: SharedViewProps = {
    anchorDate: date,
    blockedRanges,
    businessHours,
    classNames,
    density,
    getEventColor,
    hiddenDays: resolvedHiddenDays,
    hourCycle,
    interactive: isHydrated,
    locale,
    occurrences,
    previewOccurrenceId: previewOccurrence?.occurrenceId,
    onEventCreate: onEventCreate ? requestEventCreate : undefined,
    onEventKeyCommand: handleEventKeyCommand,
    onOpenContextMenu: handleOpenContextMenu,
    onSelectEvent: handleSelectEvent,
    renderEvent,
    scrollToTime,
    selectedEventId,
    slotDuration,
    slotHeight: resolvedSlotHeight,
    timeZone,
    weekStartsOn,
  }
  const collisionDetection = React.useCallback<CollisionDetection>((args) => {
    const pointerCollisions = pointerWithin(args)

    if (pointerCollisions.length > 0) {
      return pointerCollisions
    }

    return closestCorners(args)
  }, [])
  const portals = (
    <>
      <DragOverlay>
        {activeDrag?.kind === "event" && !previewOccurrence ? (
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
            event={activeDrag.occurrence}
            overlay
            renderEvent={renderEvent}
            style={
              activeDragRect
                ? {
                    width: activeDragRect.width,
                    height: activeDragRect.height,
                  }
                : undefined
            }
            timeLabel={getEventMetaLabel(activeDrag.occurrence, {
              hourCycle,
              locale,
              timeZone,
            })}
            variant={activeDrag.variant}
          />
        ) : null}
      </DragOverlay>
      {contextMenu ? (
        <CalendarEventContextMenu
          hourCycle={hourCycle}
          locale={locale}
          occurrence={contextMenu.occurrence}
          onArchive={
            !contextMenu.occurrence.readOnly && onEventArchive
              ? () => handleArchiveEvent(contextMenu.occurrence)
              : undefined
          }
          onClose={closeContextMenu}
          onDelete={
            !contextMenu.occurrence.readOnly && onEventDelete
              ? () => handleDeleteEvent(contextMenu.occurrence)
              : undefined
          }
          onDuplicate={
            onEventDuplicate
              ? () => handleDuplicateEvent(contextMenu.occurrence)
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
    </>
  )

  return (
    <div
      className={getCalendarSlotClassName(
        classNames,
        "root",
        "flex min-h-[42rem] flex-col overflow-hidden rounded-[calc(var(--radius)*1.6)] border border-border/70 bg-background shadow-[0_20px_80px_-48px_rgba(15,23,42,0.55)]"
      )}
    >
      <CalendarToolbar
        availableViews={resolvedAvailableViews}
        classNames={classNames}
        currentLabel={currentLabel}
        density={density}
        onNavigate={handleNavigate}
        onQuickCreate={onEventCreate ? handleQuickCreate : undefined}
        onToday={handleToday}
        onViewChange={onViewChange}
        resources={resources}
        timeZone={timeZone}
        view={resolvedView}
      />
      <DndContext
        collisionDetection={collisionDetection}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
        onDragOver={(event) => {
          const nextTarget = isCalendarDropTarget(event.over?.data.current)
            ? event.over.data.current
            : null

          if (nextTarget) {
            lastDropTargetRef.current = nextTarget
          }

          setActiveDropTarget(nextTarget)
        }}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <div
          className={getCalendarSlotClassName(
            classNames,
            "shell",
            "flex min-h-0 flex-1 flex-col bg-background"
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
        </div>
        {isHydrated ? createPortal(portals, document.body) : null}
      </DndContext>
      <p aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </p>
    </div>
  )
}

function getPreviewOccurrence(
  activeDrag: CalendarDragData,
  target: CalendarDropTarget,
  slotDuration: number
) {
  if (activeDrag.kind === "event") {
    const operation = getMoveOperation(activeDrag.occurrence, target)

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
  target: CalendarDropTarget
): CalendarMoveOperation {
  const durationMs = occurrence.end.getTime() - occurrence.start.getTime()
  let nextStart: Date
  let nextEnd: Date
  let allDay = occurrence.allDay

  if (target.kind === "slot") {
    nextStart = setMinuteOfDay(startOfDay(target.day), target.minuteOfDay)
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

function isCalendarDropTarget(value: unknown): value is CalendarDropTarget {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Partial<CalendarDropTarget>

  if (candidate.kind === "slot") {
    return candidate.day instanceof Date && typeof candidate.minuteOfDay === "number"
  }

  if (candidate.kind === "day" || candidate.kind === "all-day") {
    return candidate.day instanceof Date
  }

  return false
}

function isCalendarDragData(value: unknown): value is CalendarDragData {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Partial<CalendarDragData>

  if (candidate.kind !== "event" && candidate.kind !== "resize") {
    return false
  }

  const occurrence = candidate.occurrence

  if (
    !occurrence ||
    typeof occurrence !== "object" ||
    !(occurrence.start instanceof Date) ||
    !(occurrence.end instanceof Date)
  ) {
    return false
  }

  if (candidate.kind === "resize") {
    return candidate.edge === "start" || candidate.edge === "end"
  }

  return true
}
