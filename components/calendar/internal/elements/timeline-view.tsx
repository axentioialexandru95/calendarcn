import * as React from "react"

import { addDays, startOfDay } from "date-fns"

import { cn } from "../lib/utils"

import type { CalendarOccurrence, CalendarResource } from "../../types"
import {
  formatDayNumber,
  formatMonthDayLabel,
  formatWeekday,
  getCalendarSlotClassName,
  getEventMetaLabel,
  getEventResourceId,
  getWeekDays,
  isToday,
} from "../../utils"
import { CalendarEventCard, getResolvedAccentColor } from "./event-card"
import type { SharedViewProps } from "../shared"

const DAY_IN_MS = 86_400_000
const TIMELINE_DAY_MIN_WIDTH_REM = 9
const TIMELINE_LABEL_COLUMN_WIDTH = "13rem"

type TimelineRowData = {
  id: string
  label: string
  occurrences: CalendarOccurrence[]
  resource?: CalendarResource
  resourceId?: string
}

type TimelineItem = {
  endOffset: number
  occurrence: CalendarOccurrence
  startOffset: number
  lane: number
}

export const CalendarTimelineView = React.memo(function CalendarTimelineView(
  props: SharedViewProps
) {
  const days = React.useMemo(
    () => getWeekDays(props.anchorDate, props.weekStartsOn, props.hiddenDays),
    [props.anchorDate, props.hiddenDays, props.weekStartsOn]
  )
  const gridTemplateColumns = React.useMemo(
    () =>
      `${TIMELINE_LABEL_COLUMN_WIDTH} repeat(${days.length}, minmax(${TIMELINE_DAY_MIN_WIDTH_REM}rem, 1fr))`,
    [days.length]
  )
  const rows = React.useMemo(
    () =>
      buildTimelineRows(
        props.occurrences,
        props.resources,
        props.activeResourceIds
      ),
    [props.activeResourceIds, props.occurrences, props.resources]
  )

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="min-w-max">
        <div
          className={getCalendarSlotClassName(
            props.classNames,
            "timelineHeader",
            "sticky top-0 z-30 grid border-b border-border/70 bg-background/95 backdrop-blur-sm"
          )}
          style={{
            gridTemplateColumns,
          }}
        >
          <div className="sticky left-0 z-30 border-r border-border/70 bg-background/95 px-4 py-3 backdrop-blur-sm">
            <p className="text-[11px] font-medium tracking-[0.24em] text-muted-foreground uppercase">
              {props.resources?.length ? "Calendars" : "Schedule"}
            </p>
          </div>
          {days.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "border-r border-border/70 px-3 py-3 text-left last:border-r-0",
                isToday(day) ? "bg-accent/10" : ""
              )}
            >
              <p className="text-[11px] tracking-[0.24em] text-muted-foreground uppercase">
                {formatWeekday(day, {
                  locale: props.locale,
                  timeZone: props.timeZone,
                })}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span
                  className={cn(
                    "inline-flex size-8 items-center justify-center rounded-full text-sm font-medium",
                    isToday(day)
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground"
                  )}
                >
                  {formatDayNumber(day, {
                    locale: props.locale,
                    timeZone: props.timeZone,
                  })}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatMonthDayLabel(day, {
                    locale: props.locale,
                    timeZone: props.timeZone,
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div
          aria-label="Timeline view"
          className={getCalendarSlotClassName(
            props.classNames,
            "timelineGrid",
            "divide-y divide-border/70"
          )}
        >
          {rows.map((row) => (
            <TimelineRow
              key={row.id}
              days={days}
              gridTemplateColumns={gridTemplateColumns}
              row={row}
              {...props}
            />
          ))}
        </div>
      </div>
    </div>
  )
})

type TimelineRowProps = SharedViewProps & {
  days: Date[]
  gridTemplateColumns: string
  row: TimelineRowData
}

