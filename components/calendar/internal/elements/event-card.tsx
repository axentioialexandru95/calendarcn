"use client"

import type {
  CSSProperties,
  KeyboardEvent,
  MouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react"

import {
  useDraggable,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"

import { cn } from "@/lib/utils"

import type {
  CalendarClassNames,
  CalendarDensity,
  CalendarDragData,
  CalendarEventRenderer,
  CalendarOccurrence,
} from "../../types"
import { getCalendarSlotClassName, getOccurrenceAccentColor } from "../../utils"
import type { CalendarEventMenuPosition, EventVariant } from "../shared"

type CalendarEventCardProps = {
  accentColor: string
  classNames?: CalendarClassNames
  density?: CalendarDensity
  dragInstanceId: string
  event: CalendarOccurrence
  interactive: boolean
  onEventKeyCommand: (
    occurrence: CalendarOccurrence,
    event: KeyboardEvent<HTMLButtonElement>
  ) => void
  onResizeHandlePointerDown?: (
    occurrence: CalendarOccurrence,
    edge: "start" | "end",
    event: ReactPointerEvent<HTMLSpanElement>
  ) => void
  onOpenContextMenu?: (
    occurrence: CalendarOccurrence,
    position: CalendarEventMenuPosition
  ) => void
  onSelect: (occurrence: CalendarOccurrence) => void
  preview?: boolean
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
  density?: CalendarDensity
  event: CalendarOccurrence
  isDragging?: boolean
  listeners?: DraggableSyntheticListeners
  nodeRef?: (element: HTMLButtonElement | null) => void
  overlay?: boolean
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void
  onResizeHandlePointerDown?: (
    occurrence: CalendarOccurrence,
    edge: "start" | "end",
    event: ReactPointerEvent<HTMLSpanElement>
  ) => void
  onOpenContextMenu?: (
    occurrence: CalendarOccurrence,
    position: CalendarEventMenuPosition
  ) => void
  onSelect?: () => void
  preview?: boolean
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
  density = "comfortable",
  dragInstanceId,
  event,
  interactive,
  onEventKeyCommand,
  onResizeHandlePointerDown,
  onOpenContextMenu,
  onSelect,
  preview = false,
  renderEvent,
  selected,
  showResizeHandles,
  timeLabel,
  variant,
}: CalendarEventCardProps) {
  const disabled = event.readOnly
  const dragEnabled = interactive && !disabled && !preview
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
      className={variant === "time-grid" ? "h-full" : undefined}
      style={{
        transform: CSS.Translate.toString(transform),
      }}
    >
      <EventSurface
        accentColor={accentColor}
        ariaLabel={`${event.title}. ${timeLabel}.`}
        attributes={dragEnabled ? attributes : undefined}
        className={getEventSlotClassName(classNames, variant)}
        density={density}
        event={event}
        isDragging={isDragging}
        listeners={dragEnabled ? listeners : undefined}
        nodeRef={dragEnabled ? setNodeRef : undefined}
        onKeyDown={(keyEvent) => onEventKeyCommand(event, keyEvent)}
        onResizeHandlePointerDown={onResizeHandlePointerDown}
        onOpenContextMenu={onOpenContextMenu}
        onSelect={() => onSelect(event)}
        preview={preview}
        renderEvent={renderEvent}
        selected={selected}
        showResizeHandles={showResizeHandles && interactive && !preview}
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
  density = "comfortable",
  event,
  isDragging = false,
  listeners,
  nodeRef,
  overlay = false,
  onKeyDown,
  onResizeHandlePointerDown,
  onOpenContextMenu,
  onSelect,
  preview = false,
  renderEvent,
  selected,
  showResizeHandles,
  style,
  timeLabel,
  variant,
}: EventSurfaceProps) {
  const isCompact = variant === "month" || variant === "all-day"
  function openContextMenu(position: CalendarEventMenuPosition) {
    if (!onOpenContextMenu || overlay) {
      return
    }

    onSelect?.()
    onOpenContextMenu(event, position)
  }

  function handleContextMenu(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    openContextMenu({
      x: event.clientX,
      y: event.clientY,
    })
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    onKeyDown?.(event)

    if (event.defaultPrevented || !onOpenContextMenu || overlay) {
      return
    }

    if (
      event.key === "ContextMenu" ||
      (event.shiftKey && event.key === "F10")
    ) {
      const rect = event.currentTarget.getBoundingClientRect()

      event.preventDefault()
      openContextMenu({
        x: rect.left + rect.width / 2,
        y: rect.top + Math.min(rect.height, 24),
      })
    }
  }

  const content = renderEvent ? (
    renderEvent({
      occurrence: event,
      accentColor,
      timeLabel,
      isCompact,
      isDragging,
    })
  ) : (
    <div
      className={cn(
        "min-w-0 space-y-0.5",
        variant === "time-grid" ? "relative z-10" : undefined
      )}
    >
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
    <div
      className={cn(
        "group/event relative w-full min-w-0",
        variant === "time-grid" ? "h-full" : undefined
      )}
      data-calendar-drag-surface="true"
      data-selected={selected ? "true" : undefined}
      style={style}
    >
      <button
        aria-label={ariaLabel}
        className={cn(
          getEventSurfaceClassName(
            density,
            variant,
            selected,
            isDragging,
            overlay,
            preview
          ),
          className
        )}
        ref={nodeRef}
        data-calendar-event-id={event.sourceEventId}
        data-calendar-occurrence-id={event.occurrenceId}
        data-calendar-variant={variant}
        data-testid={`calendar-event-${event.sourceEventId}-${variant}`}
        onClick={onSelect}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        style={getEventSurfaceStyle()}
        type="button"
        {...attributes}
        {...listeners}
      >
        {preview ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[inherit] border border-dashed opacity-60"
            style={{ borderColor: accentColor }}
          />
        ) : null}
        <span
          aria-hidden
          className="pointer-events-none absolute top-1.5 bottom-1.5 left-1 w-0.5 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
        {content}
      </button>
      {showResizeHandles && !overlay ? (
        <>
          <ResizeHandle
            accentColor={accentColor}
            edge="start"
            event={event}
            interactive
            onPointerDown={onResizeHandlePointerDown}
          />
          <ResizeHandle
            accentColor={accentColor}
            edge="end"
            event={event}
            interactive
            onPointerDown={onResizeHandlePointerDown}
          />
        </>
      ) : null}
    </div>
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
  onPointerDown,
}: {
  accentColor: string
  edge: "start" | "end"
  event: CalendarOccurrence
  interactive: boolean
  onPointerDown?: (
    occurrence: CalendarOccurrence,
    edge: "start" | "end",
    event: ReactPointerEvent<HTMLSpanElement>
  ) => void
}) {
  return (
    <span
      data-calendar-event-id={event.sourceEventId}
      data-calendar-occurrence-id={event.occurrenceId}
      data-calendar-resize-handle={edge}
      data-testid={`calendar-resize-handle-${event.sourceEventId}-${edge}`}
      className={cn(
        "absolute inset-x-0 z-20 h-6 touch-none select-none",
        edge === "start"
          ? "top-0 cursor-ns-resize"
          : "bottom-0 cursor-ns-resize"
      )}
      onPointerDown={(pointerEvent) => {
        if (!interactive || pointerEvent.button !== 0) {
          return
        }

        pointerEvent.preventDefault()
        pointerEvent.stopPropagation()
        onPointerDown?.(event, edge, pointerEvent)
      }}
      style={{
        transform: edge === "start" ? "translateY(-50%)" : "translateY(50%)",
      }}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-1.5 top-1/2 h-px -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover/event:opacity-100 group-focus-visible/event:opacity-100",
          selectedHandleVisibilityClass(false)
        )}
        style={{
          backgroundColor: `${accentColor}55`,
        }}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 left-1/2 h-1.5 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background/90 opacity-0 shadow-sm transition-[opacity,transform] duration-150 group-hover/event:scale-100 group-hover/event:opacity-100 group-focus-visible/event:scale-100 group-focus-visible/event:opacity-100",
          selectedHandleVisibilityClass(false),
          "scale-95"
        )}
        style={{
          backgroundColor: `${accentColor}88`,
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
  density: CalendarDensity,
  variant: EventVariant,
  selected: boolean | undefined,
  isDragging: boolean,
  overlay: boolean,
  preview: boolean
) {
  return cn(
    "relative w-full min-w-0 overflow-hidden rounded-[min(var(--radius-sm),4px)] border pr-[10px] pl-3 text-left shadow-xs transition-[border-color,box-shadow,opacity] duration-150 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
    density === "compact" ? "px-2 py-1.5" : "px-2 py-2",
    variant === "month" || variant === "all-day"
      ? density === "compact"
        ? "px-2 py-1 pl-3 text-[11px]"
        : "px-2 py-1.5 pl-3 text-xs"
      : "text-sm",
    variant === "agenda" ? "min-h-20" : "",
    variant === "time-grid" ? "h-full" : "",
    selected ? "border-ring ring-2 ring-ring/60" : "",
    preview ? "shadow-sm" : "",
    overlay
      ? "pointer-events-none shadow-sm"
      : isDragging && !preview
        ? "opacity-0"
        : "hover:border-foreground/15"
  )
}

function selectedHandleVisibilityClass(isDragging: boolean) {
  return isDragging
    ? "opacity-100"
    : "group-data-[selected=true]/event:opacity-100"
}
