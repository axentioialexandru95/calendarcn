"use client"

import * as React from "react"
import { createPortal } from "react-dom"

import type {
  CalendarBlockedRange,
  CalendarBusinessHoursWindow,
  CalendarClassNames,
  CalendarCreateOperation,
  CalendarDensity,
  CalendarEvent,
  CalendarEventMenuPosition,
  CalendarEventRenderer,
  CalendarEmptyStateRenderProps,
  CalendarMoveOperation,
  CalendarOccurrence,
  CalendarResource,
  CalendarResizeOperation,
  CalendarView,
  CalendarWeekday,
} from "./types"
import { calendarViews } from "./types"
import {
  formatDurationLabel,
  getEventMetaLabel,
  getCalendarSlotClassName,
  intervalOverlapsBlockedRanges,
  normalizeHiddenDays,
  resolveCalendarView,
} from "./utils"
import { CalendarAgendaView } from "./views/agenda"
import { CalendarDayView } from "./views/day"
import { CalendarMonthView } from "./views/month"
import { CalendarWeekView } from "./views/week"
import {
  EventSurface,
  getResolvedAccentColor,
} from "./internal/elements/event-card"
import {
  compactSlotHeight,
  defaultMaxHour,
  defaultMinHour,
  defaultSlotDuration,
  slotHeight as defaultSlotHeight,
} from "./internal/shared"
import { getDragOverlayStyle } from "./internal/elements/root/root-utils"
import { useCalendarCoreActions } from "./internal/elements/root/use-calendar-core-actions"
import { useCalendarDerivedState } from "./internal/elements/root/use-calendar-derived-state"
import { useCalendarPointerInteractions } from "./internal/elements/root/use-calendar-pointer-interactions"

export type CalendarRootProps = {
  agendaDays?: number
  blockedRanges?: CalendarBlockedRange[]
  businessHours?: CalendarBusinessHoursWindow[]
  classNames?: CalendarClassNames
  date: Date
  density?: CalendarDensity
  events: CalendarEvent[]
  getEventColor?: (occurrence: CalendarOccurrence) => string
  hiddenDays?: CalendarWeekday[]
  hourCycle?: 12 | 24
  locale?: string
  maxHour?: number
  minHour?: number
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
  onResourceFilterChange?: (resourceIds: string[]) => void
  onSelectedEventChange?: (id?: string) => void
  renderEmptyState?: (props: CalendarEmptyStateRenderProps) => React.ReactNode
  renderEvent?: CalendarEventRenderer
  resourceFilter?: string[]
  resources?: CalendarResource[]
  scrollToTime?: "now" | string
  secondaryTimeZone?: string
  selectedEventId?: string
  showSecondaryTimeZone?: boolean
  slotDuration?: number
  slotHeight?: number
  timeZone?: string
  view: CalendarView
  weekStartsOn?: CalendarWeekday
}

