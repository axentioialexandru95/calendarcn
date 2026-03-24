"use client"

import * as React from "react"

import { useDroppable } from "@dnd-kit/core"
import { isSameDay, startOfDay } from "date-fns"

import { cn } from "@/lib/utils"

import type {
  CalendarClassNames,
  CalendarCreateDraft,
  CalendarDropTarget,
  CalendarEventRenderer,
  CalendarOccurrence,
} from "../types"
import {
  formatHourLabel,
  formatMonthDayLabel,
  formatWeekday,
  getBlockedSegmentsForDay,
  getAllDayEvents,
  getBusinessHourSegmentsForDay,
  getCalendarSlotClassName,
  getDayLayout,
  getEventMetaLabel,
  getNextVisibleDay,
  getOutsideBusinessHourSegmentsForDay,
  getWeekDays,
  isToday,
  parseTimeStringToMinuteOfDay,
  setMinuteOfDay,
} from "../utils"
import {
  CalendarEventCard,
  getResolvedAccentColor,
} from "./calendar-event-card"
import {
  type CalendarEventMenuPosition,
  type SharedViewProps,
  type TimeGridViewProps,
} from "./shared"

export function CalendarWeekView(
  props: SharedViewProps & {
    minHour: number
    maxHour: number
  }
) {
  return (
    <CalendarTimeGridView
      {...props}
      days={getWeekDays(props.anchorDate, props.weekStartsOn, props.hiddenDays)}
    />
  )
}

export function CalendarDayView(
  props: SharedViewProps & {
    minHour: number
    maxHour: number
  }
) {
  return (
    <CalendarTimeGridView
      {...props}
      days={[startOfDay(getNextVisibleDay(props.anchorDate, props.hiddenDays))]}
    />
  )
}

