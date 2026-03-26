import * as React from "react"
import type { ElementType } from "react"

import {
  ArchiveBoxIcon,
  ClockIcon,
  CopySimpleIcon,
  MapPinIcon,
  NotePencilIcon,
  TrashIcon,
} from "@phosphor-icons/react"

import { cn } from "../lib/utils"

import type { CalendarOccurrence } from "../../types"
import { getEventMetaLabel, getOccurrenceAccentColor } from "../../utils"

type CalendarEventContextMenuProps = {
  hourCycle?: 12 | 24
  locale?: string
  occurrence: CalendarOccurrence
  onArchive?: () => void
  onClose: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  onOpenDetails?: () => void
  timeZone?: string
  x: number
  y: number
}

const FALLBACK_MENU_WIDTH = 220
const VIEWPORT_MARGIN = 16

export function CalendarEventContextMenu({
  hourCycle,
  locale,
  occurrence,
  onArchive,
  onClose,
  onDelete,
  onDuplicate,
  onOpenDetails,
  timeZone,
  x,
  y,
}: CalendarEventContextMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null)
  const itemRefs = React.useRef<Array<HTMLButtonElement | null>>([])
  const [position, setPosition] = React.useState({ x, y })
  const accentColor = getOccurrenceAccentColor(occurrence)
  const actions = React.useMemo(
    () =>
      [
        onOpenDetails
          ? {
              icon: NotePencilIcon,
              key: "details",
              label: "Open details",
              onSelect: onOpenDetails,
            }
          : null,
        onDuplicate
          ? {
              icon: CopySimpleIcon,
              key: "duplicate",
              label: "Duplicate event",
              onSelect: onDuplicate,
            }
          : null,
        onArchive
          ? {
              icon: ArchiveBoxIcon,
              key: "archive",
              label: "Archive event",
              onSelect: onArchive,
            }
          : null,
        onDelete
          ? {
              destructive: true,
              icon: TrashIcon,
              key: "delete",
              label: "Delete event",
              onSelect: onDelete,
            }
          : null,
      ].filter((action) => action !== null),
    [onArchive, onDelete, onDuplicate, onOpenDetails]
  )

  React.useLayoutEffect(() => {
    const menuElement = menuRef.current

    if (!menuElement) {
      return
    }

    const rect = menuElement.getBoundingClientRect()

    setPosition({
      x: Math.min(
        Math.max(x, VIEWPORT_MARGIN),
        window.innerWidth -
          Math.max(rect.width, FALLBACK_MENU_WIDTH) -
          VIEWPORT_MARGIN
      ),
      y: Math.min(
        Math.max(y, VIEWPORT_MARGIN),
        window.innerHeight - rect.height - VIEWPORT_MARGIN
      ),
    })
  }, [x, y])

  React.useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        onClose()
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    function handleViewportChange() {
      onClose()
    }

    window.addEventListener("pointerdown", handlePointerDown)
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("resize", handleViewportChange)
    window.addEventListener("scroll", handleViewportChange, true)

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown)
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("resize", handleViewportChange)
      window.removeEventListener("scroll", handleViewportChange, true)
    }
  }, [onClose])

  React.useEffect(() => {
    itemRefs.current[0]?.focus()
  }, [actions.length])

  function handleMenuKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()

      const currentIndex = itemRefs.current.findIndex(
        (item) => item === document.activeElement
      )
      const direction = event.key === "ArrowDown" ? 1 : -1
      const nextIndex =
        currentIndex === -1
          ? 0
          : (currentIndex + direction + actions.length) % actions.length

      itemRefs.current[nextIndex]?.focus()
      return
    }

    if (event.key === "Home") {
      event.preventDefault()
      itemRefs.current[0]?.focus()
      return
    }

    if (event.key === "End") {
      event.preventDefault()
      itemRefs.current[actions.length - 1]?.focus()
    }
  }

  return (
    <div
      ref={menuRef}
      aria-label={`Actions for ${occurrence.title}`}
      className="fixed z-50 w-[15rem] animate-in overflow-hidden rounded-[calc(var(--radius)*1.05)] border border-border/80 bg-popover/98 p-1 shadow-[0_18px_48px_-24px_rgba(15,23,42,0.52)] ring-1 ring-black/5 backdrop-blur-xl fade-in-0 zoom-in-95"
      data-testid="calendar-event-context-menu"
      onKeyDown={handleMenuKeyDown}
      role="menu"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="border-b border-border/70 px-2.5 py-2">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-muted/55">
            <span
              aria-hidden
              className="size-2 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-popover-foreground">
              {occurrence.title}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ClockIcon className="size-3" />
                {getEventMetaLabel(occurrence, {
                  hourCycle,
                  locale,
                  timeZone,
                })}
              </span>
              <span className="truncate text-[10px] tracking-[0.18em] uppercase">
                {occurrence.calendarLabel ?? occurrence.resourceId ?? "Event"}
              </span>
            </div>
            {occurrence.location ? (
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPinIcon className="size-3" />
                  {occurrence.location}
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="py-1">
        {actions.map((action, index) => (
          <ContextActionButton
            key={action.key}
            buttonRef={(element) => {
              itemRefs.current[index] = element
            }}
            destructive={action.destructive}
            icon={action.icon}
            label={action.label}
            onClick={action.onSelect}
            testId={`calendar-event-action-${action.key}`}
          />
        ))}
      </div>
    </div>
  )
}

function ContextActionButton({
  buttonRef,
  destructive = false,
  icon: Icon,
  label,
  onClick,
  testId,
}: {
  buttonRef?: (element: HTMLButtonElement | null) => void
  destructive?: boolean
  icon: ElementType<{ className?: string }>
  label: string
  onClick: () => void
  testId: string
}) {
  return (
    <button
      className={cn(
        "group mx-1 flex w-[calc(100%-0.5rem)] items-center gap-2.5 rounded-[calc(var(--radius)*0.75)] px-2 py-1.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "text-popover-foreground hover:bg-accent/70 hover:text-accent-foreground"
      )}
      data-testid={testId}
      onClick={onClick}
      ref={buttonRef}
      role="menuitem"
      type="button"
    >
      <span
        className={cn(
          "inline-flex size-6 shrink-0 items-center justify-center rounded-md transition-colors",
          destructive
            ? "bg-destructive/10 text-destructive"
            : "bg-muted/55 text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground"
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <span className="min-w-0 truncate text-[13px] font-medium">{label}</span>
    </button>
  )
}
