import type { CSSProperties, KeyboardEvent } from "react"

import {
  useDraggable,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "@/lib/utils"

import type {
  CalendarClassNames,
  CalendarDragData,
  CalendarEventRenderer,
  CalendarOccurrence,
} from "../types"
import {
  getCalendarSlotClassName,
  getOccurrenceAccentColor,
} from "../utils"
import type { EventVariant } from "./shared"

type CalendarEventCardProps = {
  accentColor: string
  classNames?: CalendarClassNames
  event: CalendarOccurrence
  interactive: boolean
  onEventKeyCommand: (
    occurrence: CalendarOccurrence,
    event: KeyboardEvent<HTMLButtonElement>
  ) => void
  onSelect: (occurrence: CalendarOccurrence) => void
  renderEvent?: CalendarEventRenderer
  selected?: boolean
  showResizeHandles?: boolean
  timeLabel: string
  variant: EventVariant
}

type EventSurfaceProps = {
  accentColor: string
  ariaLabel?: string
  attributes?: DraggableAttributes
  className?: string
  event: CalendarOccurrence
  isDragging?: boolean
  listeners?: DraggableSyntheticListeners
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void
  onSelect?: () => void
  renderEvent?: CalendarEventRenderer
  showResizeHandles?: boolean
  timeLabel: string
  variant: EventVariant
}

export function CalendarEventCard({
  accentColor,
  classNames,
  event,
  interactive,
  onEventKeyCommand,
  onSelect,
  renderEvent,
  selected,
  showResizeHandles,
  timeLabel,
  variant,
}: CalendarEventCardProps) {
  const disabled = event.readOnly
  const dragEnabled = interactive && !disabled
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `event:${event.occurrenceId}`,
      data: {
        kind: "event",
        occurrence: event,
      } satisfies CalendarDragData,
      disabled: !dragEnabled,
    })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
      }}
    >
      <EventSurface
        accentColor={accentColor}
        ariaLabel={`${event.title}. ${timeLabel}.`}
        attributes={dragEnabled ? attributes : undefined}
        className={getSlotClassNameForEvent(
          classNames,
          variant,
          selected,
          isDragging
        )}
        event={event}
        isDragging={isDragging}
        listeners={dragEnabled ? listeners : undefined}
        onKeyDown={(keyEvent) => onEventKeyCommand(event, keyEvent)}
        onSelect={() => onSelect(event)}
        renderEvent={renderEvent}
        showResizeHandles={showResizeHandles && interactive}
        timeLabel={timeLabel}
        variant={variant}
      />
    </div>
  )
}

export function EventSurface({
  accentColor,
  ariaLabel,
  attributes,
  className,
  event,
  isDragging = false,
  listeners,
  onKeyDown,
  onSelect,
  renderEvent,
  showResizeHandles,
  timeLabel,
  variant,
}: EventSurfaceProps) {
  const isCompact = variant === "month" || variant === "all-day"
  const content = renderEvent ? (
    renderEvent({
      occurrence: event,
      accentColor,
      timeLabel,
      isCompact,
      isDragging,
    })
  ) : (
    <div className="min-w-0 space-y-0.5">
      {!isCompact ? (
        <p className="truncate text-[10px] font-medium tracking-[0.24em] text-foreground/70 uppercase">
          {timeLabel}
        </p>
      ) : null}
      <p className="truncate leading-tight font-medium">{event.title}</p>
      {!isCompact && event.location ? (
        <p className="truncate text-[11px] text-muted-foreground">
          {event.location}
        </p>
      ) : null}
      {variant === "agenda" && event.calendarLabel ? (
        <p className="truncate text-[11px] text-muted-foreground">
          {event.calendarLabel}
        </p>
      ) : null}
    </div>
  )

  return (
    <button
      aria-label={ariaLabel}
      className={className}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      style={getEventSurfaceStyle(accentColor, variant, isDragging)}
      type="button"
      {...attributes}
      {...listeners}
    >
      {showResizeHandles ? (
        <>
          <ResizeHandle
            accentColor={accentColor}
            edge="start"
            event={event}
            interactive
          />
          <ResizeHandle
            accentColor={accentColor}
            edge="end"
            event={event}
            interactive
          />
        </>
      ) : null}
      {content}
    </button>
  )
}

export function getResolvedAccentColor(
  occurrence: CalendarOccurrence,
  getEventColor?: (occurrence: CalendarOccurrence) => string,
  index = 0
) {
  return (
    getEventColor?.(occurrence) ?? getOccurrenceAccentColor(occurrence, index)
  )
}

function ResizeHandle({
  accentColor,
  edge,
  event,
  interactive,
}: {
  accentColor: string
  edge: "start" | "end"
  event: CalendarOccurrence
  interactive: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `resize:${edge}:${event.occurrenceId}`,
    data: {
      kind: "resize",
      occurrence: event,
      edge,
    } satisfies CalendarDragData,
    disabled: !interactive,
  })

  return (
    <span
      ref={setNodeRef}
      className={cn(
        "absolute inset-x-2 z-10 h-2 rounded-full",
        edge === "start"
          ? "top-0 -translate-y-1/2 cursor-ns-resize"
          : "bottom-0 translate-y-1/2 cursor-ns-resize"
      )}
      style={{
        backgroundColor: isDragging ? accentColor : `${accentColor}88`,
      }}
      {...(interactive ? attributes : undefined)}
      {...(interactive ? listeners : undefined)}
    />
  )
}

function getSlotClassNameForEvent(
  classNames: CalendarClassNames | undefined,
  variant: EventVariant,
  selected: boolean | undefined,
  isDragging: boolean
) {
  const slot =
    variant === "month"
      ? "monthEvent"
      : variant === "agenda"
        ? "agendaEvent"
        : "timeGridEvent"

  return getCalendarSlotClassName(
    classNames,
    slot,
    cn(
      "relative w-full min-w-0 overflow-hidden rounded-[calc(var(--radius)*0.95)] border px-2 py-2 text-left shadow-sm transition outline-none",
      variant === "month" || variant === "all-day"
        ? "px-2 py-1.5 text-xs"
        : "h-full text-sm",
      variant === "agenda" ? "min-h-20" : "",
      selected ? "ring-2 ring-ring/70" : "",
      isDragging ? "opacity-70" : "hover:-translate-y-px hover:shadow-md"
    )
  )
}

function getEventSurfaceStyle(
  accentColor: string,
  variant: EventVariant,
  isDragging: boolean
): CSSProperties {
  const intensity =
    variant === "time-grid" ? "22%" : variant === "overlay" ? "26%" : "14%"

  return {
    borderColor: `color-mix(in oklab, ${accentColor} 45%, var(--color-border))`,
    background: `color-mix(in oklab, ${accentColor} ${intensity}, var(--color-background))`,
    boxShadow: `inset 3px 0 0 ${accentColor}`,
    opacity: isDragging ? 0.72 : 1,
  }
}
