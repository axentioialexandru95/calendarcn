import * as React from "react"

import { cn } from "../../lib/utils"

import type {
  CalendarClassNames,
  CalendarEventRenderer,
  CalendarEventVariant,
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
import { CalendarEventCard, getResolvedAccentColor } from "../event-card"

type AllDayDropZoneProps = {
  classNames?: CalendarClassNames
  day: Date
  density: "comfortable" | "compact"
  dragPreviewOccurrence?: CalendarOccurrence
  draggingOccurrenceId?: string
  events: CalendarOccurrence[]
  getEventColor?: (occurrence: CalendarOccurrence) => string
  hourCycle?: 12 | 24
  isDragTarget: boolean
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
  pragmaticDragConfigFactory?: (
    occurrence: CalendarOccurrence,
    variant: CalendarEventVariant
  ) => {
    getInitialData: () => {
      occurrence: CalendarOccurrence
      type: "calendar-event"
      variant: CalendarEventVariant
    }
  } | null
  previewOccurrenceId?: string
  renderEvent?: CalendarEventRenderer
  selectedEventId?: string
  shouldSuppressEventClick?: (occurrenceId: string) => boolean
  timeZone?: string
}

export function AllDayDropZone({
  classNames,
  day,
  density,
  dragPreviewOccurrence,
  draggingOccurrenceId,
  events,
  getEventColor,
  hourCycle,
  isDragTarget,
  interactive,
  locale,
  onEventDragPointerDown,
  onEventKeyCommand,
  onOpenContextMenu,
  onSelect,
  pragmaticDragConfigFactory,
  previewOccurrenceId,
  renderEvent,
  selectedEventId,
  shouldSuppressEventClick,
  timeZone,
}: AllDayDropZoneProps) {
  const previewEvents = React.useMemo(
    () =>
      dragPreviewOccurrence
        ? getAllDayEvents([dragPreviewOccurrence], day)
        : [],
    [day, dragPreviewOccurrence]
  )
  const displayEvents = React.useMemo(() => {
    const visibleEvents = events.filter(
      (occurrence) => occurrence.occurrenceId !== draggingOccurrenceId
    )

    if (previewEvents.length === 0) {
      return visibleEvents
    }

    const previewEventIds = new Set(
      previewEvents.map((occurrence) => occurrence.occurrenceId)
    )

    return [
      ...visibleEvents.filter(
        (occurrence) => !previewEventIds.has(occurrence.occurrenceId)
      ),
      ...previewEvents,
    ]
  }, [draggingOccurrenceId, events, previewEvents])

  return (
    <div
      data-calendar-drop-target-day={day.toISOString()}
      data-calendar-drop-target-kind="all-day"
      data-calendar-zoom-day={day.toISOString()}
      data-calendar-zoom-surface="all-day"
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
        {displayEvents.map((occurrence, index) => {
          const isDragPreview = previewEvents.some(
            (previewEvent) =>
              previewEvent.occurrenceId === occurrence.occurrenceId
          )

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
              onSelect={onSelect}
              pragmaticDragConfigFactory={pragmaticDragConfigFactory}
              preview={
                isDragPreview || previewOccurrenceId === occurrence.occurrenceId
              }
              previewMetaLabel={
                density === "compact" &&
                (isDragPreview ||
                  previewOccurrenceId === occurrence.occurrenceId)
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
          )
        })}
      </div>
    </div>
  )
}

export const MemoizedAllDayDropZone = React.memo(
  AllDayDropZone,
  (previousProps, nextProps) => {
    return (
      previousProps.classNames === nextProps.classNames &&
      previousProps.day.getTime() === nextProps.day.getTime() &&
      previousProps.density === nextProps.density &&
      previousProps.dragPreviewOccurrence === nextProps.dragPreviewOccurrence &&
      previousProps.draggingOccurrenceId === nextProps.draggingOccurrenceId &&
      previousProps.events === nextProps.events &&
      previousProps.getEventColor === nextProps.getEventColor &&
      previousProps.hourCycle === nextProps.hourCycle &&
      previousProps.isDragTarget === nextProps.isDragTarget &&
      previousProps.interactive === nextProps.interactive &&
      previousProps.locale === nextProps.locale &&
      previousProps.onEventDragPointerDown ===
        nextProps.onEventDragPointerDown &&
      previousProps.onEventKeyCommand === nextProps.onEventKeyCommand &&
      previousProps.onOpenContextMenu === nextProps.onOpenContextMenu &&
      previousProps.onSelect === nextProps.onSelect &&
      previousProps.pragmaticDragConfigFactory ===
        nextProps.pragmaticDragConfigFactory &&
      previousProps.previewOccurrenceId === nextProps.previewOccurrenceId &&
      previousProps.renderEvent === nextProps.renderEvent &&
      previousProps.selectedEventId === nextProps.selectedEventId &&
      previousProps.shouldSuppressEventClick ===
        nextProps.shouldSuppressEventClick &&
      previousProps.timeZone === nextProps.timeZone
    )
  }
)
