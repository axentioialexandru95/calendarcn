import * as React from "react"
import { createPortal } from "react-dom"

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type ClientRect,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { addDays, addMinutes, startOfDay } from "date-fns"

import type {
  CalendarDragData,
  CalendarDropTarget,
  CalendarOccurrence,
} from "../types"
import {
  clampResize,
  copyTimeParts,
  expandOccurrences,
  getCalendarSlotClassName,
  getDaySpan,
  getEventMetaLabel,
  getRangeLabel,
  getVisibleRange,
  setMinuteOfDay,
  shiftDate,
} from "../utils"
import { CalendarAgendaView } from "./calendar-agenda-view"
import { EventSurface, getResolvedAccentColor } from "./calendar-event-card"
import { CalendarMonthView } from "./calendar-month-view"
import { CalendarToolbar } from "./calendar-toolbar"
import { CalendarDayView, CalendarWeekView } from "./calendar-time-grid-view"
import {
  defaultMaxHour,
  defaultMinHour,
  defaultSlotDuration,
  type CalendarRootProps,
  type SharedViewProps,
} from "./shared"

export function CalendarRoot({
  agendaDays = 14,
  classNames,
  date,
  events,
  getEventColor,
  maxHour = defaultMaxHour,
  minHour = defaultMinHour,
  onDateChange,
  onEventCreate,
  onEventMove,
  onEventResize,
  onEventSelect,
  onNavigate,
  onSelectedEventChange,
  onToday,
  onViewChange,
  renderEvent,
  resources,
  selectedEventId,
  slotDuration = defaultSlotDuration,
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
  const deferredEvents = React.useDeferredValue(events)
  const range = getVisibleRange(date, view, {
    agendaDays,
    weekStartsOn,
  })
  const occurrences = expandOccurrences(deferredEvents, range)
  const [isHydrated, setIsHydrated] = React.useState(false)
  const [activeDrag, setActiveDrag] = React.useState<CalendarDragData | null>(
    null
  )
  const [activeDragRect, setActiveDragRect] = React.useState<ClientRect | null>(
    null
  )
  const [liveAnnouncement, setLiveAnnouncement] = React.useState("")

  React.useEffect(() => {
    setIsHydrated(true)
  }, [])

  function announce(message: string) {
    setLiveAnnouncement(message)
  }

  function handleSelectEvent(occurrence: CalendarOccurrence) {
    onSelectedEventChange?.(occurrence.occurrenceId)
    onEventSelect?.(occurrence)
  }

  function handleNavigate(direction: -1 | 1) {
    if (onNavigate) {
      onNavigate(direction)
      return
    }

    onDateChange(shiftDate(date, view, direction))
  }

  function handleToday() {
    if (onToday) {
      onToday()
      return
    }

    onDateChange(new Date())
  }

  function handleQuickCreate() {
    if (!onEventCreate) {
      return
    }

    const start = setMinuteOfDay(
      startOfDay(date),
      Math.max(minHour * 60, 9 * 60)
    )

    onEventCreate({
      start,
      end: addMinutes(start, 60),
    })
    announce("Created a new one-hour event.")
  }

  function moveOccurrenceWithTarget(
    occurrence: CalendarOccurrence,
    target: CalendarDropTarget
  ) {
    if (!onEventMove) {
      return
    }

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

    onEventMove({
      occurrence,
      nextStart,
      nextEnd,
      previousStart: occurrence.start,
      previousEnd: occurrence.end,
      allDay,
    })
    announce(`Moved ${occurrence.title}.`)
  }

  function resizeOccurrenceWithTarget(
    occurrence: CalendarOccurrence,
    edge: "start" | "end",
    target: CalendarDropTarget
  ) {
    if (!onEventResize) {
      return
    }

    const rawDate =
      target.kind === "slot"
        ? setMinuteOfDay(startOfDay(target.day), target.minuteOfDay)
        : startOfDay(target.day)
    const minimumMinutes = slotDuration

    if (edge === "start") {
      const nextStart = clampResize(
        rawDate,
        occurrence.end,
        "start",
        minimumMinutes
      )

      onEventResize({
        occurrence,
        edge,
        nextStart,
        nextEnd: occurrence.end,
        previousStart: occurrence.start,
        previousEnd: occurrence.end,
      })
    } else {
      const adjustedEnd =
        target.kind === "slot"
          ? addMinutes(rawDate, slotDuration)
          : addDays(rawDate, 1)
      const nextEnd = clampResize(
        adjustedEnd,
        occurrence.start,
        "end",
        minimumMinutes
      )

      onEventResize({
        occurrence,
        edge,
        nextStart: occurrence.start,
        nextEnd,
        previousStart: occurrence.start,
        previousEnd: occurrence.end,
      })
    }

    announce(`Resized ${occurrence.title}.`)
  }

  function handleDragStart(event: DragStartEvent) {
    const dragData = event.active.data.current as CalendarDragData | undefined

    if (!dragData) {
      return
    }

    setActiveDrag(dragData)
    setActiveDragRect(
      event.active.rect.current.initial ??
        getDragSurfaceRect(event.activatorEvent.target)
    )
  }

  function handleDragEnd(event: DragEndEvent) {
    const dragData = event.active.data.current as CalendarDragData | undefined
    const target = event.over?.data.current as CalendarDropTarget | undefined

    setActiveDrag(null)
    setActiveDragRect(null)

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
    setActiveDragRect(null)
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
      const nextEnd = addMinutes(addDays(occurrence.end, dayDelta), minuteDelta)

      onEventResize({
        occurrence,
        edge: "end",
        nextStart: occurrence.start,
        nextEnd: clampResize(nextEnd, occurrence.start, "end", slotDuration),
        previousStart: occurrence.start,
        previousEnd: occurrence.end,
      })
      announce(`Extended ${occurrence.title}.`)
      return
    }

    if (event.altKey && onEventResize) {
      const nextStart = addMinutes(
        addDays(occurrence.start, dayDelta),
        minuteDelta
      )

      onEventResize({
        occurrence,
        edge: "start",
        nextStart: clampResize(
          nextStart,
          occurrence.end,
          "start",
          slotDuration
        ),
        nextEnd: occurrence.end,
        previousStart: occurrence.start,
        previousEnd: occurrence.end,
      })
      announce(`Adjusted the start of ${occurrence.title}.`)
      return
    }

    if (!onEventMove) {
      return
    }

    const nextStart = addMinutes(
      addDays(occurrence.start, dayDelta),
      minuteDelta
    )
    const nextEnd = addMinutes(addDays(occurrence.end, dayDelta), minuteDelta)

    onEventMove({
      occurrence,
      nextStart,
      nextEnd,
      previousStart: occurrence.start,
      previousEnd: occurrence.end,
      allDay: occurrence.allDay,
    })
    announce(`Moved ${occurrence.title}.`)
  }

  const currentLabel = getRangeLabel(date, view, {
    agendaDays,
    weekStartsOn,
  })
  const sharedViewProps: SharedViewProps = {
    anchorDate: date,
    classNames,
    getEventColor,
    interactive: isHydrated,
    occurrences,
    onEventCreate,
    onEventKeyCommand: handleEventKeyCommand,
    onSelectEvent: handleSelectEvent,
    renderEvent,
    selectedEventId,
    slotDuration,
    timeZone,
    weekStartsOn,
  }
  const dragOverlay = (
    <DragOverlay>
      {activeDrag ? (
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
          timeLabel={getEventMetaLabel(activeDrag.occurrence, timeZone)}
          variant={activeDrag.variant}
        />
      ) : null}
    </DragOverlay>
  )

  return (
    <div
      className={getCalendarSlotClassName(
        classNames,
        "root",
        "flex min-h-[42rem] flex-col overflow-hidden rounded-[calc(var(--radius)*1.6)] border border-border/70 bg-background/90 shadow-[0_20px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur"
      )}
    >
      <CalendarToolbar
        classNames={classNames}
        currentLabel={currentLabel}
        onNavigate={handleNavigate}
        onQuickCreate={onEventCreate ? handleQuickCreate : undefined}
        onToday={handleToday}
        onViewChange={onViewChange}
        resources={resources}
        timeZone={timeZone}
        view={view}
      />
      <DndContext
        collisionDetection={closestCorners}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
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
          {view === "month" ? <CalendarMonthView {...sharedViewProps} /> : null}
          {view === "week" ? (
            <CalendarWeekView
              {...sharedViewProps}
              maxHour={maxHour}
              minHour={minHour}
            />
          ) : null}
          {view === "day" ? (
            <CalendarDayView
              {...sharedViewProps}
              maxHour={maxHour}
              minHour={minHour}
            />
          ) : null}
          {view === "agenda" ? (
            <CalendarAgendaView
              {...sharedViewProps}
              range={getVisibleRange(date, "agenda", {
                agendaDays,
              })}
            />
          ) : null}
        </div>
        {isHydrated ? createPortal(dragOverlay, document.body) : null}
      </DndContext>
      <p aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </p>
    </div>
  )
}
