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
import { getCalendarSlotClassName, getOccurrenceAccentColor } from "../utils"
import type { EventVariant } from "./shared"

type CalendarEventCardProps = {
  accentColor: string
  classNames?: CalendarClassNames
  dragInstanceId: string
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
  dragInstanceId?: string
  event: CalendarOccurrence
  isDragging?: boolean
  listeners?: DraggableSyntheticListeners
  overlay?: boolean
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void
  onSelect?: () => void
  renderEvent?: CalendarEventRenderer
  selected?: boolean
  showResizeHandles?: boolean
  style?: CSSProperties
  timeLabel: string
  variant: EventVariant
}

export function CalendarEventCard({
  accentColor,
  classNames,
  dragInstanceId,
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
      id: `event:${dragInstanceId}`,
      data: {
        kind: "event",
        occurrence: event,
        variant,
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
        className={getEventSlotClassName(classNames, variant)}
        dragInstanceId={dragInstanceId}
        event={event}
        isDragging={isDragging}
        listeners={dragEnabled ? listeners : undefined}
        onKeyDown={(keyEvent) => onEventKeyCommand(event, keyEvent)}
        onSelect={() => onSelect(event)}
        renderEvent={renderEvent}
        selected={selected}
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
  dragInstanceId,
  event,
  isDragging = false,
  listeners,
  overlay = false,
  onKeyDown,
  onSelect,
  renderEvent,
  selected,
  showResizeHandles,
  style,
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
        <p className="truncate text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
          {timeLabel}
        </p>
      ) : null}
      <p className="truncate leading-tight font-medium text-card-foreground">
        {event.title}
      </p>
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
      className={cn(
        getEventSurfaceClassName(variant, selected, isDragging, overlay),
        className
      )}
      data-calendar-drag-surface="true"
      data-selected={selected ? "true" : undefined}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      style={{
        ...getEventSurfaceStyle(),
        ...style,
      }}
      type="button"
      {...attributes}
      {...listeners}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute top-1.5 bottom-1.5 left-1.5 w-0.5 rounded-full"
        style={{ backgroundColor: accentColor }}
      />
      {showResizeHandles ? (
        <>
          <ResizeHandle
            accentColor={accentColor}
            dragInstanceId={dragInstanceId}
            edge="start"
            event={event}
            interactive
            variant={variant}
          />
          <ResizeHandle
            accentColor={accentColor}
            dragInstanceId={dragInstanceId}
            edge="end"
            event={event}
            interactive
            variant={variant}
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
  dragInstanceId,
  edge,
  event,
  interactive,
  variant,
}: {
  accentColor: string
  dragInstanceId?: string
  edge: "start" | "end"
  event: CalendarOccurrence
  interactive: boolean
  variant: EventVariant
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `resize:${edge}:${dragInstanceId ?? event.occurrenceId}`,
    data: {
      kind: "resize",
      occurrence: event,
      edge,
      variant,
    } satisfies CalendarDragData,
    disabled: !interactive,
  })

  return (
    <span
      ref={setNodeRef}
      className={cn(
        "absolute inset-x-0 z-10 h-3",
        edge === "start"
          ? "top-0 -translate-y-1/2 cursor-ns-resize"
          : "bottom-0 translate-y-1/2 cursor-ns-resize"
      )}
      {...(interactive ? attributes : undefined)}
      {...(interactive ? listeners : undefined)}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 left-3 h-1 w-5 -translate-y-1/2 rounded-full opacity-0 transition-opacity duration-150 group-hover/event:opacity-100 group-focus-visible/event:opacity-100",
          selectedHandleVisibilityClass(isDragging)
        )}
        style={{
          backgroundColor: isDragging ? accentColor : `${accentColor}88`,
        }}
      />
    </span>
  )
}

function getEventSlotClassName(
  classNames: CalendarClassNames | undefined,
  variant: EventVariant
) {
  const slot =
    variant === "month"
      ? "monthEvent"
      : variant === "agenda"
        ? "agendaEvent"
        : "timeGridEvent"

  return getCalendarSlotClassName(classNames, slot)
}

function getEventSurfaceStyle(): CSSProperties {
  return {
    borderColor: "var(--color-border)",
    backgroundColor: "var(--color-card)",
    color: "var(--color-card-foreground)",
  }
}

function getEventSurfaceClassName(
  variant: EventVariant,
  selected: boolean | undefined,
  isDragging: boolean,
  overlay: boolean
) {
  return cn(
    "group/event relative w-full min-w-0 overflow-hidden rounded-[min(var(--radius-sm),4px)] border px-2 py-2 pl-3 text-left shadow-xs transition-[border-color,box-shadow,opacity] duration-150 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
    variant === "month" || variant === "all-day"
      ? "px-2 py-1.5 pl-3 text-xs"
      : "text-sm",
    variant === "agenda" ? "min-h-20" : "",
    variant === "time-grid" ? "h-full" : "",
    selected ? "border-ring ring-2 ring-ring/60" : "",
    overlay
      ? "pointer-events-none shadow-sm"
      : isDragging
        ? "opacity-0"
        : "hover:border-foreground/15"
  )
}

function selectedHandleVisibilityClass(isDragging: boolean) {
  return isDragging
    ? "opacity-100"
    : "group-data-[selected=true]/event:opacity-100"
}
