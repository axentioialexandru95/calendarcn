"use client"

import * as React from "react"

import { useDroppable } from "@dnd-kit/core"

import { cn } from "@/lib/utils"

import type {
  CalendarClassNames,
  CalendarDropTarget,
  CalendarEventRenderer,
  CalendarOccurrence,
} from "../types"
import {
  getAgendaDays,
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
import type {
  CalendarAgendaViewProps,
  CalendarEventMenuPosition,
} from "./shared"

export function CalendarAgendaView(props: CalendarAgendaViewProps) {
  const days = getAgendaDays(props.range, props.hiddenDays)

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
            density={props.density}
            events={getDayEvents(props.occurrences, day)}
            getEventColor={props.getEventColor}
            hourCycle={props.hourCycle}
            interactive={props.interactive}
            locale={props.locale}
            onEventKeyCommand={props.onEventKeyCommand}
            onOpenContextMenu={props.onOpenContextMenu}
            onSelect={props.onSelectEvent}
            previewOccurrenceId={props.previewOccurrenceId}
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
  density: "comfortable" | "compact"
  events: CalendarOccurrence[]
  getEventColor?: (occurrence: CalendarOccurrence) => string
  hourCycle?: 12 | 24
  interactive: boolean
  locale?: string
  onEventKeyCommand: (
    occurrence: CalendarOccurrence,
    event: React.KeyboardEvent<HTMLButtonElement>
  ) => void
  onOpenContextMenu?: (
    occurrence: CalendarOccurrence,
    position: CalendarEventMenuPosition
  ) => void
  onSelect: (occurrence: CalendarOccurrence) => void
  previewOccurrenceId?: string
  renderEvent?: CalendarEventRenderer
  selectedEventId?: string
  timeZone?: string
}

function AgendaDayGroup({
  classNames,
  day,
  density,
  events,
  getEventColor,
  hourCycle,
  locale,
  interactive,
  onEventKeyCommand,
  onOpenContextMenu,
  onSelect,
  previewOccurrenceId,
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
          density === "compact"
            ? "grid gap-3 px-4 py-3 md:grid-cols-[6.5rem_1fr] md:px-5"
            : "grid gap-4 px-4 py-4 md:grid-cols-[7rem_1fr] md:px-5",
          isOver ? "bg-muted/50" : ""
        )
      )}
    >
      <div className="space-y-1">
        <p className="text-[11px] tracking-[0.24em] text-muted-foreground uppercase">
          {formatAgendaEyebrow(day, {
            locale,
            timeZone,
          })}
        </p>
        <h3 className="font-medium">
          {formatAgendaHeading(day, {
            locale,
            timeZone,
          })}
        </h3>
      </div>
      <div className={density === "compact" ? "space-y-1.5" : "space-y-2"}>
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
              density={density}
              dragInstanceId={`agenda:${day.toISOString()}:${occurrence.occurrenceId}`}
              event={occurrence}
              interactive={interactive}
              onEventKeyCommand={onEventKeyCommand}
              onOpenContextMenu={onOpenContextMenu}
              onSelect={onSelect}
              preview={previewOccurrenceId === occurrence.occurrenceId}
              renderEvent={renderEvent}
              selected={selectedEventId === occurrence.occurrenceId}
              timeLabel={getEventMetaLabel(occurrence, {
                hourCycle,
                locale,
                timeZone,
              })}
              variant="agenda"
            />
          ))
        )}
      </div>
    </section>
  )
}
