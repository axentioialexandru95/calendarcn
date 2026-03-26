import * as React from "react"

import { cn } from "../lib/utils"

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
  anchorDate,
  classNames,
  columnHeaderId,
  day,
  density,
  draggingOccurrenceId,
  getEventColor,
  interactive,
  locale,
  occurrences,
  onEventDragPointerDown,
  onEventKeyCommand,
  onOpenContextMenu,
  onSelectEvent,
  previewOccurrenceId,
  renderEvent,
  selectedEventId,
  shouldSuppressEventClick,
  timeZone,
}: MonthDayCellProps) {
  const events = getDayEvents(occurrences, day)
  const visibleEvents = events.slice(0, maxMonthEvents)
  const remainingEvents = events.length - visibleEvents.length
  const isDragTarget =
    activeDropTarget?.kind === "day" &&
    activeDropTarget.day.getTime() === day.getTime()

  return (
    <section
      aria-describedby={columnHeaderId}
      aria-label={`${formatWeekday(day, {
        locale,
        timeZone,
      })} ${formatMonthDayLabel(day, {
        locale,
        timeZone,
      })}. ${events.length} ${events.length === 1 ? "event" : "events"}.`}
      className={getCalendarSlotClassName(
        classNames,
        isOutsideMonth(day, anchorDate) ? "monthCellMuted" : "monthCell",
        cn(
          "flex flex-col border-r border-b border-border/70 px-2 py-2 transition-colors",
          density === "compact"
            ? "min-h-[9rem] gap-1.5"
            : "min-h-[10.5rem] gap-2",
          isDragTarget ? "bg-muted/50" : "",
          isOutsideMonth(day, anchorDate) ? "bg-muted/25" : "bg-background"
        )
      )}
      data-calendar-drop-target-day={day.toISOString()}
      data-calendar-drop-target-kind="day"
      role="gridcell"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
          {formatWeekday(day, {
            locale,
            timeZone,
          })}
        </span>
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
      </div>
      <div className="space-y-1">
        {visibleEvents.map((occurrence, index) => (
          <CalendarEventCard
            key={occurrence.occurrenceId}
            accentColor={getResolvedAccentColor(
              occurrence,
              getEventColor,
              index
            )}
            classNames={classNames}
            density={density}
            dragging={draggingOccurrenceId === occurrence.occurrenceId}
            event={occurrence}
            interactive={interactive}
            onDragPointerDown={onEventDragPointerDown}
            onEventKeyCommand={onEventKeyCommand}
            onOpenContextMenu={onOpenContextMenu}
            onSelect={onSelectEvent}
            preview={previewOccurrenceId === occurrence.occurrenceId}
            renderEvent={renderEvent}
            selected={selectedEventId === occurrence.occurrenceId}
            shouldSuppressClick={shouldSuppressEventClick}
            timeLabel={getEventMetaLabel(occurrence, {
              locale,
              timeZone,
            })}
            variant="month"
          />
        ))}
        {remainingEvents > 0 ? (
          <p className="px-1 text-xs text-muted-foreground">
            +{remainingEvents} more
          </p>
        ) : null}
      </div>
    </section>
  )
}

function getMonthHeaderId(index: number) {
  return `calendar-month-header-${index}`
}
