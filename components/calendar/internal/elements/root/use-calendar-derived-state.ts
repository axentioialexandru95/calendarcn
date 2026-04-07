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
import type { CalendarRootProps, SharedViewProps } from "../../shared"

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
  availableViews?: CalendarRootProps["availableViews"]
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
  onDateChange?: CalendarRootProps["onDateChange"]
  onViewChange?: CalendarRootProps["onViewChange"]
  renderEmptyState: CalendarRootProps["renderEmptyState"]
  renderEvent: CalendarRootProps["renderEvent"]
  resolvedHiddenDays: CalendarWeekday[]
  resolvedResourceFilter: string[]
  resolvedSlotHeight: number
  resolvedView: CalendarRootProps["view"]
  rangeOverride?: {
    start: Date
    end: Date
  }
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
  currentLabelOverride?: string
}

export function useCalendarDerivedState({
  activeDrag,
  activeDragOffsetMinutes,
  activeDropTarget,
  activeResize,
  activeResizeTarget,
  agendaDays,
  availableViews,
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
  onDateChange,
  onViewChange,
  renderEmptyState,
  renderEvent,
  resolvedHiddenDays,
  resolvedResourceFilter,
  resolvedSlotHeight,
  resolvedView,
  rangeOverride,
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
  currentLabelOverride,
}: UseCalendarDerivedStateOptions) {
  const range = React.useMemo(
    () =>
      rangeOverride ??
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
      rangeOverride,
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
      currentLabelOverride ??
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
      currentLabelOverride,
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
      activeResourceIds: resolvedResourceFilter,
      availableViews,
      anchorDate: date,
      blockedRanges,
      businessHours,
      classNames,
      density,
      dragPreviewOccurrence:
        activeDrag?.kind === "event"
          ? (previewOccurrence ?? undefined)
          : undefined,
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
      onDateChange,
      onEventCreate: handleEventCreateRequest,
      onEventDragPointerDown: handleEventDragPointerDown,
      onEventKeyCommand: handleEventKeyCommand,
      onOpenContextMenu: handleOpenContextMenu,
      onResizeHandlePointerDown: handleResizeHandlePointerDown,
      onSelectEvent: handleSelectEvent,
      onViewChange,
      previewOccurrenceId: activeResize
        ? previewOccurrence?.occurrenceId
        : undefined,
      renderEvent,
      resources,
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
    availableViews,
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
    onDateChange,
    onViewChange,
    previewOccurrence,
    renderEvent,
    resolvedHiddenDays,
    resolvedResourceFilter,
    resolvedSlotHeight,
    resources,
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
