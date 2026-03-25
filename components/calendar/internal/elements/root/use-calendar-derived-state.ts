import * as React from "react"

import type {
  CalendarDragData,
  CalendarDropTarget,
  CalendarEvent,
  CalendarWeekday,
} from "../../../types"
import {
  expandOccurrences,
  filterOccurrencesByResource,
  getRangeLabel,
  getVisibleRange,
} from "../../../utils"
import type {
  CalendarRootProps,
  SharedViewProps,
} from "../../shared"

import {
  getPreviewOccurrence,
  getResizeOperation,
  type ActiveResizeState,
} from "./root-utils"

type UseCalendarDerivedStateOptions = {
  activeDrag: CalendarDragData | null
  activeDragOffsetMinutes: number
  activeDropTarget: CalendarDropTarget | null
  activeResize: ActiveResizeState | null
  activeResizeTarget: CalendarDropTarget | null
  agendaDays: number
  blockedRanges: CalendarRootProps["blockedRanges"]
  businessHours: CalendarRootProps["businessHours"]
  classNames: CalendarRootProps["classNames"]
  clearResourceFilter: () => void
  date: Date
  density: NonNullable<CalendarRootProps["density"]>
  getEventColor?: CalendarRootProps["getEventColor"]
  handleEventCreateRequest?: SharedViewProps["onEventCreate"]
  handleEventDragPointerDown: SharedViewProps["onEventDragPointerDown"]
  handleEventKeyCommand: SharedViewProps["onEventKeyCommand"]
  handleOpenContextMenu: SharedViewProps["onOpenContextMenu"]
  handleResizeHandlePointerDown?: SharedViewProps["onResizeHandlePointerDown"]
  handleSelectEvent: SharedViewProps["onSelectEvent"]
  hourCycle?: 12 | 24
  isHydrated: boolean
  isPointerDragging: boolean
  locale?: string
  optimisticEvents: CalendarEvent[]
  renderEmptyState: CalendarRootProps["renderEmptyState"]
  renderEvent: CalendarRootProps["renderEvent"]
  resolvedHiddenDays: CalendarWeekday[]
  resolvedResourceFilter: string[]
  resolvedSlotHeight: number
  resolvedView: CalendarRootProps["view"]
  resources?: CalendarRootProps["resources"]
  scrollToTime?: CalendarRootProps["scrollToTime"]
  secondaryTimeZone?: CalendarRootProps["secondaryTimeZone"]
  selectedEventId?: CalendarRootProps["selectedEventId"]
  shouldBlockTimedRange: (
    start: Date,
    end: Date,
    allDay: boolean | undefined
  ) => boolean
  shouldSuppressEventClick?: SharedViewProps["shouldSuppressEventClick"]
  showCreatePreviewMeta: boolean
  showDragPreviewMeta: boolean
  showSecondaryTimeZone: boolean
  slotDuration: number
  timeZone?: string
  weekStartsOn: CalendarWeekday
}

export function useCalendarDerivedState({
  activeDrag,
  activeDragOffsetMinutes,
  activeDropTarget,
  activeResize,
  activeResizeTarget,
  agendaDays,
  blockedRanges,
  businessHours,
  classNames,
  clearResourceFilter,
  date,
  density,
  getEventColor,
  handleEventCreateRequest,
  handleEventDragPointerDown,
  handleEventKeyCommand,
  handleOpenContextMenu,
  handleResizeHandlePointerDown,
  handleSelectEvent,
  hourCycle,
  isHydrated,
  isPointerDragging,
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
  shouldSuppressEventClick,
  showCreatePreviewMeta,
  showDragPreviewMeta,
  showSecondaryTimeZone,
  slotDuration,
  timeZone,
  weekStartsOn,
}: UseCalendarDerivedStateOptions) {
  const range = React.useMemo(
    () =>
      getVisibleRange(date, resolvedView, {
        agendaDays,
        hiddenDays: resolvedHiddenDays,
        hourCycle,
        locale,
        timeZone,
        weekStartsOn,
      }),
    [
      agendaDays,
      date,
      hourCycle,
      locale,
      resolvedHiddenDays,
      resolvedView,
      timeZone,
      weekStartsOn,
    ]
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

  const currentLabel = React.useMemo(
    () =>
      getRangeLabel(date, resolvedView, {
        agendaDays,
        hiddenDays: resolvedHiddenDays,
        hourCycle,
        locale,
        timeZone,
        weekStartsOn,
      }),
    [
      agendaDays,
      date,
      hourCycle,
      locale,
      resolvedHiddenDays,
      resolvedView,
      timeZone,
      weekStartsOn,
    ]
  )

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
      onEventCreate: handleEventCreateRequest,
      onEventDragPointerDown: handleEventDragPointerDown,
      onEventKeyCommand: handleEventKeyCommand,
      onOpenContextMenu: handleOpenContextMenu,
      onResizeHandlePointerDown: handleResizeHandlePointerDown,
      onSelectEvent: handleSelectEvent,
      previewOccurrenceId: activeResize ? previewOccurrence?.occurrenceId : undefined,
      renderEvent,
      scrollToTime,
      secondaryTimeZone,
      selectedEventId,
      shouldSuppressEventClick,
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
    handleEventDragPointerDown,
    handleEventKeyCommand,
    handleOpenContextMenu,
    handleResizeHandlePointerDown,
    handleSelectEvent,
    hourCycle,
    isHydrated,
    isPointerDragging,
    locale,
    occurrences,
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
    clearResourceFilter,
    resources: resources ?? [],
    view: resolvedView,
  })

  return {
    currentLabel,
    emptyStateContent,
    occurrences,
    previewOccurrence,
    range,
    sharedViewProps,
  }
}
