import * as React from "react"

import { cn } from "../lib/utils"

import type { CalendarOccurrence } from "../../types"
import {
  formatDayNumber,
  formatMonthDayLabel,
  formatWeekday,
  getCalendarSlotClassName,
  getDayEvents,
  getEventMetaLabel,
  getMonthDays,
  isOutsideMonth,
  isToday,
} from "../../utils"
import {
  getCalendarDropTargetDataAttributes,
  useCalendarDropTargetRegistration,
} from "./root/drop-target-registry"
import { CalendarEventCard, getResolvedAccentColor } from "./event-card"
import { maxMonthEvents, type SharedViewProps } from "../shared"

export const CalendarMonthView = React.memo(function CalendarMonthView(
  props: SharedViewProps
) {
  const days = getMonthDays(
    props.anchorDate,
    props.weekStartsOn,
    props.hiddenDays
  )
  const columnCount = Math.max(1, 7 - props.hiddenDays.length)

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="min-w-[48rem]">
        <div
          className="grid border-b border-border/70"
          role="row"
          style={{
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          }}
        >
          {days.slice(0, columnCount).map((day, index) => (
            <div
              key={`month-heading-${day.toISOString()}`}
              id={getMonthHeaderId(index)}
              className="px-3 py-2 text-xs tracking-[0.24em] text-muted-foreground uppercase"
              role="columnheader"
            >
              {formatWeekday(day, {
                locale: props.locale,
                timeZone: props.timeZone,
              })}
            </div>
          ))}
        </div>
        <div
          className={getCalendarSlotClassName(
            props.classNames,
            "monthGrid",
            "grid"
          )}
          aria-label="Month view calendar"
          role="grid"
          style={{
            gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
          }}
        >
          {days.map((day, index) => (
            <MonthDayCell
              columnHeaderId={getMonthHeaderId(index % columnCount)}
              key={day.toISOString()}
              day={day}
              {...props}
            />
          ))}
        </div>
      </div>
    </div>
  )
})

type MonthDayCellProps = SharedViewProps & {
  columnHeaderId: string
  day: Date
}

