import * as React from "react"

import type { CalendarEvent } from "../../types"
import {
  getCalendarSlotClassName,
  intervalOverlapsBlockedRanges,
  normalizeAvailableViews,
  normalizeHiddenDays,
  resolveCalendarView,
} from "../../utils"
import { CalendarAgendaView } from "./agenda-view"
import { CalendarMonthView } from "./month-view"
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
    keyboardShortcutsTrigger === "both" ||
    keyboardShortcutsTrigger === "button"

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

  const setActiveResourceIds = React.useCallback(
    (nextResourceIds: string[]) => {
      const dedupedResourceIds = Array.from(new Set(nextResourceIds)).filter((id) =>
        allResourceIds.includes(id)
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
    showCreatePreviewMeta,
    showDragPreviewMeta,
    showSecondaryTimeZone,
    slotDuration,
    timeZone,
    weekStartsOn,
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
        (occurrence) => occurrence.occurrenceId === detailsOccurrence.occurrenceId
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
          resources?.length && resources.length > 1 ? setActiveResourceIds : undefined
        }
        onToday={actions.handleToday}
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
        handleConfirmPendingEventChange={actions.handleConfirmPendingEventChange}
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
