import * as React from "react"

import { isSameDay, startOfDay } from "date-fns"

import { cn } from "@/lib/utils"

import type { CalendarCreateDraft } from "../../types"
import {
  formatHourLabel,
  formatMonthDayLabel,
  formatWeekday,
  getAllDayEvents,
  getCalendarSlotClassName,
  getDayLayout,
  getEventMetaLabel,
  getNextVisibleDay,
  getWeekDays,
  isToday,
  parseTimeStringToMinuteOfDay,
  setMinuteOfDay,
  formatDurationLabel,
} from "../../utils"
import { CalendarEventCard, getResolvedAccentColor } from "./event-card"
import {
  type SharedViewProps,
  type TimeGridViewProps,
} from "../shared"
import { AllDayDropZone } from "./time-grid/all-day-drop-zone"
import { TimeGridBackground } from "./time-grid/time-grid-background"
import { TimeGridPreviewLayer } from "./time-grid/time-grid-preview-layer"
import { TimeSlotDropZone } from "./time-grid/time-slot-drop-zone"
import {
  clampGridMinute,
  formatDraftRangeLabel,
  getTimeGridHeaderId,
  getTimeGridPreviewLayout,
  getTimeGridSlotId,
} from "./time-grid/time-grid-utils"
import { useTimeGridNavigation } from "./time-grid/use-time-grid-navigation"

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
  const minMinute = props.minHour * 60
  const maxMinute = props.maxHour * 60
  const totalMinutes = maxMinute - minMinute
  const slotCount = Math.max(1, totalMinutes / props.slotDuration)
  const gridHeight = slotCount * props.slotHeight
  const {
    dayGridRefs,
    focusDayGrid,
    focusedGridDayIndex,
    focusedSlot,
    gridInstructionsId,
    handleGridKeyDown,
    setFocusedGridDayIndex,
    setFocusedSlot,
  } = useTimeGridNavigation({
    days: props.days,
    maxMinute,
    minMinute,
    onEventCreate: props.onEventCreate,
    slotDuration: props.slotDuration,
  })
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
                  {minute % 60 === 0 ? (
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
                  ) : null}
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
            const showTimedSlotDropHighlight = !previewLayout
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
                              showTimedSlotDropHighlight &&
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
                    <TimeGridPreviewLayer
                      column={previewLayout.column}
                      columns={previewLayout.columns}
                      height={previewLayout.height}
                      minMinute={minMinute}
                      slotDuration={props.slotDuration}
                      slotHeight={props.slotHeight}
                      top={previewLayout.top}
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
                          renderEvent={props.renderEvent}
                          selected={
                            props.selectedEventId ===
                            item.occurrence.occurrenceId
                          }
                          shouldSuppressClick={props.shouldSuppressEventClick}
                          showResizeHandles
                          timeLabel={getEventMetaLabel(item.occurrence, {
                            hourCycle: props.hourCycle,
                            locale: props.locale,
                            timeZone: props.timeZone,
                          })}
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