function TimelineRow({
  activeDropTarget,
  classNames,
  days,
  density,
  dragPreviewOccurrence,
  draggingOccurrenceId,
  getEventColor,
  gridTemplateColumns,
  hourCycle,
  interactive,
  locale,
  onEventCreate,
  onEventDragPointerDown,
  onEventKeyCommand,
  onOpenContextMenu,
  onResizeHandlePointerDown,
  onSelectEvent,
  previewOccurrenceId,
  renderEvent,
  row,
  selectedEventId,
  shouldSuppressEventClick,
  timeZone,
}: TimelineRowProps) {
  const rangeStart = React.useMemo(() => startOfDay(days[0] ?? new Date()), [days])
  const rangeEnd = React.useMemo(
    () =>
      addDays(startOfDay(days[days.length - 1] ?? new Date()), 1),
    [days]
  )
  const dragPreviewEvent = matchesTimelineRow(dragPreviewOccurrence, row)
    ? dragPreviewOccurrence
    : undefined
  const mergedOccurrences = React.useMemo(
    () => mergePreviewOccurrence(row.occurrences, dragPreviewEvent),
    [dragPreviewEvent, row.occurrences]
  )
  const { items, laneCount } = React.useMemo(
    () => buildTimelineLayout(mergedOccurrences, rangeStart, rangeEnd),
    [mergedOccurrences, rangeEnd, rangeStart]
  )
  const barHeight = density === "compact" ? 34 : 40
  const laneGap = density === "compact" ? 6 : 8
  const rowPadding = density === "compact" ? 10 : 12
  const minRowHeight = density === "compact" ? 72 : 84
  const rowHeight = Math.max(
    minRowHeight,
    laneCount * barHeight + Math.max(0, laneCount - 1) * laneGap + rowPadding * 2
  )
  const dayCount = Math.max(1, days.length)

  return (
    <section
      className={getCalendarSlotClassName(
        classNames,
        "timelineRow",
        "relative grid"
      )}
      data-testid={`calendar-timeline-row-${row.resourceId ?? "all"}`}
      style={{
        gridTemplateColumns,
      }}
    >
      <div className="sticky left-0 z-20 flex min-h-full items-center border-r border-border/70 bg-background px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {row.label}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {row.occurrences.length} {row.occurrences.length === 1 ? "event" : "events"}
          </p>
        </div>
      </div>
      {days.map((day) => {
        const isActiveTarget =
          activeDropTarget?.kind !== "slot" &&
          activeDropTarget?.day.getTime() === day.getTime() &&
          activeDropTarget?.resourceId === row.resourceId

        return (
          <TimelineDayCell
            key={`${row.id}-${day.toISOString()}`}
            active={Boolean(isActiveTarget)}
            day={day}
            height={rowHeight}
            interactive={interactive}
            locale={locale}
            onCreate={onEventCreate}
            resource={row.resource}
            resourceId={row.resourceId}
            timeZone={timeZone}
          />
        )
      })}
      {items.map((item, index) => {
        const isDragPreview =
          dragPreviewEvent?.occurrenceId === item.occurrence.occurrenceId

        return (
          <div
            key={item.occurrence.occurrenceId}
            className="absolute z-10 px-1"
            style={{
              height: barHeight,
              left: `calc(${TIMELINE_LABEL_COLUMN_WIDTH} + ((100% - ${TIMELINE_LABEL_COLUMN_WIDTH}) * ${item.startOffset / dayCount}) + 4px)`,
              top: rowPadding + item.lane * (barHeight + laneGap),
              width: `calc(((100% - ${TIMELINE_LABEL_COLUMN_WIDTH}) * ${(item.endOffset - item.startOffset) / dayCount}) - 8px)`,
            }}
          >
            <CalendarEventCard
              accentColor={getResolvedAccentColor(
                item.occurrence,
                getEventColor,
                index
              )}
              classNames={classNames}
              density={density}
              dragging={
                isDragPreview
                  ? false
                  : draggingOccurrenceId === item.occurrence.occurrenceId
              }
              event={item.occurrence}
              interactive={interactive}
              onDragPointerDown={onEventDragPointerDown}
              onEventKeyCommand={onEventKeyCommand}
              onOpenContextMenu={onOpenContextMenu}
              onResizeHandlePointerDown={onResizeHandlePointerDown}
              onSelect={onSelectEvent}
              preview={
                isDragPreview ||
                previewOccurrenceId === item.occurrence.occurrenceId
              }
              previewMetaLabel={
                isDragPreview
                  ? getEventMetaLabel(item.occurrence, {
                      hourCycle,
                      locale,
                      timeZone,
                    })
                  : undefined
              }
              renderEvent={renderEvent}
              selected={selectedEventId === item.occurrence.occurrenceId}
              shouldSuppressClick={shouldSuppressEventClick}
              showResizeHandles={Boolean(onResizeHandlePointerDown)}
              timeLabel={getEventMetaLabel(item.occurrence, {
                hourCycle,
                locale,
                timeZone,
              })}
              variant="timeline"
            />
          </div>
        )
      })}
    </section>
  )
}

