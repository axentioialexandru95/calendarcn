import { useDroppable } from "@dnd-kit/core"
import { format } from "date-fns"

import { cn } from "@/lib/utils"

import type { CalendarDropTarget } from "../types"
import {
  formatDayNumber,
  formatWeekday,
  getCalendarSlotClassName,
  getDayEvents,
  getEventMetaLabel,
  getMonthDays,
  isOutsideMonth,
  isToday,
} from "../utils"
import {
  CalendarEventCard,
  getResolvedAccentColor,
} from "./calendar-event-card"
import { maxMonthEvents, type SharedViewProps } from "./shared"

export function CalendarMonthView(props: SharedViewProps) {
  const days = getMonthDays(props.anchorDate, props.weekStartsOn)

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="min-w-[48rem]">
        <div className="grid grid-cols-7 border-b border-border/70">
          {days.slice(0, 7).map((day) => (
            <div
              key={`month-heading-${day.toISOString()}`}
              className="px-3 py-2 text-xs tracking-[0.24em] text-muted-foreground uppercase"
            >
              {format(day, "EEE")}
            </div>
          ))}
        </div>
        <div
          className={getCalendarSlotClassName(
            props.classNames,
            "monthGrid",
            "grid grid-cols-7"
          )}
        >
          {days.map((day) => (
            <MonthDayCell key={day.toISOString()} day={day} {...props} />
          ))}
        </div>
      </div>
    </div>
  )
}

type MonthDayCellProps = SharedViewProps & {
  day: Date
}

function MonthDayCell({
  anchorDate,
  classNames,
  day,
  getEventColor,
  interactive,
  occurrences,
  onEventKeyCommand,
  onSelectEvent,
  renderEvent,
  selectedEventId,
  timeZone,
}: MonthDayCellProps) {
  const events = getDayEvents(occurrences, day)
  const visibleEvents = events.slice(0, maxMonthEvents)
  const remainingEvents = events.length - visibleEvents.length
  const { setNodeRef, isOver } = useDroppable({
    id: `month:${day.toISOString()}`,
    data: {
      kind: "day",
      day,
    } satisfies CalendarDropTarget,
  })

  return (
    <section
      ref={setNodeRef}
      className={getCalendarSlotClassName(
        classNames,
        isOutsideMonth(day, anchorDate) ? "monthCellMuted" : "monthCell",
        cn(
          "flex min-h-[10.5rem] flex-col gap-2 border-r border-b border-border/70 px-2 py-2 transition-colors",
          isOver ? "bg-muted/50" : "",
          isOutsideMonth(day, anchorDate) ? "bg-muted/25" : "bg-background"
        )
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
          {formatWeekday(day)}
        </span>
        <span
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-full text-sm font-medium",
            isToday(day)
              ? "bg-primary text-primary-foreground"
              : "text-foreground"
          )}
        >
          {formatDayNumber(day)}
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
            dragInstanceId={`month:${day.toISOString()}:${occurrence.occurrenceId}`}
            event={occurrence}
            interactive={interactive}
            onEventKeyCommand={onEventKeyCommand}
            onSelect={onSelectEvent}
            renderEvent={renderEvent}
            selected={selectedEventId === occurrence.occurrenceId}
            timeLabel={getEventMetaLabel(occurrence, timeZone)}
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