export function CalendarRoot({
  agendaDays = 14,
  blockedRanges,
  businessHours,
  classNames,
  date,
  density = "comfortable",
  events,
  getEventColor,
  hiddenDays,
  hourCycle,
  locale,
  maxHour = defaultMaxHour,
  minHour = defaultMinHour,
  onEventContextMenu,
  onEventCreate,
  onEventCreateRequest,
  onEventMove,
  onEventMoveRequest,
  onEventResize,
  onEventResizeRequest,
  onEventSelect,
  onResourceFilterChange,
  onSelectedEventChange,
  renderEmptyState,
  renderEvent,
  resourceFilter,
  resources,
  scrollToTime,
  secondaryTimeZone,
  selectedEventId,
  showSecondaryTimeZone = false,
  slotDuration = defaultSlotDuration,
  slotHeight: customSlotHeight,
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
  const resolvedHiddenDays = React.useMemo(
    () => normalizeHiddenDays(hiddenDays),
    [hiddenDays]
  )
  const resolvedView = React.useMemo(
    () => resolveCalendarView(view, [...calendarViews]),
    [view]
  )
  const resolvedSlotHeight =
    customSlotHeight ??
    (density === "compact" ? compactSlotHeight : defaultSlotHeight)
  const resolvedResourceFilter = React.useMemo(() => {
    const nextFilter = Array.from(new Set(resourceFilter ?? []))

    if (allResourceIds.length === 0) {
      return nextFilter
    }

    if (nextFilter.length === 0) {
      return allResourceIds
    }

    const validResourceIds = nextFilter.filter((id) =>
      allResourceIds.includes(id)
    )

    return validResourceIds.length > 0 ? validResourceIds : allResourceIds
  }, [allResourceIds, resourceFilter])

  React.useEffect(() => {
    setIsHydrated(true)
  }, [])

  React.useLayoutEffect(() => {
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

  const actions = useCalendarCoreActions({
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
  })

  const pointer = useCalendarPointerInteractions({
    announce: actions.announce,
    closeContextMenu: () => {},
    closeEventDetails: () => {},
    enableEventMove: Boolean(onEventMove || onEventMoveRequest),
    enableEventResize: Boolean(onEventResize || onEventResizeRequest),
    moveOccurrenceWithTarget: actions.moveOccurrenceWithTarget,
    resizeOccurrenceWithTarget: actions.resizeOccurrenceWithTarget,
    selectOccurrence: actions.handleSelectEvent,
  })

  const derived = useCalendarDerivedState({
    activeDrag: pointer.activeDrag,
    activeDragOffsetMinutes: pointer.activeDragOffsetMinutes,
    activeDropTarget: pointer.activeDropTarget,
    activeResize: pointer.activeResize,
    activeResizeTarget: pointer.activeResizeTarget,
    agendaDays,
    blockedRanges,
    businessHours,
    classNames,
    clearResourceFilter: () =>
      onResourceFilterChange?.(allResourceIds.length > 0 ? allResourceIds : []),
    date,
    density,
    getEventColor,
    handleEventCreateRequest:
      onEventCreate || onEventCreateRequest
        ? actions.requestEventCreate
        : undefined,
    handleEventDragPointerDown: pointer.handleEventDragPointerDown,
    handleEventKeyCommand: actions.handleEventKeyCommand,
    handleOpenContextMenu: actions.handleOpenContextMenu,
    handleResizeHandlePointerDown: pointer.handleResizeHandlePointerDown,
    handleSelectEvent: actions.handleSelectEvent,
    hourCycle,
    isHydrated,
    isPointerDragging: pointer.isPointerDragging,
    locale,
    optimisticEvents,
    renderEmptyState,
    renderEvent,
    resolvedHiddenDays,
    resolvedResourceFilter,
    resolvedSlotHeight,
    resolvedView,
    resources,
    scrollToTime,
    secondaryTimeZone,
    selectedEventId,
    shouldBlockTimedRange,
    shouldSuppressEventClick: pointer.shouldSuppressEventClick,
    showCreatePreviewMeta: true,
    showDragPreviewMeta: true,
    showSecondaryTimeZone,
    slotDuration,
    timeZone,
    weekStartsOn,
  })

  React.useEffect(() => {
    if (
      selectedEventId &&
      !derived.occurrences.some(
        (occurrence) => occurrence.occurrenceId === selectedEventId
      )
    ) {
      onSelectedEventChange?.(undefined)
    }
  }, [derived.occurrences, onSelectedEventChange, selectedEventId])

  return (
    <div
      className={getCalendarSlotClassName(
        classNames,
        "root",
        "flex min-h-[42rem] flex-col overflow-hidden rounded-[calc(var(--radius)*1.6)] border border-border/70 bg-background"
      )}
      data-testid="calendar-root"
    >
      <div
        className={getCalendarSlotClassName(
          classNames,
          "shell",
          "relative flex min-h-0 flex-1 flex-col bg-background"
        )}
      >
        {resolvedView === "month" ? (
          <CalendarMonthView {...derived.sharedViewProps} />
        ) : null}
        {resolvedView === "week" ? (
          <CalendarWeekView
            {...derived.sharedViewProps}
            maxHour={maxHour}
            minHour={minHour}
          />
        ) : null}
        {resolvedView === "day" ? (
          <CalendarDayView
            {...derived.sharedViewProps}
            maxHour={maxHour}
            minHour={minHour}
          />
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
      <CalendarDragOverlay
        activeDrag={pointer.activeDrag}
        activeDragInteraction={pointer.activeDragInteraction}
        activeDragRect={pointer.activeDragRect}
        classNames={classNames}
        density={density}
        getEventColor={getEventColor}
        hourCycle={hourCycle}
        isHydrated={isHydrated}
        isPointerDragging={pointer.isPointerDragging}
        locale={locale}
        renderEvent={renderEvent}
        shouldSuppressEventClick={pointer.shouldSuppressEventClick}
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

type CalendarDragOverlayProps = {
  activeDrag: ReturnType<typeof useCalendarPointerInteractions>["activeDrag"]
  activeDragInteraction: ReturnType<
    typeof useCalendarPointerInteractions
  >["activeDragInteraction"]
  activeDragRect: ReturnType<
    typeof useCalendarPointerInteractions
  >["activeDragRect"]
  classNames?: CalendarClassNames
  density: CalendarDensity
  getEventColor?: (occurrence: CalendarOccurrence) => string
  hourCycle?: 12 | 24
  isHydrated: boolean
  isPointerDragging: boolean
  locale?: string
  renderEvent?: CalendarEventRenderer
  shouldSuppressEventClick?: (occurrenceId: string) => boolean
  timeZone?: string
}

function CalendarDragOverlay({
  activeDrag,
  activeDragInteraction,
  activeDragRect,
  classNames,
  density,
  getEventColor,
  hourCycle,
  isHydrated,
  isPointerDragging,
  locale,
  renderEvent,
  shouldSuppressEventClick,
  timeZone,
}: CalendarDragOverlayProps) {
  if (
    !isHydrated ||
    !isPointerDragging ||
    activeDrag?.kind !== "event" ||
    !activeDragRect
  ) {
    return null
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-50">
      <EventSurface
        accentColor={getResolvedAccentColor(
          activeDrag.occurrence,
          getEventColor
        )}
        className={getCalendarSlotClassName(classNames, "dragOverlay")}
        density={density}
        dragging
        event={activeDrag.occurrence}
        overlay
        renderEvent={renderEvent}
        shouldSuppressClick={shouldSuppressEventClick}
        style={getDragOverlayStyle(
          activeDragRect,
          activeDragInteraction,
          activeDragInteraction
            ? {
                clientX: activeDragInteraction.currentClientX,
                clientY: activeDragInteraction.currentClientY,
              }
            : null
        )}
        previewMetaLabel={formatDurationLabel(
          activeDrag.occurrence.start,
          activeDrag.occurrence.end,
          activeDrag.occurrence.allDay
        )}
        timeLabel={getEventMetaLabel(activeDrag.occurrence, {
          hourCycle,
          locale,
          timeZone,
        })}
        variant={activeDrag.variant}
      />
    </div>,
    document.body
  )
}