function TimelineDayCell({
  active,
  day,
  height,
  interactive,
  locale,
  onCreate,
  resource,
  resourceId,
  timeZone,
}: {
  active: boolean
  day: Date
  height: number
  interactive: boolean
  locale?: string
  onCreate?: SharedViewProps["onEventCreate"]
  resource?: CalendarResource
  resourceId?: string
  timeZone?: string
}) {
  const className = cn(
    "border-r border-border/70 transition-colors last:border-r-0",
    active ? "bg-muted/60" : isToday(day) ? "bg-accent/10" : "bg-background"
  )

  if (!interactive || !onCreate) {
    return (
      <div
        aria-hidden
        className={className}
        data-calendar-drop-target-day={day.toISOString()}
        data-calendar-drop-target-kind="day"
        data-calendar-drop-target-resource-id={resourceId}
        style={{
          height,
        }}
      />
    )
  }

  return (
    <button
      aria-label={`Create an event on ${formatMonthDayLabel(day, {
        locale,
        timeZone,
      })}${resource ? ` for ${resource.label}` : ""}`}
      className={cn(
        className,
        "cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
      )}
      data-calendar-drop-target-day={day.toISOString()}
      data-calendar-drop-target-kind="day"
      data-calendar-drop-target-resource-id={resourceId}
      onClick={() => {
        const start = startOfDay(day)

        onCreate({
          allDay: true,
          calendarId: resource?.id,
          calendarLabel: resource?.label,
          color: resource?.color,
          end: addDays(start, 1),
          resourceId,
          start,
        })
      }}
      style={{
        height,
      }}
      type="button"
    />
  )
}

function buildTimelineRows(
  occurrences: CalendarOccurrence[],
  resources: CalendarResource[] | undefined,
  activeResourceIds: string[]
) {
  if (!resources?.length) {
    return [
      {
        id: "all-events",
        label: "All events",
        occurrences,
      } satisfies TimelineRowData,
    ]
  }

  const visibleResources = resources.filter((resource) =>
    activeResourceIds.length === 0 ? true : activeResourceIds.includes(resource.id)
  )

  return visibleResources.map((resource) => ({
    id: resource.id,
    label: resource.label,
    occurrences: occurrences.filter(
      (occurrence) => getEventResourceId(occurrence) === resource.id
    ),
    resource,
    resourceId: resource.id,
  }))
}

function buildTimelineLayout(
  occurrences: CalendarOccurrence[],
  rangeStart: Date,
  rangeEnd: Date
) {
  const rangeStartMs = rangeStart.getTime()
  const rangeEndMs = rangeEnd.getTime()
  const rangeDurationDays = Math.max(1, (rangeEndMs - rangeStartMs) / DAY_IN_MS)
  const laneEnds: number[] = []
  const items = occurrences
    .map((occurrence) => {
      const clippedStartMs = Math.max(occurrence.start.getTime(), rangeStartMs)
      const clippedEndMs = Math.min(occurrence.end.getTime(), rangeEndMs)

      if (clippedEndMs <= clippedStartMs) {
        return null
      }

      const startOffset =
        (startOfDay(new Date(clippedStartMs)).getTime() - rangeStartMs) / DAY_IN_MS
      const inclusiveEndOffset =
        (startOfDay(new Date(clippedEndMs - 1)).getTime() - rangeStartMs) /
        DAY_IN_MS
      const endOffset = Math.min(
        rangeDurationDays,
        Math.max(startOffset + 1, inclusiveEndOffset + 1)
      )

      return {
        endOffset,
        occurrence,
        startOffset,
      }
    })
    .filter((item): item is Omit<TimelineItem, "lane"> => item !== null)
    .sort((left, right) => {
      if (left.startOffset === right.startOffset) {
        if (left.endOffset === right.endOffset) {
          return left.occurrence.title.localeCompare(right.occurrence.title)
        }

        return left.endOffset - right.endOffset
      }

      return left.startOffset - right.startOffset
    })
    .map((item) => {
      let lane = laneEnds.findIndex((endOffset) => item.startOffset >= endOffset)

      if (lane === -1) {
        lane = laneEnds.length
        laneEnds.push(item.endOffset)
      } else {
        laneEnds[lane] = item.endOffset
      }

      return {
        ...item,
        lane,
      } satisfies TimelineItem
    })

  return {
    items,
    laneCount: Math.max(1, laneEnds.length),
  }
}

function mergePreviewOccurrence(
  occurrences: CalendarOccurrence[],
  previewOccurrence: CalendarOccurrence | undefined
) {
  if (!previewOccurrence) {
    return occurrences
  }

  return [
    ...occurrences.filter(
      (occurrence) => occurrence.occurrenceId !== previewOccurrence.occurrenceId
    ),
    previewOccurrence,
  ]
}

function matchesTimelineRow(
  occurrence: CalendarOccurrence | undefined,
  row: TimelineRowData
) {
  if (!occurrence) {
    return false
  }

  if (!row.resourceId) {
    return true
  }

  return getEventResourceId(occurrence) === row.resourceId
}
