import * as React from "react"
import { endOfDay, isSameMonth, isSameYear, startOfDay } from "date-fns"

import type { CalendarEvent } from "../../types"
import {
  formatDayNumber,
  formatMonthDayLabel,
  getCalendarSlotClassName,
  getNextVisibleDay,
  getWeekDays,
  getWeekZoomDayCounts,
  getZoomedWeekDays,
  intervalOverlapsBlockedRanges,
  normalizeAvailableViews,
  normalizeHiddenDays,
  resolveCalendarView,
} from "../../utils"
import { CalendarAgendaView } from "./agenda-view"
import { CalendarMonthView } from "./month-view"
import { CalendarTimelineView } from "./timeline-view"
import { CalendarToolbar } from "./toolbar"
import { CalendarDayView, CalendarWeekView } from "./time-grid-view"
import {
  compactSlotHeight,
  defaultMaxHour,
  defaultMinHour,
  defaultSlotDuration,
  slotHeight as defaultSlotHeight,
  type CalendarRootProps,
} from "../shared"
import { CalendarRootPortals } from "./root/calendar/portals"
import { getCalendarSurfaceShadowClassName } from "./root/root-utils"
import { useCalendarDerivedState } from "./root/use-calendar-derived-state"
import { useCalendarEventActions } from "./root/use-calendar-event-actions"
import { useCalendarPragmaticEventDrag } from "./root/use-calendar-pragmatic-event-drag"
import { useCalendarPointerInteractions } from "./root/use-calendar-pointer-interactions"

type ZoomDirection = "in" | "out"

function getTouchDistance(firstTouch: Touch, secondTouch: Touch) {
  return Math.hypot(
    secondTouch.clientX - firstTouch.clientX,
    secondTouch.clientY - firstTouch.clientY
  )
}