function CalendarTimeGridView(props: TimeGridViewProps) {
  const [draft, setDraft] = React.useState<CalendarCreateDraft | null>(null)
  const [now, setNow] = React.useState(() => new Date())
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null)
  const minMinute = props.minHour * 60
  const maxMinute = props.maxHour * 60
  const totalMinutes = maxMinute - minMinute
  const slotCount = Math.max(1, totalMinutes / props.slotDuration)
  const gridHeight = slotCount * props.slotHeight
  const commitDraft = React.useEffectEvent(() => {
    if (!draft || !props.onEventCreate) {
      return
    }

    const startMinute = Math.min(draft.startMinute, draft.endMinute)
    const endMinute = Math.max(draft.startMinute, draft.endMinute)
    const start = setMinuteOfDay(startOfDay(draft.day), startMinute)
    const end = setMinuteOfDay(
      startOfDay(draft.day),
      Math.min(endMinute + props.slotDuration, 1_440)
    )

    props.onEventCreate({
      start,
      end,
    })
    setDraft(null)
  })

  React.useEffect(() => {
    if (!draft) {
      return
    }

    function handlePointerUp() {
      commitDraft()
    }

    window.addEventListener("pointerup", handlePointerUp)

    return () => {
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [draft])

  React.useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date())
    }, 30_000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  React.useEffect(() => {
    const container = scrollContainerRef.current

    if (!container || !props.scrollToTime) {
      return
    }

    const currentDate = new Date()
    const targetMinute =
      props.scrollToTime === "now"
        ? currentDate.getHours() * 60 + currentDate.getMinutes()
        : parseTimeStringToMinuteOfDay(props.scrollToTime)

    if (targetMinute === null) {
      return
    }

    const clampedMinute = Math.min(maxMinute, Math.max(minMinute, targetMinute))
    const nextScrollTop = Math.max(
      0,
      ((clampedMinute - minMinute) / props.slotDuration) * props.slotHeight -
        props.slotHeight * 2
    )

    container.scrollTop = nextScrollTop
  }, [
    maxMinute,
    minMinute,
    props.scrollToTime,
    props.slotDuration,
    props.slotHeight,
  ])

  return (
    <div className="min-h-0 flex-1 overflow-auto" ref={scrollContainerRef}>
      <div className="min-w-[56rem]">
        <div
          className="grid border-b border-border/70"
          style={{
            gridTemplateColumns: `4.5rem repeat(${props.days.length}, minmax(0, 1fr))`,
          }}
        >
          <div
            className={cn(
              "border-r border-border/70 text-[11px] tracking-[0.24em] text-muted-foreground uppercase",
              props.density === "compact" ? "px-3 py-2.5" : "px-3 py-3"
            )}
          >
            Time
          </div>
          {props.days.map((day) => (
            <div
              key={`header-${day.toISOString()}`}
              className={getCalendarSlotClassName(
                props.classNames,
                "timeGridHeader",
                cn(
                  "border-r border-border/70 last:border-r-0",
                  props.density === "compact" ? "px-3 py-2.5" : "px-3 py-3"
                )
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] tracking-[0.24em] text-muted-foreground uppercase">
                    {formatWeekday(day, {
                      locale: props.locale,
                      timeZone: props.timeZone,
                    })}
                  </p>
                  <p className="text-sm font-medium">
                    {formatMonthDayLabel(day, {
                      locale: props.locale,
                      timeZone: props.timeZone,
                    })}
                  </p>
                </div>
                {isToday(day) ? (
                  <span className="rounded-full bg-primary/12 px-2 py-1 text-[11px] font-medium text-primary">
                    Today
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <div
          className="grid border-b border-border/70"
          style={{
            gridTemplateColumns: `4.5rem repeat(${props.days.length}, minmax(0, 1fr))`,
          }}
        >
          <div
            className={cn(
              "border-r border-border/70 text-[11px] tracking-[0.24em] text-muted-foreground uppercase",
              props.density === "compact" ? "px-3 py-2.5" : "px-3 py-3"
            )}
          >
            All day
          </div>
          {props.days.map((day) => (
            <AllDayDropZone
              key={`all-day-${day.toISOString()}`}
              classNames={props.classNames}
              day={day}
              density={props.density}
              events={getAllDayEvents(props.occurrences, day)}
              getEventColor={props.getEventColor}
              hourCycle={props.hourCycle}
              interactive={props.interactive}
              locale={props.locale}
              onEventKeyCommand={props.onEventKeyCommand}
              onOpenContextMenu={props.onOpenContextMenu}
              onSelect={props.onSelectEvent}
              previewOccurrenceId={props.previewOccurrenceId}
              renderEvent={props.renderEvent}
              selectedEventId={props.selectedEventId}
              timeZone={props.timeZone}
            />
          ))}
        </div>
        <div
          className={getCalendarSlotClassName(
            props.classNames,
            "timeGrid",
            "grid"
          )}
          style={{
            gridTemplateColumns: `4.5rem repeat(${props.days.length}, minmax(0, 1fr))`,
          }}
        >
          <div className="relative border-r border-border/70">
            {Array.from({ length: slotCount }).map((_, index) => {
              const minute = minMinute + index * props.slotDuration
              const labelDate = setMinuteOfDay(
                startOfDay(props.days[0]),
                minute
              )

              return (
                <div
                  key={`time-label-${minute}`}
                  className="border-b border-border/50 px-3 text-[11px] text-muted-foreground"
                  style={{
                    height: props.slotHeight,
                  }}
                >
                  {minute % 60 === 0
                    ? formatHourLabel(labelDate, {
                        hourCycle: props.hourCycle,
                        locale: props.locale,
                        timeZone: props.timeZone,
                      })
                    : null}
                </div>
              )
            })}
          </div>
          {props.days.map((day) => {
            const layout = getDayLayout(
              props.occurrences,
              day,
              minMinute,
              maxMinute
            )
            const currentMinuteOfDay = now.getHours() * 60 + now.getMinutes()
            const showNowIndicator =
              isSameDay(day, now) &&
              currentMinuteOfDay >= minMinute &&
              currentMinuteOfDay <= maxMinute
            const nowIndicatorTop =
              ((currentMinuteOfDay - minMinute) / totalMinutes) * gridHeight

            return (
              <div
                key={`day-column-${day.toISOString()}`}
                className={getCalendarSlotClassName(
                  props.classNames,
                  "timeGridDayColumn",
                  "relative border-r border-border/70 last:border-r-0"
                )}
              >
                <div
                  className="relative"
                  style={{
                    height: gridHeight,
                  }}
                >
                  <TimeGridBackground
                    blockedRanges={props.blockedRanges}
                    businessHours={props.businessHours}
                    day={day}
                    gridHeight={gridHeight}
                    maxMinute={maxMinute}
                    minMinute={minMinute}
                    slotDuration={props.slotDuration}
                    slotHeight={props.slotHeight}
                  />
                  <div
                    className="absolute inset-0 grid"
                    style={{
                      gridTemplateRows: `repeat(${slotCount}, ${props.slotHeight}px)`,
                    }}
                  >
                    {Array.from({ length: slotCount }).map((_, index) => {
                      const minuteOfDay = minMinute + index * props.slotDuration
                      const slotStart = setMinuteOfDay(startOfDay(day), minuteOfDay)
                      const slotEnd = setMinuteOfDay(
                        startOfDay(day),
                        Math.min(minuteOfDay + props.slotDuration, 1_440)
                      )

                      return (
                        <TimeSlotDropZone
                          key={`${day.toISOString()}-${minuteOfDay}`}
                          classNames={props.classNames}
                          day={day}
                          draft={draft}
                          blocked={
                            props.blockedRanges?.some((range) =>
                              slotStart.getTime() < range.end.getTime() &&
                              slotEnd.getTime() > range.start.getTime()
                            ) ?? false
                          }
                          hourCycle={props.hourCycle}
                          locale={props.locale}
                          minuteOfDay={minuteOfDay}
                          onBeginCreate={() => {
                            if (!props.onEventCreate) {
                              return
                            }

                            setDraft({
                              day,
                              startMinute: minuteOfDay,
                              endMinute: minuteOfDay,
                            })
                          }}
                          onExtendCreate={() => {
                            if (!draft || !isSameDay(draft.day, day)) {
                              return
                            }

                            setDraft({
                              ...draft,
                              endMinute: minuteOfDay,
                            })
                          }}
                        />
                      )
                    })}
                  </div>
                  {draft && isSameDay(draft.day, day) ? (
                    <div
                      className="pointer-events-none absolute inset-x-1 rounded-[calc(var(--radius)*0.9)] border border-dashed border-primary/60 bg-primary/10"
                      style={{
                        top:
                          ((Math.min(draft.startMinute, draft.endMinute) -
                            minMinute) /
                            props.slotDuration) *
                          props.slotHeight,
                        height:
                          ((Math.abs(draft.endMinute - draft.startMinute) +
                            props.slotDuration) /
                            props.slotDuration) *
                          props.slotHeight,
                      }}
                    />
                  ) : null}
                  {showNowIndicator ? (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-20"
                      style={{
                        top: nowIndicatorTop,
                      }}
                    >
                      <div className="relative h-0">
                        <div className="absolute top-1/2 left-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_0_3px_var(--color-background)]" />
                        <div className="h-0.5 w-full bg-primary" />
                      </div>
                    </div>
                  ) : null}
                  {layout.map((item, index) => {
                    const width = 100 / item.columns
                    const left = item.column * width

                    return (
                      <div
                        key={item.occurrence.occurrenceId}
                        className="absolute px-1"
                        style={{
                          top:
                            ((item.top - minMinute) / props.slotDuration) *
                            props.slotHeight,
                          height: Math.max(
                            props.slotHeight - 4,
                            (item.height / props.slotDuration) * props.slotHeight
                          ),
                          left: `calc(${left}% + 0px)`,
                          width: `calc(${width}% - 0px)`,
                        }}
                      >
                        <CalendarEventCard
                          accentColor={getResolvedAccentColor(
                            item.occurrence,
                            props.getEventColor,
                            index
                          )}
                          classNames={props.classNames}
                          density={props.density}
                          dragInstanceId={`time-grid:${day.toISOString()}:${item.occurrence.occurrenceId}`}
                          event={item.occurrence}
                          interactive={props.interactive}
                          onEventKeyCommand={props.onEventKeyCommand}
                          onOpenContextMenu={props.onOpenContextMenu}
                          onSelect={props.onSelectEvent}
                          preview={
                            props.previewOccurrenceId ===
                            item.occurrence.occurrenceId
                          }
                          renderEvent={props.renderEvent}
                          selected={
                            props.selectedEventId ===
                            item.occurrence.occurrenceId
                          }
                          showResizeHandles
                          timeLabel={getEventMetaLabel(
                            item.occurrence,
                            {
                              hourCycle: props.hourCycle,
                              locale: props.locale,
                              timeZone: props.timeZone,
                            }
                          )}
                          variant="time-grid"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function TimeGridBackground({
  blockedRanges,
  businessHours,
  day,
  gridHeight,
  maxMinute,
  minMinute,
  slotDuration,
  slotHeight,
}: {
  blockedRanges: TimeGridViewProps["blockedRanges"]
  businessHours: TimeGridViewProps["businessHours"]
  day: Date
  gridHeight: number
  maxMinute: number
  minMinute: number
  slotDuration: number
  slotHeight: number
}) {
  const outsideBusinessHourSegments = getOutsideBusinessHourSegmentsForDay(
    day,
    businessHours,
    minMinute,
    maxMinute
  )
  const businessHourSegments = getBusinessHourSegmentsForDay(
    day,
    businessHours,
    minMinute,
    maxMinute
  )
  const blockedSegments = getBlockedSegmentsForDay(
    day,
    blockedRanges,
    minMinute,
    maxMinute
  )

  return (
    <div className="pointer-events-none absolute inset-0">
      {outsideBusinessHourSegments.map((segment) => (
        <div
          key={`outside-${segment.startMinute}-${segment.endMinute}`}
          className="absolute inset-x-0 bg-muted/20"
          style={{
            height:
              ((segment.endMinute - segment.startMinute) / slotDuration) *
              slotHeight,
            top:
              ((segment.startMinute - minMinute) / slotDuration) * slotHeight,
          }}
        />
      ))}
      {businessHourSegments.map((segment) => (
        <div
          key={`business-${segment.startMinute}-${segment.endMinute}`}
          className="absolute inset-x-0 border-y border-primary/10 bg-primary/[0.03]"
          style={{
            height:
              ((segment.endMinute - segment.startMinute) / slotDuration) *
              slotHeight,
            top:
              ((segment.startMinute - minMinute) / slotDuration) * slotHeight,
          }}
        />
      ))}
      {blockedSegments.map((segment) => (
        <div
          key={segment.id}
          className="absolute inset-x-1 rounded-[calc(var(--radius)*0.7)] border"
          style={{
            backgroundColor: `${segment.color ?? "#be185d"}14`,
            borderColor: `${segment.color ?? "#be185d"}33`,
            height:
              ((segment.endMinute - segment.startMinute) / slotDuration) *
              slotHeight,
            top:
              ((segment.startMinute - minMinute) / slotDuration) * slotHeight,
          }}
        >
          {segment.label ? (
            <span
              className="absolute left-2 top-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `${segment.color ?? "#be185d"}22`,
                color: segment.color ?? "#be185d",
              }}
            >
              {segment.label}
            </span>
          ) : null}
        </div>
      ))}
      <div className="absolute inset-0 shadow-[inset_0_1px_0_0_var(--color-border)]" />
      <div
        className="absolute inset-x-0 bottom-0 border-b border-border/50"
        style={{ top: gridHeight - 1 }}
      />
    </div>
  )
}

type AllDayDropZoneProps = {
  classNames?: CalendarClassNames
  day: Date
  density: "comfortable" | "compact"
  events: CalendarOccurrence[]
  getEventColor?: (occurrence: CalendarOccurrence) => string
  hourCycle?: 12 | 24
  interactive: boolean
  locale?: string
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
  timeZone?: string
}

function AllDayDropZone({
  classNames,
  day,
  density,
  events,
  getEventColor,
  hourCycle,
  interactive,
  locale,
  onEventKeyCommand,
  onOpenContextMenu,
  onSelect,
  previewOccurrenceId,
  renderEvent,
  selectedEventId,
  timeZone,
}: AllDayDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `all-day:${day.toISOString()}`,
    data: {
      kind: "all-day",
      day,
    } satisfies CalendarDropTarget,
  })

  return (
    <div
      ref={setNodeRef}
      className={getCalendarSlotClassName(
        classNames,
        "allDayLane",
        cn(
          density === "compact"
            ? "min-h-16 border-r border-border/70 px-2 py-1.5 last:border-r-0"
            : "min-h-18 border-r border-border/70 px-2 py-2 last:border-r-0",
          isOver ? "bg-muted/50" : ""
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
            dragInstanceId={`all-day:${day.toISOString()}:${occurrence.occurrenceId}`}
            event={occurrence}
            interactive={interactive}
            onEventKeyCommand={onEventKeyCommand}
            onOpenContextMenu={onOpenContextMenu}
            onSelect={onSelect}
            preview={previewOccurrenceId === occurrence.occurrenceId}
            renderEvent={renderEvent}
            selected={selectedEventId === occurrence.occurrenceId}
            timeLabel={getEventMetaLabel(occurrence, {
              hourCycle,
              locale,
              timeZone,
            })}
            variant="all-day"
          />
        ))}
      </div>
    </div>
  )
}

type TimeSlotDropZoneProps = {
  blocked: boolean
  classNames?: CalendarClassNames
  day: Date
  draft: CalendarCreateDraft | null
  hourCycle?: 12 | 24
  locale?: string
  minuteOfDay: number
  onBeginCreate: () => void
  onExtendCreate: () => void
}

function TimeSlotDropZone({
  blocked,
  classNames,
  day,
  draft,
  hourCycle,
  locale,
  minuteOfDay,
  onBeginCreate,
  onExtendCreate,
}: TimeSlotDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot:${day.toISOString()}:${minuteOfDay}`,
    data: {
      kind: "slot",
      day,
      minuteOfDay,
    } satisfies CalendarDropTarget,
  })

  return (
    <button
      ref={setNodeRef}
      aria-label={`Create event at ${formatHourLabel(setMinuteOfDay(day, minuteOfDay), {
        hourCycle,
        locale,
      })} on ${formatWeekday(day, {
        locale,
      })}`}
      className={getCalendarSlotClassName(
        classNames,
        "timeGridSlot",
        cn(
          "border-b border-border/50 text-left transition-colors",
          isOver ? "bg-muted/70" : "",
          blocked ? "cursor-not-allowed" : "",
          draft && isSameDay(draft.day, day) ? "cursor-crosshair" : ""
        )
      )}
      onPointerDown={(event) => {
        if (event.button !== 0 || blocked) {
          return
        }

        onBeginCreate()
      }}
      onPointerEnter={onExtendCreate}
      type="button"
    />
  )
}