function MonthDayCell({
  activeDropTarget,
  availableViews,
  anchorDate,
  classNames,
  columnHeaderId,
  day,
  density,
  dragPreviewOccurrence,
  draggingOccurrenceId,
  getEventColor,
  interactive,
  locale,
  occurrences,
  onDateChange,
  onEventDragPointerDown,
  onEventKeyCommand,
  onOpenContextMenu,
  onSelectEvent,
  onViewChange,
  previewOccurrenceId,
  renderEvent,
  selectedEventId,
  shouldSuppressEventClick,
  timeZone,
}: MonthDayCellProps) {
  const dropTarget = React.useMemo(
    () => ({
      day,
      kind: "day" as const,
    }),
    [day]
  )
  const dropTargetRef = useCalendarDropTargetRegistration<HTMLElement>(
    dropTarget
  )
  const events = getDayEvents(occurrences, day)
  const dragPreviewEvent = getPreviewEventForDay(dragPreviewOccurrence, day)
  const mergedEvents = mergePreviewEvent(events, dragPreviewEvent)
  let visibleEvents = mergedEvents.slice(0, maxMonthEvents)

  if (
    dragPreviewEvent &&
    !visibleEvents.some(
      (event) => event.occurrenceId === dragPreviewEvent.occurrenceId
    )
  ) {
    visibleEvents = [
      ...visibleEvents.slice(0, Math.max(0, maxMonthEvents - 1)),
      dragPreviewEvent,
    ]
  }

  const remainingEvents = Math.max(
    0,
    mergedEvents.length - visibleEvents.length
  )
  const isDragTarget =
    !!dragPreviewEvent ||
    (activeDropTarget?.kind === "day" &&
      activeDropTarget.day.getTime() === day.getTime())
  const canDrillIntoDayView = Boolean(
    availableViews?.includes("day") && onDateChange && onViewChange
  )
  const dayAriaLabel = getMonthDayAriaLabel(day, locale, timeZone)

  const handleDrillIntoDayView = React.useCallback(() => {
    if (!canDrillIntoDayView || !onDateChange || !onViewChange) {
      return
    }

    onDateChange(new Date(day))
    onViewChange("day")
  }, [canDrillIntoDayView, day, onDateChange, onViewChange])

  return (
    <section
      aria-describedby={columnHeaderId}
      aria-label={`${formatWeekday(day, {
        locale,
        timeZone,
      })} ${formatMonthDayLabel(day, {
        locale,
        timeZone,
      })}. ${mergedEvents.length} ${mergedEvents.length === 1 ? "event" : "events"}.`}
      className={getCalendarSlotClassName(
        classNames,
        isOutsideMonth(day, anchorDate) ? "monthCellMuted" : "monthCell",
        cn(
          "flex flex-col border-r border-b border-border/70 px-2 py-2 transition-colors",
          density === "compact"
            ? "min-h-[9rem] gap-1.5"
            : "min-h-[10.5rem] gap-2",
          isDragTarget
            ? "bg-muted/50"
            : isOutsideMonth(day, anchorDate)
              ? "bg-muted/25"
              : "bg-background"
        )
      )}
      {...getCalendarDropTargetDataAttributes(dropTarget)}
      ref={dropTargetRef}
      role="gridcell"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
          {formatWeekday(day, {
            locale,
            timeZone,
          })}
        </span>
        {canDrillIntoDayView ? (
          <button
            aria-current={isToday(day) ? "date" : undefined}
            aria-label={`Open ${dayAriaLabel} in day view`}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-full text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
              isToday(day)
                ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                : "text-foreground"
            )}
            onClick={handleDrillIntoDayView}
            type="button"
          >
            {formatDayNumber(day, {
              locale,
              timeZone,
            })}
          </button>
        ) : (
          <span
            aria-current={isToday(day) ? "date" : undefined}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-full text-sm font-medium",
              isToday(day)
                ? "bg-primary text-primary-foreground"
                : "text-foreground"
            )}
          >
            {formatDayNumber(day, {
              locale,
              timeZone,
            })}
          </span>
        )}
      </div>
      <div className="space-y-1">
        {visibleEvents.map((occurrence, index) => {
          const isDragPreview =
            dragPreviewEvent?.occurrenceId === occurrence.occurrenceId

          return (
            <CalendarEventCard
              key={occurrence.occurrenceId}
              accentColor={getResolvedAccentColor(
                occurrence,
                getEventColor,
                index
              )}
              classNames={classNames}
              density={density}
              dragging={
                isDragPreview
                  ? false
                  : draggingOccurrenceId === occurrence.occurrenceId
              }
              event={occurrence}
              interactive={interactive}
              onDragPointerDown={onEventDragPointerDown}
              onEventKeyCommand={onEventKeyCommand}
              onOpenContextMenu={onOpenContextMenu}
              onSelect={onSelectEvent}
              preview={
                isDragPreview || previewOccurrenceId === occurrence.occurrenceId
              }
              previewMetaLabel={
                isDragPreview
                  ? getEventMetaLabel(occurrence, {
                      locale,
                      timeZone,
                    })
                  : undefined
              }
              renderEvent={renderEvent}
              selected={selectedEventId === occurrence.occurrenceId}
              shouldSuppressClick={shouldSuppressEventClick}
              timeLabel={getEventMetaLabel(occurrence, {
                locale,
                timeZone,
              })}
              variant="month"
            />
          )
        })}
        {remainingEvents > 0 ? (
          canDrillIntoDayView ? (
            <button
              aria-label={`Show all ${mergedEvents.length} events on ${dayAriaLabel} in day view`}
              className="px-1 text-left text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
              onClick={handleDrillIntoDayView}
              type="button"
            >
              +{remainingEvents} more
            </button>
          ) : (
            <p className="px-1 text-xs text-muted-foreground">
              +{remainingEvents} more
            </p>
          )
        ) : null}
      </div>
    </section>
  )
}

function getMonthHeaderId(index: number) {
  return `calendar-month-header-${index}`
}

function getPreviewEventForDay(
  previewOccurrence: CalendarOccurrence | undefined,
  day: Date
) {
  return previewOccurrence
    ? getDayEvents([previewOccurrence], day)[0]
    : undefined
}

function mergePreviewEvent(
  events: CalendarOccurrence[],
  previewEvent: CalendarOccurrence | undefined
) {
  if (!previewEvent) {
    return events
  }

  const mergedEvents = events.filter(
    (event) => event.occurrenceId !== previewEvent.occurrenceId
  )

  mergedEvents.push(previewEvent)
  mergedEvents.sort((left, right) => {
    const startDifference = left.start.getTime() - right.start.getTime()

    if (startDifference !== 0) {
      return startDifference
    }

    return left.title.localeCompare(right.title)
  })

  return mergedEvents
}

function getMonthDayAriaLabel(day: Date, locale?: string, timeZone?: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    weekday: "long",
    year: "numeric",
    ...(timeZone ? { timeZone } : {}),
  }).format(day)
}
