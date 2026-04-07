import * as React from "react"
import type {
  CSSProperties,
  KeyboardEvent,
  MouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react"

import { cn } from "../lib/utils"

import type {
  CalendarClassNames,
  CalendarDensity,
  CalendarEventRenderer,
  CalendarEventVariant,
  CalendarOccurrence,
} from "../../types"
import {
  canMoveOccurrence,
  canResizeOccurrence,
  getCalendarSlotClassName,
  getOccurrenceAccentColor,
} from "../../utils"
import type { CalendarEventMenuPosition, EventVariant } from "../shared"
import { usePragmaticDraggable } from "./root/use-calendar-pragmatic-event-drag"

type CalendarEventCardProps = {
  accentColor: string
  classNames?: CalendarClassNames
  density?: CalendarDensity
  dragging?: boolean
  event: CalendarOccurrence
  interactive: boolean
  onDragPointerDown?: (
    occurrence: CalendarOccurrence,
    variant: EventVariant,
    event: ReactPointerEvent<HTMLButtonElement>
  ) => void
  onEventKeyCommand: (
    occurrence: CalendarOccurrence,
    event: KeyboardEvent<HTMLButtonElement>
  ) => void
  onResizeHandlePointerDown?: (
    occurrence: CalendarOccurrence,
    edge: "start" | "end",
    variant: CalendarEventVariant,
    event: ReactPointerEvent<HTMLSpanElement>
  ) => void
  onOpenContextMenu?: (
    occurrence: CalendarOccurrence,
    position: CalendarEventMenuPosition
  ) => void
  onSelect: (occurrence: CalendarOccurrence) => void
  preview?: boolean
  previewMetaLabel?: string
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
  renderEvent?: CalendarEventRenderer
  selected?: boolean
  showResizeHandles?: boolean
  shouldSuppressClick?: (occurrenceId: string) => boolean
  timeLabel: string
  variant: EventVariant
}

type EventSurfaceProps = {
  accentColor: string
  ariaLabel?: string
  className?: string
  density?: CalendarDensity
  dragging?: boolean
  event: CalendarOccurrence
  overlay?: boolean
  onDragPointerDown?: (
    occurrence: CalendarOccurrence,
    variant: EventVariant,
    event: ReactPointerEvent<HTMLButtonElement>
  ) => void
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void
  onResizeHandlePointerDown?: (
    occurrence: CalendarOccurrence,
    edge: "start" | "end",
    variant: CalendarEventVariant,
    event: ReactPointerEvent<HTMLSpanElement>
  ) => void
  onOpenContextMenu?: (
    occurrence: CalendarOccurrence,
    position: CalendarEventMenuPosition
  ) => void
  onSelect?: () => void
  preview?: boolean
  previewMetaLabel?: string
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
  renderEvent?: CalendarEventRenderer
  selected?: boolean
  showResizeHandles?: boolean
  style?: CSSProperties
  shouldSuppressClick?: (occurrenceId: string) => boolean
  timeLabel: string
  variant: EventVariant
}

function CalendarEventCardComponent({
  accentColor,
  classNames,
  density = "comfortable",
  dragging = false,
  event,
  interactive,
  onDragPointerDown,
  onEventKeyCommand,
  onResizeHandlePointerDown,
  onOpenContextMenu,
  onSelect,
  preview = false,
  previewMetaLabel,
  pragmaticDragConfigFactory,
  renderEvent,
  selected,
  showResizeHandles,
  shouldSuppressClick,
  timeLabel,
  variant,
}: CalendarEventCardProps) {
  const dragEnabled = interactive && canMoveOccurrence(event) && !preview

  return (
    <div className={variant === "time-grid" ? "h-full" : undefined}>
      <EventSurface
        accentColor={accentColor}
        ariaLabel={`${event.title}. ${timeLabel}.`}
        className={getEventSlotClassName(classNames, variant)}
        density={density}
        dragging={dragging}
        event={event}
        onDragPointerDown={dragEnabled ? onDragPointerDown : undefined}
        onKeyDown={(keyEvent) => onEventKeyCommand(event, keyEvent)}
        onResizeHandlePointerDown={onResizeHandlePointerDown}
        onOpenContextMenu={onOpenContextMenu}
        onSelect={() => onSelect(event)}
        preview={preview}
        previewMetaLabel={previewMetaLabel}
        pragmaticDragConfigFactory={
          dragEnabled ? pragmaticDragConfigFactory : undefined
        }
        renderEvent={renderEvent}
        selected={selected}
        showResizeHandles={
          showResizeHandles &&
          interactive &&
          !preview &&
          canResizeOccurrence(event)
        }
        shouldSuppressClick={shouldSuppressClick}
        timeLabel={timeLabel}
        variant={variant}
      />
    </div>
  )
}

export const CalendarEventCard = React.memo(
  CalendarEventCardComponent,
  (previousProps, nextProps) => {
    return (
      previousProps.accentColor === nextProps.accentColor &&
      previousProps.classNames === nextProps.classNames &&
      previousProps.density === nextProps.density &&
      previousProps.dragging === nextProps.dragging &&
      previousProps.event === nextProps.event &&
      previousProps.interactive === nextProps.interactive &&
      previousProps.onDragPointerDown === nextProps.onDragPointerDown &&
      previousProps.onEventKeyCommand === nextProps.onEventKeyCommand &&
      previousProps.onResizeHandlePointerDown ===
        nextProps.onResizeHandlePointerDown &&
      previousProps.onOpenContextMenu === nextProps.onOpenContextMenu &&
      previousProps.onSelect === nextProps.onSelect &&
      previousProps.preview === nextProps.preview &&
      previousProps.previewMetaLabel === nextProps.previewMetaLabel &&
      previousProps.pragmaticDragConfigFactory ===
        nextProps.pragmaticDragConfigFactory &&
      previousProps.renderEvent === nextProps.renderEvent &&
      previousProps.selected === nextProps.selected &&
      previousProps.showResizeHandles === nextProps.showResizeHandles &&
      previousProps.shouldSuppressClick === nextProps.shouldSuppressClick &&
      previousProps.timeLabel === nextProps.timeLabel &&
      previousProps.variant === nextProps.variant
    )
  }
)

export function EventSurface({
  accentColor,
  ariaLabel,
  className,
  density = "comfortable",
  dragging = false,
  event,
  overlay = false,
  onDragPointerDown,
  onKeyDown,
  onResizeHandlePointerDown,
  onOpenContextMenu,
  onSelect,
  preview = false,
  previewMetaLabel,
  pragmaticDragConfigFactory,
  renderEvent,
  selected,
  showResizeHandles,
  style,
  shouldSuppressClick,
  timeLabel,
  variant,
}: EventSurfaceProps) {
  const isCompact = variant === "month" || variant === "all-day"
  const durationMinutes = Math.max(
    1,
    Math.round((event.end.getTime() - event.start.getTime()) / 60_000)
  )
  const isShortTimeGridEvent =
    variant === "time-grid" && !event.allDay && durationMinutes <= 30
  const [buttonElement, setButtonElement] =
    React.useState<HTMLButtonElement | null>(null)
  const pragmaticDragConfig = React.useMemo(() => {
    // Selected time-grid cards expose resize handles, so keep desktop dragging
    // on the pointer interaction path instead of stacking two drag systems.
    if (showResizeHandles) {
      return null
    }

    return pragmaticDragConfigFactory?.(event, variant) ?? null
  }, [event, pragmaticDragConfigFactory, showResizeHandles, variant])
  usePragmaticDraggable(pragmaticDragConfig, buttonElement)

  function openContextMenu(position: CalendarEventMenuPosition) {
    if (!onOpenContextMenu || overlay) {
      return
    }

    onSelect?.()
    onOpenContextMenu(event, position)
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (
      shouldSuppressClick?.(
        event.currentTarget.dataset.calendarOccurrenceId ?? ""
      )
    ) {
      event.preventDefault()
      event.stopPropagation()
      return
    }

    onSelect?.()
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
      isDragging: dragging,
    })
  ) : (
    <div
      className={cn(
        "min-w-0",
        isShortTimeGridEvent ? "flex h-full items-center" : "space-y-0.5",
        variant === "time-grid" ? "relative z-10" : undefined
      )}
    >
      {!isCompact && !isShortTimeGridEvent ? (
        <p className="truncate text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
          {timeLabel}
        </p>
      ) : null}
      <p
        className={cn(
          "truncate font-medium text-card-foreground",
          isShortTimeGridEvent ? "text-[12px] leading-none" : "leading-tight"
        )}
      >
        {event.title}
      </p>
      {!isCompact && !isShortTimeGridEvent && event.location ? (
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
      data-calendar-drag-overlay={overlay ? "true" : undefined}
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
            dragging,
            overlay,
            preview,
            isShortTimeGridEvent
          ),
          className
        )}
        data-calendar-event-id={event.sourceEventId}
        data-calendar-occurrence-id={event.occurrenceId}
        data-calendar-variant={variant}
        data-selected={selected ? "true" : undefined}
        data-testid={`calendar-event-${event.sourceEventId}-${variant}`}
        ref={setButtonElement}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        onPointerDown={(pointerEvent) => {
          if (overlay || !onDragPointerDown || pointerEvent.button !== 0) {
            return
          }

          onDragPointerDown(event, variant, pointerEvent)
        }}
        style={getEventSurfaceStyle()}
        type="button"
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
        {(preview || overlay) && previewMetaLabel ? (
          <span className="pointer-events-none absolute right-2 bottom-1.5 rounded-full bg-background/92 px-1.5 py-0.5 text-[10px] font-medium text-foreground shadow-xs">
            {previewMetaLabel}
          </span>
        ) : null}
      </button>
      {showResizeHandles && !overlay && !dragging ? (
        <>
          <ResizeHandle
            accentColor={accentColor}
            edge="start"
            event={event}
            interactive
            onPointerDown={onResizeHandlePointerDown}
            variant={variant}
          />
          <ResizeHandle
            accentColor={accentColor}
            edge="end"
            event={event}
            interactive
            onPointerDown={onResizeHandlePointerDown}
            variant={variant}
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
  variant,
}: {
  accentColor: string
  edge: "start" | "end"
  event: CalendarOccurrence
  interactive: boolean
  onPointerDown?: (
    occurrence: CalendarOccurrence,
    edge: "start" | "end",
    variant: CalendarEventVariant,
    event: ReactPointerEvent<HTMLSpanElement>
  ) => void
  variant: CalendarEventVariant
}) {
  return (
    <span
      data-calendar-event-id={event.sourceEventId}
      data-calendar-occurrence-id={event.occurrenceId}
      data-calendar-resize-handle={edge}
      data-testid={`calendar-resize-handle-${event.sourceEventId}-${edge}`}
      className={cn(
        "absolute inset-x-0 z-20 h-4 touch-none select-none",
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
        onPointerDown?.(event, edge, variant, pointerEvent)
      }}
      style={{
        transform: edge === "start" ? "translateY(-50%)" : "translateY(50%)",
      }}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-1.5 top-1/2 h-px -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover/event:opacity-100 group-focus-visible/event:opacity-100",
          selectedHandleVisibilityClass()
        )}
        style={{
          backgroundColor: `${accentColor}55`,
        }}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 left-1/2 h-1.5 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-background/90 opacity-0 shadow-sm transition-[opacity,transform] duration-150 group-hover/event:scale-100 group-hover/event:opacity-100 group-focus-visible/event:scale-100 group-focus-visible/event:opacity-100",
          selectedHandleVisibilityClass(),
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
  isDragging: boolean,
  overlay: boolean,
  preview: boolean,
  isShortTimeGridEvent = false
) {
  return cn(
    "relative w-full min-w-0 cursor-pointer touch-none overflow-hidden rounded-[min(var(--radius-sm),4px)] border pr-[10px] pl-3 text-left shadow-xs transition-[border-color,box-shadow,opacity] duration-150 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
    variant === "time-grid" && isShortTimeGridEvent
      ? "px-2 py-1"
      : density === "compact"
        ? "px-2 py-1.5"
        : "px-2 py-2",
    variant === "month" || variant === "all-day"
      ? density === "compact"
        ? "px-2 py-1 pl-3 text-[11px]"
        : "px-2 py-1.5 pl-3 text-xs"
      : "text-sm",
    variant === "agenda" ? "min-h-20" : "",
    variant === "time-grid" ? "h-full" : "",
    preview ? "shadow-sm" : "",
    overlay
      ? "pointer-events-none shadow-sm"
      : isDragging && !preview
        ? "opacity-0"
        : "hover:border-foreground/15"
  )
}

function selectedHandleVisibilityClass() {
  return "group-data-[selected=true]/event:opacity-100"
}
