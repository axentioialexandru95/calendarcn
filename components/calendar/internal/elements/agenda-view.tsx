import * as React from "react"

import { cn } from "../lib/utils"

import type {
  CalendarClassNames,
  CalendarEventRenderer,
  CalendarOccurrence,
} from "../../types"
import {
  getAgendaDays,
  formatAgendaEyebrow,
  formatAgendaHeading,
  getCalendarSlotClassName,
  getDayEvents,
  getEventMetaLabel,
} from "../../utils"
import { CalendarEventCard, getResolvedAccentColor } from "./event-card"
import type {
  CalendarAgendaViewProps,
  CalendarEventMenuPosition,
} from "../shared"

export const CalendarAgendaView = React.memo(function CalendarAgendaView(
  props: CalendarAgendaViewProps
) {
  const days = getAgendaDays(props.range, props.hiddenDays)

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div
        aria-label="Agenda view"
        className={getCalendarSlotClassName(
          props.classNames,
          "agendaList",
          "min-w-[22rem] divide-y divide-border/70"
        )}
        role="list"
      >
        {days.map((day) => (
          <AgendaDayGroup
            key={day.toISOString()}
            activeDropTarget={props.activeDropTarget}
            classNames={props.classNames}
            day={day}
            density={props.density}
            draggingOccurrenceId={props.draggingOccurrenceId}
            events={getDayEvents(props.occurrences, day)}
            getEventColor={props.getEventColor}
            hourCycle={props.hourCycle}
            interactive={props.interactive}
            locale={props.locale}
            onEventDragPointerDown={props.onEventDragPointerDown}
            onEventKeyCommand={props.onEventKeyCommand}
            onOpenContextMenu={props.onOpenContextMenu}
            onSelect={props.onSelectEvent}
            previewOccurrenceId={props.previewOccurrenceId}
            renderEvent={props.renderEvent}
            selectedEventId={props.selectedEventId}
            shouldSuppressEventClick={props.shouldSuppressEventClick}
            timeZone={props.timeZone}
          />
        ))}
      </div>
    </div>
  )
})

type AgendaDayGroupProps = {
  activeDropTarget?: CalendarAgendaViewProps["activeDropTarget"]
  classNames?: CalendarClassNames
  day: Date
  density: "comfortable" | "compact"
  draggingOccurrenceId?: string
  events: CalendarOccurrence[]
  getEventColor?: (occurrence: CalendarOccurrence) => string
  hourCycle?: 12 | 24
  interactive: boolean
  locale?: string
  onEventDragPointerDown?: CalendarAgendaViewProps["onEventDragPointerDown"]
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
  shouldSuppressEventClick?: (occurrenceId: string) => boolean
  timeZone?: string
}

function AgendaDayGroup({
  activeDropTarget,
  classNames,
  day,
  density,
  draggingOccurrenceId,
  events,
  getEventColor,
  hourCycle,
  locale,
  interactive,
  onEventDragPointerDown,
  onEventKeyCommand,
  onOpenContextMenu,
  onSelect,
  previewOccurrenceId,
  renderEvent,
  selectedEventId,
  shouldSuppressEventClick,
  timeZone,
}: AgendaDayGroupProps) {
  const headingId = `calendar-agenda-heading-${day.getTime()}`
  const isDragTarget =
    activeDropTarget?.kind === "day" &&
    activeDropTarget.day.getTime() === day.getTime()

  return (
    <section
      aria-labelledby={headingId}
      className={getCalendarSlotClassName(
        classNames,
        "agendaGroup",
        cn(
          density === "compact"
            ? "grid gap-3 px-4 py-3 md:grid-cols-[6.5rem_1fr] md:px-5"
            : "grid gap-4 px-4 py-4 md:grid-cols-[7rem_1fr] md:px-5",
          isDragTarget ? "bg-muted/50" : ""
        )
      )}
      data-calendar-drop-target-day={day.toISOString()}
      data-calendar-drop-target-kind="day"
      role="listitem"
    >
      <div className="space-y-1">
        <p className="text-[11px] tracking-[0.24em] text-muted-foreground uppercase">
          {formatAgendaEyebrow(day, {
            locale,
            timeZone,
          })}
        </p>
        <h3 className="font-medium">
          <span id={headingId}>
            {formatAgendaHeading(day, {
              locale,
              timeZone,
            })}
          </span>
        </h3>
      </div>
      <div
        className={density === "compact" ? "space-y-1.5" : "space-y-2"}
        role="list"
      >
        {events.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">
            No events scheduled.
          </p>
        ) : (
          events.map((occurrence) => (
            <div key={occurrence.occurrenceId} role="listitem">
              <CalendarEventCard
                accentColor={getResolvedAccentColor(occurrence, getEventColor)}
                classNames={classNames}
                density={density}
                dragging={draggingOccurrenceId === occurrence.occurrenceId}
                event={occurrence}
                interactive={interactive}
                onDragPointerDown={onEventDragPointerDown}
                onEventKeyCommand={onEventKeyCommand}
                onOpenContextMenu={onOpenContextMenu}
                onSelect={onSelect}
                preview={previewOccurrenceId === occurrence.occurrenceId}
                renderEvent={renderEvent}
                selected={selectedEventId === occurrence.occurrenceId}
                shouldSuppressClick={shouldSuppressEventClick}
                timeLabel={getEventMetaLabel(occurrence, {
                  hourCycle,
                  locale,
                  timeZone,
                })}
                variant="agenda"
              />
            </div>
          ))
        )}
      </div>
    </section>
  )
}
