import { cn } from "@/lib/utils"

import type {
  CalendarClassNames,
  CalendarEventRenderer,
  CalendarOccurrence,
} from "../../../types"
import {
  formatDurationLabel,
  getAllDayEvents,
  getCalendarSlotClassName,
  getEventMetaLabel,
} from "../../../utils"
import {
  type CalendarEventMenuPosition,
  type TimeGridViewProps,
} from "../../shared"
import {
  CalendarEventCard,
  getResolvedAccentColor,
} from "../event-card"

type AllDayDropZoneProps = {
  activeDropTarget?: TimeGridViewProps["activeDropTarget"]
  classNames?: CalendarClassNames
  day: Date
  density: "comfortable" | "compact"
  dragPreviewOccurrence?: CalendarOccurrence
  draggingOccurrenceId?: string
  events: CalendarOccurrence[]
  getEventColor?: (occurrence: CalendarOccurrence) => string
  hourCycle?: 12 | 24
  interactive: boolean
  locale?: string
  onEventDragPointerDown?: TimeGridViewProps["onEventDragPointerDown"]
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

export function AllDayDropZone({
  activeDropTarget,
  classNames,
  day,
  density,
  dragPreviewOccurrence,
  draggingOccurrenceId,
  events,
  getEventColor,
  hourCycle,
  interactive,
  locale,
  onEventDragPointerDown,
  onEventKeyCommand,
  onOpenContextMenu,
  onSelect,
  previewOccurrenceId,
  renderEvent,
  selectedEventId,
  shouldSuppressEventClick,
  timeZone,
}: AllDayDropZoneProps) {
  const previewEvents = dragPreviewOccurrence
    ? getAllDayEvents([dragPreviewOccurrence], day)
    : []
  const isDragTarget =
    activeDropTarget?.kind === "all-day" &&
    activeDropTarget.day.getTime() === day.getTime()

  return (
    <div
      data-calendar-drop-target-day={day.toISOString()}
      data-calendar-drop-target-kind="all-day"
      className={getCalendarSlotClassName(
        classNames,
        "allDayLane",
        cn(
          density === "compact"
            ? "min-h-16 border-r border-border/70 px-2 py-1.5 last:border-r-0"
            : "min-h-18 border-r border-border/70 px-2 py-2 last:border-r-0",
          isDragTarget ? "bg-muted/50" : ""
        )
      )}
    >
      <div className="space-y-1">
        {events.map((occurrence, index) => (
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
            onSelect={onSelect}
            preview={previewOccurrenceId === occurrence.occurrenceId}
            previewMetaLabel={
              density === "compact" &&
              previewOccurrenceId === occurrence.occurrenceId
                ? formatDurationLabel(
                    occurrence.start,
                    occurrence.end,
                    occurrence.allDay
                  )
                : undefined
            }
            renderEvent={renderEvent}
            selected={selectedEventId === occurrence.occurrenceId}
            shouldSuppressClick={shouldSuppressEventClick}
            timeLabel={getEventMetaLabel(occurrence, {
              hourCycle,
              locale,
              timeZone,
            })}
            variant="all-day"
          />
        ))}
        {previewEvents.map((occurrence) => (
          <div
            key={`preview-${occurrence.occurrenceId}`}
            className={cn(
              "pointer-events-none rounded-[min(var(--radius-sm),4px)] border border-dashed border-foreground/18 bg-foreground/8 shadow-sm dark:border-white/12 dark:bg-white/8",
              density === "compact" ? "h-6" : "h-7"
            )}
          />
        ))}
      </div>
    </div>
  )
}
