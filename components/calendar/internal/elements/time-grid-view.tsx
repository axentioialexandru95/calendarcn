"use client"

import * as React from "react"

import { isSameDay, startOfDay } from "date-fns"

import { cn } from "@/lib/utils"

import type {
  CalendarClassNames,
  CalendarCreateDraft,
  CalendarEventRenderer,
  CalendarOccurrence,
} from "../../types"
import {
  formatHourLabel,
  formatDurationLabel,
  formatEventTimeLabel,
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
} from "../../utils"
import {
  CalendarEventCard,
  getResolvedAccentColor,
} from "./event-card"
import {
  type CalendarEventMenuPosition,
  type SharedViewProps,
  type TimeGridViewProps,
} from "../shared"

type FocusedTimeSlot = {
  dayIndex: number
  minuteOfDay: number
}

export const CalendarWeekView = React.memo(function CalendarWeekView(
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
})

export const CalendarDayView = React.memo(function CalendarDayView(
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
})

function CalendarTimeGridView(props: TimeGridViewProps) {
  const [draft, setDraft] = React.useState<CalendarCreateDraft | null>(null)
  const [now, setNow] = React.useState(() => new Date())
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null)
  const dayGridRefs = React.useRef<Array<HTMLDivElement | null>>([])
  const minMinute = props.minHour * 60
  const maxMinute = props.maxHour * 60
  const totalMinutes = maxMinute - minMinute
  const slotCount = Math.max(1, totalMinutes / props.slotDuration)
  const gridHeight = slotCount * props.slotHeight
  const [focusedSlot, setFocusedSlot] = React.useState<FocusedTimeSlot>(() =>
    getDefaultFocusedTimeSlot(props.days, minMinute, maxMinute, props.slotDuration)
  )
  const [focusedGridDayIndex, setFocusedGridDayIndex] = React.useState<
    number | null
  >(null)
  const gridInstructionsId = React.useId()
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

  React.useEffect(() => {
    setFocusedSlot((currentSlot) =>
      normalizeFocusedTimeSlot(
        currentSlot,
        props.days.length,
        minMinute,
        maxMinute,
        props.slotDuration
      )
    )
  }, [maxMinute, minMinute, props.days.length, props.slotDuration])

  const allDayEventsByDay = React.useMemo(() => {
    return new Map(
      props.days.map((day) => [day.getTime(), getAllDayEvents(props.occurrences, day)])
    )
  }, [props.days, props.occurrences])

  const timedLayoutsByDay = React.useMemo(() => {
    return new Map(
      props.days.map((day) => [
        day.getTime(),
        getDayLayout(props.occurrences, day, minMinute, maxMinute),
      ])
    )
  }, [maxMinute, minMinute, props.days, props.occurrences])

  function focusDayGrid(dayIndex: number) {
    requestAnimationFrame(() => {
      dayGridRefs.current[dayIndex]?.focus()
    })
  }

  function handleGridKeyDown(
    dayIndex: number,
    day: Date,
    event: React.KeyboardEvent<HTMLDivElement>
  ) {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return
    }

    const currentMinuteOfDay = clampGridMinute(
      focusedSlot.minuteOfDay,
      minMinute,
      maxMinute,
      props.slotDuration
    )
    const maxDayIndex = Math.max(0, props.days.length - 1)
    let nextDayIndex = dayIndex
    let nextMinuteOfDay = currentMinuteOfDay
    let handled = true

    switch (event.key) {
      case "ArrowUp":
        nextMinuteOfDay = clampGridMinute(
          currentMinuteOfDay - props.slotDuration,
          minMinute,
          maxMinute,
          props.slotDuration
        )
        break
      case "ArrowDown":
        nextMinuteOfDay = clampGridMinute(
          currentMinuteOfDay + props.slotDuration,
          minMinute,
          maxMinute,
          props.slotDuration
        )
        break
      case "ArrowLeft":
        nextDayIndex = Math.max(0, dayIndex - 1)
        break
      case "ArrowRight":
        nextDayIndex = Math.min(maxDayIndex, dayIndex + 1)
        break
      case "Home":
        nextMinuteOfDay = minMinute
        break
      case "End":
        nextMinuteOfDay = clampGridMinute(
          maxMinute - props.slotDuration,
          minMinute,
          maxMinute,
          props.slotDuration
        )
        break
      case "Enter":
      case " ": {
        if (!props.onEventCreate) {
          return
        }

        event.preventDefault()
        const start = setMinuteOfDay(startOfDay(day), currentMinuteOfDay)
        const end = setMinuteOfDay(
          startOfDay(day),
          Math.min(currentMinuteOfDay + props.slotDuration, 1_440)
        )

        props.onEventCreate({
          end,
          start,
        })
        return
      }
      default:
        handled = false
        break
    }

    if (!handled) {
      return
    }

    event.preventDefault()
    setFocusedSlot({
      dayIndex: nextDayIndex,
      minuteOfDay: nextMinuteOfDay,
    })

    if (nextDayIndex !== dayIndex) {
      focusDayGrid(nextDayIndex)
    }
  }

  return (
    <div className="min-h-0 flex-1 overflow-auto" ref={scrollContainerRef}>
      <div className="min-w-4xl">
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
              id={getTimeGridHeaderId(day)}
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
              activeDropTarget={props.activeDropTarget}
              classNames={props.classNames}
              day={day}
              density={props.density}
              dragPreviewOccurrence={props.dragPreviewOccurrence}
              draggingOccurrenceId={props.draggingOccurrenceId}
              events={allDayEventsByDay.get(day.getTime()) ?? []}
              getEventColor={props.getEventColor}
              hourCycle={props.hourCycle}
              interactive={props.interactive}
              locale={props.locale}
              onEventDragPointerDown={props.onEventDragPointerDown}
              onEventKeyCommand={props.onEventKeyCommand}
              onOpenContextMenu={props.onOpenContextMenu}
              onSelect={props.onSelectEvent}
              previewOccurrenceId={props.previewOccurrenceId}
              renderEvent={props.renderEvent}
              selectedEventId={props.selectedEventId}
              shouldSuppressEventClick={props.shouldSuppressEventClick}
              timeZone={props.timeZone}
            />
          ))}
        </div>
        <p className="sr-only" id={gridInstructionsId}>
          Use arrow keys to move the active time slot. Use left and right arrows
          to change days.
          {props.onEventCreate
            ? " Press Enter or Space to create an event at the active slot."
            : ""}
        </p>
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
                    ? (
                        <div className="space-y-0.5 pt-0.5">
                          <p>
                            {formatHourLabel(labelDate, {
                              hourCycle: props.hourCycle,
                              locale: props.locale,
                              timeZone: props.timeZone,
                            })}
                          </p>
                          {props.showSecondaryTimeZone &&
                          props.secondaryTimeZone ? (
                            <p className="text-[10px] text-muted-foreground/80">
                              {formatHourLabel(labelDate, {
                                hourCycle: props.hourCycle,
                                locale: props.locale,
                                timeZone: props.secondaryTimeZone,
                              })}
                            </p>
                          ) : null}
                        </div>
                      )
                    : null}
                </div>
              )
            })}
          </div>
          {props.days.map((day, dayIndex) => {
            const layout = timedLayoutsByDay.get(day.getTime()) ?? []
            const previewLayout = getTimeGridPreviewLayout(
              layout,
              props.dragPreviewOccurrence,
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
            const headerId = getTimeGridHeaderId(day)
            const activeSlotId =
              focusedSlot.dayIndex === dayIndex
                ? getTimeGridSlotId(day, focusedSlot.minuteOfDay)
                : undefined

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
                  aria-activedescendant={activeSlotId}
                  aria-colcount={1}
                  aria-describedby={gridInstructionsId}
                  aria-labelledby={headerId}
                  aria-rowcount={slotCount}
                  className="relative h-full outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/35"
                  onBlur={(event) => {
                    if (
                      event.relatedTarget instanceof Node &&
                      event.currentTarget.contains(event.relatedTarget)
                    ) {
                      return
                    }

                    setFocusedGridDayIndex((currentIndex) =>
                      currentIndex === dayIndex ? null : currentIndex
                    )
                  }}
                  onFocus={() => {
                    setFocusedGridDayIndex(dayIndex)
                    setFocusedSlot((currentSlot) => ({
                      dayIndex,
                      minuteOfDay: clampGridMinute(
                        currentSlot.minuteOfDay,
                        minMinute,
                        maxMinute,
                        props.slotDuration
                      ),
                    }))
                  }}
                  onKeyDown={(event) => handleGridKeyDown(dayIndex, day, event)}
                  ref={(element) => {
                    dayGridRefs.current[dayIndex] = element
                  }}
                  role="grid"
                  style={{
                    height: gridHeight,
                  }}
                  tabIndex={focusedSlot.dayIndex === dayIndex ? 0 : -1}
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
                        <div
                          key={`${day.toISOString()}-${minuteOfDay}`}
                          role="row"
                        >
                          <TimeSlotDropZone
                            active={
                              focusedSlot.dayIndex === dayIndex &&
                              focusedSlot.minuteOfDay === minuteOfDay
                            }
                            blocked={
                              props.blockedRanges?.some((range) =>
                                slotStart.getTime() < range.end.getTime() &&
                                slotEnd.getTime() > range.start.getTime()
                              ) ?? false
                            }
                            classNames={props.classNames}
                            day={day}
                            draft={draft}
                            focusVisible={focusedGridDayIndex === dayIndex}
                            hourCycle={props.hourCycle}
                            isDragTarget={
                              props.activeDropTarget?.kind === "slot" &&
                              props.activeDropTarget.day.getTime() === day.getTime() &&
                              props.activeDropTarget.minuteOfDay === minuteOfDay
                            }
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
                            onFocusCell={() => {
                              setFocusedGridDayIndex(dayIndex)
                              setFocusedSlot({
                                dayIndex,
                                minuteOfDay,
                              })
                              focusDayGrid(dayIndex)
                            }}
                            slotId={getTimeGridSlotId(day, minuteOfDay)}
                            timeZone={props.timeZone}
                          />
                        </div>
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
                    >
                      {props.showCreatePreviewMeta ? (
                        <span className="absolute left-2 top-2 rounded-full bg-background/95 px-2 py-0.5 text-[10px] font-medium text-foreground shadow-xs">
                          {formatDraftRangeLabel(draft, {
                            day,
                            hourCycle: props.hourCycle,
                            locale: props.locale,
                            slotDuration: props.slotDuration,
                            timeZone: props.timeZone,
                          })}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  {previewLayout ? (
                    <div
                      className="pointer-events-none absolute z-10 px-1"
                      style={{
                        top:
                          ((previewLayout.top - minMinute) / props.slotDuration) *
                          props.slotHeight,
                        height: Math.max(
                          props.slotHeight - 4,
                          (previewLayout.height / props.slotDuration) *
                            props.slotHeight
                        ),
                        left: `calc(${(previewLayout.column * 100) / previewLayout.columns}% + 0px)`,
                        width: `calc(${100 / previewLayout.columns}% - 0px)`,
                      }}
                    >
                      <div className="h-full rounded-[min(var(--radius-sm),4px)] border border-dashed border-foreground/18 bg-foreground/8 shadow-sm dark:border-white/12 dark:bg-white/8" />
                    </div>
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
                          dragging={
                            props.draggingOccurrenceId === item.occurrence.occurrenceId
                          }
                          event={item.occurrence}
                          interactive={props.interactive}
                          onDragPointerDown={props.onEventDragPointerDown}
                          onEventKeyCommand={props.onEventKeyCommand}
                          onResizeHandlePointerDown={
                            props.onResizeHandlePointerDown
                          }
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
                          shouldSuppressClick={props.shouldSuppressEventClick}
                          previewMetaLabel={
                            props.showDragPreviewMeta &&
                            props.previewOccurrenceId === item.occurrence.occurrenceId
                              ? formatDurationLabel(
                                  item.occurrence.start,
                                  item.occurrence.end,
                                  item.occurrence.allDay
                                )
                              : undefined
                          }
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
          className="absolute inset-x-0 border-y border-primary/10 bg-primary/3"
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
  activeDropTarget?: TimeGridViewProps["activeDropTarget"]
  classNames?: CalendarClassNames
  day: Date
  density: "comfortable" | "compact"
  dragPreviewOccurrence?: CalendarOccurrence
  draggingOccurrenceId?: string
  events: CalendarOccurrence[]
  getEventColor?: (occurrence: CalendarOccurrence) => string
  hourCycle?: 12 | 24
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
  previewOccurrenceId?: string
  renderEvent?: CalendarEventRenderer
  selectedEventId?: string
  shouldSuppressEventClick?: (occurrenceId: string) => boolean
  timeZone?: string
}

function AllDayDropZone({
  activeDropTarget,
  classNames,
  day,
  density,
  dragPreviewOccurrence,
  draggingOccurrenceId,
  events,
  getEventColor,
  hourCycle,
  interactive,
  locale,
  onEventDragPointerDown,
  onEventKeyCommand,
  onOpenContextMenu,
  onSelect,
  previewOccurrenceId,
  renderEvent,
  selectedEventId,
  shouldSuppressEventClick,
  timeZone,
}: AllDayDropZoneProps) {
  const previewEvents = dragPreviewOccurrence
    ? getAllDayEvents([dragPreviewOccurrence], day)
    : []
  const isDragTarget =
    activeDropTarget?.kind === "all-day" &&
    activeDropTarget.day.getTime() === day.getTime()

  return (
    <div
      data-calendar-drop-target-day={day.toISOString()}
      data-calendar-drop-target-kind="all-day"
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
            dragging={draggingOccurrenceId === occurrence.occurrenceId}
            event={occurrence}
            interactive={interactive}
            onDragPointerDown={onEventDragPointerDown}
            onEventKeyCommand={onEventKeyCommand}
            onOpenContextMenu={onOpenContextMenu}
            onSelect={onSelect}
            preview={previewOccurrenceId === occurrence.occurrenceId}
            previewMetaLabel={
              density === "compact" &&
              previewOccurrenceId === occurrence.occurrenceId
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
        ))}
        {previewEvents.map((occurrence) => (
          <div
            key={`preview-${occurrence.occurrenceId}`}
            className={cn(
              "pointer-events-none rounded-[min(var(--radius-sm),4px)] border border-dashed border-foreground/18 bg-foreground/8 shadow-sm dark:border-white/12 dark:bg-white/8",
              density === "compact" ? "h-6" : "h-7"
            )}
          />
        ))}
      </div>
    </div>
  )
}

function formatDraftRangeLabel(
  draft: CalendarCreateDraft,
  options: {
    day: Date
    hourCycle?: 12 | 24
    locale?: string
    slotDuration: number
    timeZone?: string
  }
) {
  const startMinute = Math.min(draft.startMinute, draft.endMinute)
  const endMinute = Math.max(draft.startMinute, draft.endMinute)
  const start = setMinuteOfDay(startOfDay(options.day), startMinute)
  const end = setMinuteOfDay(
    startOfDay(options.day),
    Math.min(endMinute + options.slotDuration, 1_440)
  )

  return `${formatEventTimeLabel(start, end, {
    hourCycle: options.hourCycle,
    locale: options.locale,
    timeZone: options.timeZone,
  })} · ${formatDurationLabel(start, end)}`
}

function getTimeGridPreviewLayout(
  layout: ReturnType<typeof getDayLayout>,
  previewOccurrence: CalendarOccurrence | undefined,
  day: Date,
  minMinute: number,
  maxMinute: number
) {
  if (!previewOccurrence || previewOccurrence.allDay) {
    return null
  }

  const previewLayout = getDayLayout(
    [
      ...layout
        .map((item) => item.occurrence)
        .filter(
          (occurrence) =>
            occurrence.occurrenceId !== previewOccurrence.occurrenceId
        ),
      previewOccurrence,
    ],
    day,
    minMinute,
    maxMinute
  )

  return (
    previewLayout.find(
      (item) => item.occurrence.occurrenceId === previewOccurrence.occurrenceId
    ) ?? null
  )
}

type TimeSlotDropZoneProps = {
  active: boolean
  blocked: boolean
  classNames?: CalendarClassNames
  day: Date
  draft: CalendarCreateDraft | null
  focusVisible: boolean
  hourCycle?: 12 | 24
  isDragTarget: boolean
  locale?: string
  minuteOfDay: number
  onBeginCreate: () => void
  onExtendCreate: () => void
  onFocusCell: () => void
  slotId: string
  timeZone?: string
}

function TimeSlotDropZone({
  active,
  blocked,
  classNames,
  day,
  draft,
  focusVisible,
  hourCycle,
  isDragTarget,
  locale,
  minuteOfDay,
  onBeginCreate,
  onExtendCreate,
  onFocusCell,
  slotId,
  timeZone,
}: TimeSlotDropZoneProps) {
  return (
    <div
      aria-disabled={blocked || undefined}
      aria-label={formatTimeGridSlotLabel(day, minuteOfDay, {
        blocked,
        hourCycle,
        locale,
        timeZone,
      })}
      aria-selected={active}
      data-calendar-drop-target-day={day.toISOString()}
      data-calendar-drop-target-kind="slot"
      data-calendar-drop-target-minute={minuteOfDay}
      id={slotId}
      className={getCalendarSlotClassName(
        classNames,
        "timeGridSlot",
        cn(
          "h-full border-b border-border/50 text-left transition-colors",
          isDragTarget ? "bg-muted/70" : "",
          active && focusVisible ? "bg-primary/8 ring-2 ring-inset ring-primary/35" : "",
          blocked ? "cursor-not-allowed" : "",
          draft && isSameDay(draft.day, day) ? "cursor-crosshair" : ""
        )
      )}
      onPointerDownCapture={onFocusCell}
      onPointerDown={(event) => {
        if (event.button !== 0 || blocked) {
          return
        }

        onBeginCreate()
      }}
      onPointerEnter={onExtendCreate}
      role="gridcell"
    />
  )
}

function getDefaultFocusedTimeSlot(
  days: Date[],
  minMinute: number,
  maxMinute: number,
  slotDuration: number
): FocusedTimeSlot {
  const today = new Date()
  const todayIndex = days.findIndex((day) => isSameDay(day, today))
  const currentMinuteOfDay = today.getHours() * 60 + today.getMinutes()

  return {
    dayIndex: todayIndex >= 0 ? todayIndex : 0,
    minuteOfDay: clampGridMinute(
      currentMinuteOfDay,
      minMinute,
      maxMinute,
      slotDuration
    ),
  }
}

function normalizeFocusedTimeSlot(
  focusedSlot: FocusedTimeSlot,
  dayCount: number,
  minMinute: number,
  maxMinute: number,
  slotDuration: number
): FocusedTimeSlot {
  return {
    dayIndex: Math.min(Math.max(focusedSlot.dayIndex, 0), Math.max(dayCount - 1, 0)),
    minuteOfDay: clampGridMinute(
      focusedSlot.minuteOfDay,
      minMinute,
      maxMinute,
      slotDuration
    ),
  }
}

function clampGridMinute(
  minuteOfDay: number,
  minMinute: number,
  maxMinute: number,
  slotDuration: number
) {
  const maxSlotMinute = Math.max(minMinute, maxMinute - slotDuration)
  const normalizedMinute = Math.max(minMinute, Math.min(maxSlotMinute, minuteOfDay))
  const roundedOffset = Math.round((normalizedMinute - minMinute) / slotDuration)

  return minMinute + roundedOffset * slotDuration
}

function getTimeGridHeaderId(day: Date) {
  return `calendar-time-grid-heading-${day.getTime()}`
}

function getTimeGridSlotId(day: Date, minuteOfDay: number) {
  return `calendar-time-grid-slot-${day.getTime()}-${minuteOfDay}`
}

function formatTimeGridSlotLabel(
  day: Date,
  minuteOfDay: number,
  options: {
    blocked: boolean
    hourCycle?: 12 | 24
    locale?: string
    timeZone?: string
  }
) {
  return `${formatWeekday(day, {
    locale: options.locale,
    timeZone: options.timeZone,
  })} ${formatMonthDayLabel(day, {
    locale: options.locale,
    timeZone: options.timeZone,
  })} at ${formatHourLabel(setMinuteOfDay(day, minuteOfDay), {
    hourCycle: options.hourCycle,
    locale: options.locale,
    timeZone: options.timeZone,
  })}${options.blocked ? ", unavailable" : ""}`
}
