import * as React from "react"

import { useDroppable } from "@dnd-kit/core"
import { eachDayOfInterval } from "date-fns"

import { cn } from "@/lib/utils"

import type {
  CalendarClassNames,
  CalendarDropTarget,
  CalendarEventRenderer,
  CalendarOccurrence,
} from "../types"
import {
  formatAgendaEyebrow,
  formatAgendaHeading,
  getCalendarSlotClassName,
  getDayEvents,
  getEventMetaLabel,
} from "../utils"
import {
  CalendarEventCard,
  getResolvedAccentColor,
} from "./calendar-event-card"
import type { CalendarAgendaViewProps } from "./shared"

export function CalendarAgendaView(props: CalendarAgendaViewProps) {
  const days = eachDayOfInterval(props.range)

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div
        className={getCalendarSlotClassName(
          props.classNames,
          "agendaList",
          "min-w-[22rem] divide-y divide-border/70"
        )}
      >
        {days.map((day) => (
          <AgendaDayGroup
            key={day.toISOString()}
            classNames={props.classNames}
            day={day}
            events={getDayEvents(props.occurrences, day)}
            getEventColor={props.getEventColor}
            interactive={props.interactive}
            onEventKeyCommand={props.onEventKeyCommand}
            onSelect={props.onSelectEvent}
            renderEvent={props.renderEvent}
            selectedEventId={props.selectedEventId}
            timeZone={props.timeZone}
          />
        ))}
      </div>
    </div>
  )
}

type AgendaDayGroupProps = {
  classNames?: CalendarClassNames
  day: Date
  events: CalendarOccurrence[]
  getEventColor?: (occurrence: CalendarOccurrence) => string
  interactive: boolean
  onEventKeyCommand: (
    occurrence: CalendarOccurrence,
    event: React.KeyboardEvent<HTMLButtonElement>
  ) => void
  onSelect: (occurrence: CalendarOccurrence) => void
  renderEvent?: CalendarEventRenderer
  selectedEventId?: string
  timeZone?: string
}

function AgendaDayGroup({
  classNames,
  day,
  events,
  getEventColor,
  interactive,
  onEventKeyCommand,
  onSelect,
  renderEvent,
  selectedEventId,
  timeZone,
}: AgendaDayGroupProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `agenda:${day.toISOString()}`,
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
        "agendaGroup",
        cn(
          "grid gap-4 px-4 py-4 md:grid-cols-[7rem_1fr] md:px-5",
          isOver ? "bg-muted/50" : ""
        )
      )}
    >
      <div className="space-y-1">
        <p className="text-[11px] tracking-[0.24em] text-muted-foreground uppercase">
          {formatAgendaEyebrow(day)}
        </p>
        <h3 className="font-medium">{formatAgendaHeading(day)}</h3>
      </div>
      <div className="space-y-2">
        {events.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">
            No events scheduled.
          </p>
        ) : (
          events.map((occurrence) => (
            <CalendarEventCard
              key={occurrence.occurrenceId}
              accentColor={getResolvedAccentColor(occurrence, getEventColor)}
              classNames={classNames}
              dragInstanceId={`agenda:${day.toISOString()}:${occurrence.occurrenceId}`}
              event={occurrence}
              interactive={interactive}
              onEventKeyCommand={onEventKeyCommand}
              onSelect={onSelect}
              renderEvent={renderEvent}
              selected={selectedEventId === occurrence.occurrenceId}
              timeLabel={getEventMetaLabel(occurrence, timeZone)}
              variant="agenda"
            />
          ))
        )}
      </div>
    </section>
  )
}
