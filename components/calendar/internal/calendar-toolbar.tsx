import type { ComponentType } from "react"

import {
  CaretLeftIcon,
  CaretRightIcon,
  ColumnsIcon,
  ListBulletsIcon,
  PlusIcon,
  RowsIcon,
  SquaresFourIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"

import { calendarViews, type CalendarView } from "../types"
import { getCalendarSlotClassName } from "../utils"
import type { CalendarToolbarProps } from "./shared"

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

export function CalendarToolbar({
  classNames,
  currentLabel,
  onNavigate,
  onQuickCreate,
  onToday,
  onViewChange,
  resources,
  timeZone,
  view,
}: CalendarToolbarProps) {
  return (
    <div
      className={getCalendarSlotClassName(
        classNames,
        "toolbar",
        "flex flex-col gap-4 border-b border-border/70 px-4 py-4 md:px-5"
      )}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            aria-label="Previous range"
            onClick={() => onNavigate(-1)}
            size="icon-sm"
            variant="ghost"
          >
            <CaretLeftIcon className="size-4" />
          </Button>
          <Button
            aria-label="Next range"
            onClick={() => onNavigate(1)}
            size="icon-sm"
            variant="ghost"
          >
            <CaretRightIcon className="size-4" />
          </Button>
          <Button onClick={onToday} size="sm" variant="outline">
            Today
          </Button>
          <div className="ml-2 min-w-0">
            <p
              className={getCalendarSlotClassName(
                classNames,
                "toolbarTitle",
                "truncate text-base font-medium tracking-tight md:text-lg"
              )}
            >
              {currentLabel}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {timeZone ? `${timeZone} timezone` : "Local timezone"}
              {resources?.length ? ` · ${resources.length} calendars` : ""}
            </p>
          </div>
        </div>
        <div
          className={getCalendarSlotClassName(
            classNames,
            "toolbarGroup",
            "flex flex-wrap items-center gap-2"
          )}
        >
          <div
            className={getCalendarSlotClassName(
              classNames,
              "viewSwitcher",
              "flex flex-wrap items-center gap-1 rounded-full border border-border/70 bg-muted/40 p-1"
            )}
          >
            {calendarViews.map((item) => {
              const Icon = viewIcons[item]

              return (
                <Button
                  key={item}
                  className={getCalendarSlotClassName(
                    classNames,
                    "viewButton",
                    "rounded-full"
                  )}
                  onClick={() => onViewChange(item)}
                  size="sm"
                  variant={view === item ? "secondary" : "ghost"}
                >
                  <Icon className="size-4" />
                  {viewLabels[item]}
                </Button>
              )
            })}
          </div>
          {onQuickCreate ? (
            <Button onClick={onQuickCreate} size="sm">
              <PlusIcon className="size-4" />
              New event
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