function formatZoomedWeekLabel(
  days: Date[],
  options: {
    locale?: string
    timeZone?: string
  }
) {
  const firstDay = days[0]
  const lastDay = days[days.length - 1]

  if (!firstDay || !lastDay) {
    return ""
  }

  const yearFormatter = new Intl.DateTimeFormat(options.locale, {
    year: "numeric",
    ...(options.timeZone ? { timeZone: options.timeZone } : {}),
  })

  if (isSameYear(firstDay, lastDay)) {
    if (isSameMonth(firstDay, lastDay)) {
      return `${formatMonthDayLabel(firstDay, options)} - ${formatDayNumber(lastDay, options)}, ${yearFormatter.format(lastDay)}`
    }

    return `${formatMonthDayLabel(firstDay, options)} - ${formatMonthDayLabel(lastDay, options)}, ${yearFormatter.format(lastDay)}`
  }

  return `${formatMonthDayLabel(firstDay, options)} - ${new Intl.DateTimeFormat(
    options.locale,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...(options.timeZone ? { timeZone: options.timeZone } : {}),
    }
  ).format(lastDay)}`
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
  surfaceVariant = "card",
  defaultResourceFilter,
  timeZone,
  view,
  weekStartsOn = 1,
}: CalendarRootProps) {
  const [optimisticEvents, setOptimisticEvents] =
    React.useState<CalendarEvent[]>(events)
  const [isHydrated, setIsHydrated] = React.useState(false)
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
  const usesPragmaticEventMove =
    resolvedView === "week" || resolvedView === "day"
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
  const keyboardShortcutsTrigger =
    typeof keyboardShortcuts === "object"
      ? (keyboardShortcuts.trigger ?? "both")
      : keyboardShortcuts
        ? "both"
        : null
  const keyboardShortcutsButtonLabel =
    typeof keyboardShortcuts === "object"
      ? (keyboardShortcuts.buttonLabel ?? "Shortcuts")
      : "Shortcuts"
  const showKeyboardShortcutsButton =
    keyboardShortcutsTrigger === "both" || keyboardShortcutsTrigger === "button"
  const [weekZoomIndex, setWeekZoomIndex] = React.useState(0)
  const shellRef = React.useRef<HTMLDivElement | null>(null)
  const pinchGestureRef = React.useRef<{
    distance: number
  } | null>(null)
  const wheelGestureRef = React.useRef<{
    accumulatedDelta: number
    lastTimestamp: number
  }>({
    accumulatedDelta: 0,
    lastTimestamp: 0,
  })
  const fullWeekDays = React.useMemo(
    () => getWeekDays(date, weekStartsOn, resolvedHiddenDays),
    [date, resolvedHiddenDays, weekStartsOn]
  )
  const weekZoomDayCounts = React.useMemo(
    () => getWeekZoomDayCounts(fullWeekDays.length),
    [fullWeekDays.length]
  )
  const resolvedWeekZoomIndex = Math.min(
    weekZoomIndex,
    Math.max(0, weekZoomDayCounts.length - 1)
  )
  const activeWeekZoomDayCount = weekZoomDayCounts[resolvedWeekZoomIndex] ?? 1
  const zoomedWeekDays = React.useMemo(
    () =>
      resolvedView === "week"
        ? getZoomedWeekDays(
            date,
            weekStartsOn,
            activeWeekZoomDayCount,
            resolvedHiddenDays
          )
        : null,
    [
      activeWeekZoomDayCount,
      date,
      resolvedHiddenDays,
      resolvedView,
      weekStartsOn,
    ]
  )
  const zoomedWeekRange = React.useMemo(() => {
    if (
      resolvedView !== "week" ||
      !zoomedWeekDays ||
      zoomedWeekDays.length === 0 ||
      activeWeekZoomDayCount >= fullWeekDays.length
    ) {
      return undefined
    }

    return {
      start: startOfDay(zoomedWeekDays[0]),
      end: endOfDay(zoomedWeekDays[zoomedWeekDays.length - 1]),
    }
  }, [
    activeWeekZoomDayCount,
    fullWeekDays.length,
    resolvedView,
    zoomedWeekDays,
  ])
  const zoomedWeekLabel = React.useMemo(() => {
    if (!zoomedWeekRange || !zoomedWeekDays || zoomedWeekDays.length === 0) {
      return undefined
    }

    return formatZoomedWeekLabel(zoomedWeekDays, {
      locale,
      timeZone,
    })
  }, [locale, timeZone, zoomedWeekDays, zoomedWeekRange])
  const canZoomFromWeekToDay =
    resolvedAvailableViews.includes("day") &&
    resolvedAvailableViews.includes("week")
  const canZoomOutFromDayToWeek =
    resolvedAvailableViews.includes("week") &&
    resolvedAvailableViews.includes("day")

  const getFallbackFocusDay = React.useCallback(
    () => startOfDay(getNextVisibleDay(date, resolvedHiddenDays)),
    [date, resolvedHiddenDays]
  )

  const getZoomFocusDayFromElement = React.useCallback(
    (element: Element | null) => {
      const zoomDay = element?.closest<HTMLElement>("[data-calendar-zoom-day]")
        ?.dataset.calendarZoomDay

      if (!zoomDay) {
        return getFallbackFocusDay()
      }

      const parsedDay = new Date(zoomDay)

      return Number.isNaN(parsedDay.getTime())
        ? getFallbackFocusDay()
        : startOfDay(parsedDay)
    },
    [getFallbackFocusDay]
  )

  const applyRangeZoom = React.useEffectEvent(
    (direction: ZoomDirection, focusDate?: Date | null) => {
      if (resolvedView !== "week" && resolvedView !== "day") {
        return
      }

      const nextFocusDay = startOfDay(
        focusDate ?? getNextVisibleDay(date, resolvedHiddenDays)
      )

      if (resolvedView === "week") {
        if (direction === "in") {
          if (resolvedWeekZoomIndex < weekZoomDayCounts.length - 1) {
            setWeekZoomIndex(resolvedWeekZoomIndex + 1)

            if (nextFocusDay.getTime() !== startOfDay(date).getTime()) {
              onDateChange(nextFocusDay)
            }

            return
          }

          if (canZoomFromWeekToDay) {
            if (nextFocusDay.getTime() !== startOfDay(date).getTime()) {
              onDateChange(nextFocusDay)
            }

            onViewChange("day")
          }

          return
        }

        if (resolvedWeekZoomIndex > 0) {
          setWeekZoomIndex(resolvedWeekZoomIndex - 1)

          if (nextFocusDay.getTime() !== startOfDay(date).getTime()) {
            onDateChange(nextFocusDay)
          }
        }

        return
      }

      if (direction === "out" && canZoomOutFromDayToWeek) {
        setWeekZoomIndex(Math.max(0, weekZoomDayCounts.length - 1))

        if (nextFocusDay.getTime() !== startOfDay(date).getTime()) {
          onDateChange(nextFocusDay)
        }

        onViewChange("week")
      }
    }
  )

  const handleToolbarViewChange = React.useCallback(
    (nextView: "month" | "week" | "day" | "timeline" | "agenda") => {
      if (nextView === "week") {
        setWeekZoomIndex(0)
      }

      onViewChange(nextView)
    },
    [onViewChange]
  )

  React.useEffect(() => {
    setIsHydrated(true)
  }, [])

  React.useEffect(() => {
    if (resolvedView === "week" || resolvedView === "day") {
      return
    }

    setWeekZoomIndex(0)
  }, [resolvedView])

  React.useEffect(() => {
    if (weekZoomIndex === resolvedWeekZoomIndex) {
      return
    }

    setWeekZoomIndex(resolvedWeekZoomIndex)
  }, [resolvedWeekZoomIndex, weekZoomIndex])

  React.useEffect(() => {
    const shellElement = shellRef.current

    if (!shellElement) {
      return
    }

    function handleWheel(event: WheelEvent) {
      if (
        !event.ctrlKey ||
        (resolvedView !== "week" && resolvedView !== "day")
      ) {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      const now = event.timeStamp

      if (now - wheelGestureRef.current.lastTimestamp > 220) {
        wheelGestureRef.current.accumulatedDelta = 0
      }

      wheelGestureRef.current.lastTimestamp = now
      wheelGestureRef.current.accumulatedDelta += event.deltaY

      if (Math.abs(wheelGestureRef.current.accumulatedDelta) < 60) {
        return
      }

      const zoomDirection =
        wheelGestureRef.current.accumulatedDelta < 0 ? "in" : "out"

      wheelGestureRef.current.accumulatedDelta = 0
      applyRangeZoom(
        zoomDirection,
        getZoomFocusDayFromElement(event.target as Element)
      )
    }

    function handleTouchStart(event: TouchEvent) {
      if (
        (resolvedView !== "week" && resolvedView !== "day") ||
        event.touches.length !== 2
      ) {
        pinchGestureRef.current = null
        return
      }

      pinchGestureRef.current = {
        distance: getTouchDistance(event.touches[0], event.touches[1]),
      }
    }

    function handleTouchMove(event: TouchEvent) {
      if (
        (resolvedView !== "week" && resolvedView !== "day") ||
        event.touches.length !== 2
      ) {
        return
      }

      const pinchGesture = pinchGestureRef.current

      if (!pinchGesture) {
        pinchGestureRef.current = {
          distance: getTouchDistance(event.touches[0], event.touches[1]),
        }
        return
      }

      const nextDistance = getTouchDistance(event.touches[0], event.touches[1])
      const distanceDelta = nextDistance - pinchGesture.distance

      if (Math.abs(distanceDelta) < 24) {
        return
      }

      event.preventDefault()
      pinchGestureRef.current = {
        distance: nextDistance,
      }

      const midpointX =
        (event.touches[0].clientX + event.touches[1].clientX) / 2
      const midpointY =
        (event.touches[0].clientY + event.touches[1].clientY) / 2
      const focusElement = document.elementFromPoint(midpointX, midpointY)

      applyRangeZoom(
        distanceDelta > 0 ? "in" : "out",
        getZoomFocusDayFromElement(focusElement)
      )
    }

    function clearTouchZoom() {
      pinchGestureRef.current = null
    }

    function preventBrowserGestureZoom(event: Event) {
      if (resolvedView !== "week" && resolvedView !== "day") {
        return
      }

      event.preventDefault()
    }

    shellElement.addEventListener("wheel", handleWheel, {
      passive: false,
    })
    shellElement.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    })
    shellElement.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    })
    shellElement.addEventListener("touchend", clearTouchZoom)
    shellElement.addEventListener("touchcancel", clearTouchZoom)
    shellElement.addEventListener("gesturestart", preventBrowserGestureZoom)
    shellElement.addEventListener("gesturechange", preventBrowserGestureZoom)
    shellElement.addEventListener("gestureend", clearTouchZoom)

    return () => {
      shellElement.removeEventListener("wheel", handleWheel)
      shellElement.removeEventListener("touchstart", handleTouchStart)
      shellElement.removeEventListener("touchmove", handleTouchMove)
      shellElement.removeEventListener("touchend", clearTouchZoom)
      shellElement.removeEventListener("touchcancel", clearTouchZoom)
      shellElement.removeEventListener(
        "gesturestart",
        preventBrowserGestureZoom
      )
      shellElement.removeEventListener(
        "gesturechange",
        preventBrowserGestureZoom
      )
      shellElement.removeEventListener("gestureend", clearTouchZoom)
    }
  }, [applyRangeZoom, getZoomFocusDayFromElement, resolvedView])

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
          : (defaultResourceFilter ?? allResourceIds)

      return nextFilter.length > 0 || allResourceIds.length === 0
        ? nextFilter
        : allResourceIds
    })
  }, [allResourceIds, defaultResourceFilter, resourceFilter])

  const setActiveResourceIds = React.useCallback(
    (nextResourceIds: string[]) => {
      const dedupedResourceIds = Array.from(new Set(nextResourceIds)).filter(
        (id) => allResourceIds.includes(id)
      )

      if (!resourceFilter) {
        setInternalResourceFilter(dedupedResourceIds)
      }

      onResourceFilterChange?.(dedupedResourceIds)
    },
    [allResourceIds, onResourceFilterChange, resourceFilter]
  )

  const shouldBlockTimedRange = React.useCallback(
    (start: Date, end: Date, allDay: boolean | undefined) => {
      if (
        allDay ||
        resolvedView === "month" ||
        resolvedView === "timeline" ||
        resolvedView === "agenda" ||
        !blockedRanges?.length
      ) {
        return false
      }

      return intervalOverlapsBlockedRanges(start, end, blockedRanges)
    },
    [blockedRanges, resolvedView]
  )

  const actions = useCalendarEventActions({
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
  })

  const pointer = useCalendarPointerInteractions({
    announce: actions.announce,
    closeContextMenu: actions.closeContextMenu,
    closeEventDetails: actions.closeEventDetails,
    enableEventMove: !!onEventMove,
    enableEventResize: !!onEventResize,
    moveOccurrenceWithTarget: actions.moveOccurrenceWithTarget,
    preferPragmaticEventMove: usesPragmaticEventMove,
    resizeOccurrenceWithTarget: actions.resizeOccurrenceWithTarget,
    selectOccurrence: (occurrence) => {
      actions.handleSelectEvent(occurrence)
    },
  })
  const pragmaticEventDrag = useCalendarPragmaticEventDrag({
    enabled: usesPragmaticEventMove && !!onEventMove,
    moveOccurrenceWithTarget: actions.moveOccurrenceWithTarget,
  })

  const derived = useCalendarDerivedState({
    activeDrag: pointer.activeDrag,
    activeDragOffsetMinutes: pointer.activeDragOffsetMinutes,
    activeDropTarget: pointer.activeDropTarget,
    activeResize: pointer.activeResize,
    activeResizeTarget: pointer.activeResizeTarget,
    agendaDays,
    availableViews: resolvedAvailableViews,
    blockedRanges,
    businessHours,
    classNames,
    clearResourceFilter: () => setActiveResourceIds(allResourceIds),
    date,
    density,
    getEventColor,
    handleEventCreateRequest: onEventCreate
      ? actions.requestEventCreate
      : undefined,
    handleEventDragPointerDown: pointer.handleEventDragPointerDown,
    handleEventKeyCommand: actions.handleEventKeyCommand,
    handleOpenContextMenu: actions.handleOpenContextMenu,
    handleResizeHandlePointerDown: pointer.handleResizeHandlePointerDown,
    handleSelectEvent: (occurrence) => {
      actions.handleSelectEvent(occurrence)
    },
    hourCycle,
    isHydrated,
    isPointerDragging: pointer.isPointerDragging,
    locale,
    optimisticEvents,
    onDateChange,
    onViewChange,
    renderEmptyState,
    renderEvent,
    resolvedHiddenDays,
    resolvedResourceFilter,
    resolvedSlotHeight,
    resolvedView,
    rangeOverride: zoomedWeekRange,
    resources,
    scrollToTime,
    secondaryTimeZone,
    selectedEventId,
    shouldBlockTimedRange,
    shouldSuppressEventClick: pointer.shouldSuppressEventClick,
    showCreatePreviewMeta,
    showDragPreviewMeta,
    showSecondaryTimeZone,
    slotDuration,
    timeZone,
    weekStartsOn,
    currentLabelOverride: zoomedWeekLabel,
  })
  const detailsOccurrence = actions.detailsOccurrence
  const setDetailsOccurrence = actions.setDetailsOccurrence

  React.useEffect(() => {
    if (
      selectedEventId &&
      !derived.occurrences.some(
        (occurrence) => occurrence.occurrenceId === selectedEventId
      )
    ) {
      onSelectedEventChange?.(undefined)
    }

    if (
      detailsOccurrence &&
      !derived.occurrences.some(
        (occurrence) =>
          occurrence.occurrenceId === detailsOccurrence.occurrenceId
      )
    ) {
      setDetailsOccurrence(null)
    }
  }, [
    detailsOccurrence,
    derived.occurrences,
    onSelectedEventChange,
    setDetailsOccurrence,
    selectedEventId,
  ])

  return (
    <div
      className={getCalendarSlotClassName(
        classNames,
        "root",
        surfaceVariant === "flush"
          ? "flex h-full min-h-0 w-full flex-col overflow-hidden bg-background"
          : "flex min-h-[42rem] flex-col overflow-hidden rounded-[calc(var(--radius)*1.6)] border border-border/70 bg-background",
        surfaceVariant === "card"
          ? getCalendarSurfaceShadowClassName(surfaceShadow)
          : undefined
      )}
      data-testid="calendar-root"
    >
      <CalendarToolbar
        activeResourceIds={resolvedResourceFilter}
        availableViews={resolvedAvailableViews}
        classNames={classNames}
        currentLabel={derived.currentLabel}
        density={density}
        keyboardShortcutsButtonLabel={keyboardShortcutsButtonLabel}
        onNavigate={actions.handleNavigate}
        onOpenKeyboardShortcuts={
          showKeyboardShortcutsButton
            ? () => actions.setIsKeyboardShortcutsOpen(true)
            : undefined
        }
        onQuickCreate={onEventCreate ? actions.handleQuickCreate : undefined}
        onResourceFilterChange={
          resources?.length && resources.length > 1
            ? setActiveResourceIds
            : undefined
        }
        onToday={actions.handleToday}
        onViewChange={handleToolbarViewChange}
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
        data-calendar-zoom-days={
          resolvedView === "week"
            ? activeWeekZoomDayCount
            : resolvedView === "day"
              ? 1
              : undefined
        }
        ref={shellRef}
        style={{
          overscrollBehavior:
            resolvedView === "week" || resolvedView === "day"
              ? "contain"
              : undefined,
          touchAction:
            resolvedView === "week" || resolvedView === "day"
              ? "pan-x pan-y"
              : undefined,
        }}
      >
        {resolvedView === "month" ? (
          <CalendarMonthView {...derived.sharedViewProps} />
        ) : null}
        {resolvedView === "week" ? (
          <CalendarWeekView
            {...derived.sharedViewProps}
            activeDrag={pragmaticEventDrag.activeDrag}
            activeDragOffsetMinutes={pragmaticEventDrag.activeDragOffsetMinutes}
            activeDropTargetStore={pragmaticEventDrag.activeDropTargetStore}
            getPragmaticDragConfig={pragmaticEventDrag.getDraggableConfig}
            isPointerDragging={pragmaticEventDrag.isDragging}
            maxHour={maxHour}
            minHour={minHour}
            visibleDayCount={activeWeekZoomDayCount}
          />
        ) : null}
        {resolvedView === "day" ? (
          <CalendarDayView
            {...derived.sharedViewProps}
            activeDrag={pragmaticEventDrag.activeDrag}
            activeDragOffsetMinutes={pragmaticEventDrag.activeDragOffsetMinutes}
            activeDropTargetStore={pragmaticEventDrag.activeDropTargetStore}
            getPragmaticDragConfig={pragmaticEventDrag.getDraggableConfig}
            isPointerDragging={pragmaticEventDrag.isDragging}
            maxHour={maxHour}
            minHour={minHour}
          />
        ) : null}
        {resolvedView === "timeline" ? (
          <CalendarTimelineView {...derived.sharedViewProps} />
        ) : null}
        {resolvedView === "agenda" ? (
          <CalendarAgendaView
            {...derived.sharedViewProps}
            range={derived.range}
          />
        ) : null}
        {derived.occurrences.length === 0 ? (
          <div className="pointer-events-none absolute inset-x-4 bottom-4 z-20 flex justify-center">
            <div className="pointer-events-auto max-w-md rounded-[calc(var(--radius)*1.1)] border border-border/70 bg-background/95 px-4 py-3 text-center shadow-lg backdrop-blur-sm">
              {derived.emptyStateContent ?? (
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
      <CalendarRootPortals
        activeDrag={pointer.activeDrag}
        activeDragInteraction={pointer.activeDragInteraction}
        activeDragRect={pointer.activeDragRect}
        classNames={classNames}
        closeContextMenu={actions.closeContextMenu}
        closeCreateSheet={actions.closeCreateSheet}
        closeEventDetails={actions.closeEventDetails}
        closePendingEventChange={actions.closePendingEventChange}
        commitCreateEvent={actions.commitCreateEvent}
        commitEventUpdate={actions.commitEventUpdate}
        contextMenu={actions.contextMenu}
        createEventSheet={createEventSheet}
        createSheetOperation={actions.createSheetOperation}
        density={density}
        detailsOccurrence={detailsOccurrence}
        dragOverlayStore={pointer.dragOverlayStore}
        eventChangeConfirmation={eventChangeConfirmation}
        eventDetails={eventDetails}
        eventDetailsEnabled={actions.eventDetailsEnabled}
        getEventColor={getEventColor}
        handleArchiveEvent={actions.handleArchiveEvent}
        handleConfirmPendingEventChange={
          actions.handleConfirmPendingEventChange
        }
        handleDeleteEvent={actions.handleDeleteEvent}
        handleDuplicateEvent={actions.handleDuplicateEvent}
        hourCycle={hourCycle}
        isHydrated={isHydrated}
        isKeyboardShortcutsOpen={actions.isKeyboardShortcutsOpen}
        isPointerDragging={pointer.isPointerDragging}
        keyboardShortcuts={keyboardShortcuts}
        locale={locale}
        onEventArchive={onEventArchive}
        onEventDelete={onEventDelete}
        onEventDuplicate={onEventDuplicate}
        onEventUpdate={onEventUpdate}
        openEventDetails={actions.openEventDetails}
        pendingEventChange={actions.pendingEventChange}
        renderEvent={renderEvent}
        renderEventDetails={renderEventDetails}
        resources={resources}
        secondaryTimeZone={secondaryTimeZone}
        setIsKeyboardShortcutsOpen={actions.setIsKeyboardShortcutsOpen}
        shouldSuppressEventClick={pointer.shouldSuppressEventClick}
        showDragPreviewMeta={showDragPreviewMeta}
        showSecondaryTimeZone={showSecondaryTimeZone}
        timeZone={timeZone}
      />
      <p
        aria-live="polite"
        className="sr-only"
        data-testid="calendar-live-announcement"
      >
        {actions.liveAnnouncement}
      </p>
    </div>
  )
}
