import type { ComponentProps, ComponentType } from "react"

import {
  CaretLeftIcon,
  CaretRightIcon,
  CommandIcon,
  ColumnsIcon,
  ListBulletsIcon,
  PlusIcon,
  RowsIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react"

import { cn } from "../lib/utils"

import { type CalendarView } from "../../types"
import { getCalendarSlotClassName } from "../../utils"
import type { CalendarToolbarProps } from "../shared"

const viewLabels: Record<CalendarView, string> = {
  month: "Month",
  week: "Week",
  day: "Day",
  agenda: "Agenda",
}

const viewIcons: Record<CalendarView, ComponentType<{ className?: string }>> = {
  month: SquaresFourIcon,
  week: ColumnsIcon,
  day: RowsIcon,
  agenda: ListBulletsIcon,
}

function ToolbarButton({
  className,
  size = "sm",
  tone = "ghost",
  ...props
}: ComponentProps<"button"> & {
  size?: "icon-sm" | "sm"
  tone?: "default" | "ghost" | "outline" | "secondary"
}) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[min(var(--radius-md),10px)] border text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50",
        size === "icon-sm" ? "size-8" : "h-8 gap-1 px-2.5",
        tone === "default"
          ? "border-transparent bg-primary text-primary-foreground hover:bg-primary/90"
          : "",
        tone === "ghost"
          ? "border-transparent bg-transparent hover:bg-muted hover:text-foreground"
          : "",
        tone === "outline"
          ? "border-border bg-background text-foreground shadow-xs hover:bg-muted"
          : "",
        tone === "secondary"
          ? "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
          : "",
        className
      )}
      type="button"
      {...props}
    />
  )
}

export function CalendarToolbar({
  activeResourceIds,
  availableViews,
  classNames,
  currentLabel,
  density = "comfortable",
  keyboardShortcutsButtonLabel = "Shortcuts",
  onNavigate,
  onOpenKeyboardShortcuts,
  onQuickCreate,
  onResourceFilterChange,
  onToday,
  onViewChange,
  renderToolbarExtras,
  resources,
  view,
}: CalendarToolbarProps) {
  const visibleResourceCount =
    activeResourceIds.length || resources?.length || 0
  const hasResourceFilters = Boolean(
    resources && resources.length > 1 && onResourceFilterChange
  )
  const allResourceIds = resources?.map((resource) => resource.id) ?? []
  const allResourcesSelected =
    !resources?.length ||
    activeResourceIds.length === 0 ||
    activeResourceIds.length === allResourceIds.length
  const toolbarExtras = renderToolbarExtras?.({
    activeResourceIds,
    availableViews,
    resources: resources ?? [],
    view,
  })
  const showViewSwitcher = availableViews.length > 1
  const toolbarMetaLabel = resources?.length
    ? `${visibleResourceCount}/${resources.length} calendars`
    : null

  return (
    <div
      className={getCalendarSlotClassName(
        classNames,
        "toolbar",
        cn(
          "flex flex-col border-b border-border/70 md:px-5",
          density === "compact" ? "gap-3 px-4 py-3" : "gap-4 px-4 py-4"
        )
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-start gap-2 sm:items-center">
          <div className="flex shrink-0 items-center gap-2">
            <ToolbarButton
              aria-label="Previous range"
              data-testid="calendar-nav-previous"
              onClick={() => onNavigate(-1)}
              size="icon-sm"
              tone="ghost"
            >
              <CaretLeftIcon className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              aria-label="Next range"
              data-testid="calendar-nav-next"
              onClick={() => onNavigate(1)}
              size="icon-sm"
              tone="ghost"
            >
              <CaretRightIcon className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              data-testid="calendar-nav-today"
              onClick={onToday}
              size="sm"
              tone="outline"
            >
              Today
            </ToolbarButton>
          </div>
          <div className="min-w-0 basis-full pt-1 sm:ml-2 sm:basis-auto sm:pt-0">
            <p
              className={getCalendarSlotClassName(
                classNames,
                "toolbarTitle",
                "truncate text-base font-medium tracking-tight md:text-lg"
              )}
              data-testid="calendar-current-label"
            >
              {currentLabel}
            </p>
            {toolbarMetaLabel ? (
              <p className="truncate text-xs text-muted-foreground">
                {toolbarMetaLabel}
              </p>
            ) : null}
          </div>
        </div>
        <div
          className={getCalendarSlotClassName(
            classNames,
            "toolbarGroup",
            "flex flex-wrap items-center gap-2"
          )}
        >
          {showViewSwitcher ? (
            <div
              className={getCalendarSlotClassName(
                classNames,
                "viewSwitcher",
                "grid w-full grid-cols-2 gap-1 rounded-[1.35rem] border border-border/70 bg-muted/40 p-1.5 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-1 sm:rounded-full sm:p-1"
              )}
            >
              {availableViews.map((item) => {
                const Icon = viewIcons[item]

                return (
                  <ToolbarButton
                    key={item}
                    className={getCalendarSlotClassName(
                      classNames,
                      "viewButton",
                      "w-full justify-center rounded-xl sm:w-auto sm:rounded-full"
                    )}
                    data-testid={`calendar-view-${item}`}
                    onClick={() => onViewChange(item)}
                    size="sm"
                    tone={view === item ? "secondary" : "ghost"}
                  >
                    <Icon className="size-4" />
                    {viewLabels[item]}
                  </ToolbarButton>
                )
              })}
            </div>
          ) : null}
          {onQuickCreate ? (
            <ToolbarButton
              className="rounded-full px-3.5"
              data-testid="calendar-toolbar-create"
              onClick={onQuickCreate}
              size="sm"
              tone="default"
            >
              <PlusIcon className="size-4" />
              New event
            </ToolbarButton>
          ) : null}
          {onOpenKeyboardShortcuts ? (
            <ToolbarButton
              data-testid="calendar-toolbar-shortcuts"
              onClick={onOpenKeyboardShortcuts}
              size="sm"
              tone="outline"
            >
              <CommandIcon className="size-4" />
              {keyboardShortcutsButtonLabel}
            </ToolbarButton>
          ) : null}
        </div>
      </div>
      {hasResourceFilters || toolbarExtras ? (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {hasResourceFilters ? (
            <div className="flex flex-wrap gap-2">
              <ToolbarButton
                onClick={() => onResourceFilterChange?.(allResourceIds)}
                size="sm"
                tone={allResourcesSelected ? "secondary" : "ghost"}
              >
                All calendars
              </ToolbarButton>
              {resources?.map((resource) => {
                const active = activeResourceIds.includes(resource.id)

                return (
                  <ToolbarButton
                    key={resource.id}
                    onClick={() => {
                      if (!onResourceFilterChange) {
                        return
                      }

                      const nextSelection = active
                        ? activeResourceIds.filter((id) => id !== resource.id)
                        : [...activeResourceIds, resource.id]

                      onResourceFilterChange(
                        nextSelection.length > 0
                          ? nextSelection
                          : allResourceIds
                      )
                    }}
                    size="sm"
                    tone={active ? "secondary" : "ghost"}
                  >
                    <span
                      aria-hidden
                      className="size-2 rounded-full"
                      style={{ backgroundColor: resource.color }}
                    />
                    {resource.label}
                  </ToolbarButton>
                )
              })}
            </div>
          ) : (
            <span />
          )}
          {toolbarExtras ? (
            <div className="flex flex-wrap items-center gap-2">
              {toolbarExtras}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
