"use client"

import * as React from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import {
  CaretLeft,
  CaretRight,
  Columns,
  ListBullets,
  Plus,
  Rows,
  SquaresFour,
} from "@phosphor-icons/react"
import {
  addDays,
  addMinutes,
  eachDayOfInterval,
  format,
  isSameDay,
  startOfDay,
} from "date-fns"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { calendarViews } from "./types"
import type {
  CalendarClassNames,
  CalendarCreateDraft,
  CalendarCreateOperation,
  CalendarDragData,
  CalendarDropTarget,
  CalendarEvent,
  CalendarEventRenderer,
  CalendarMoveOperation,
  CalendarOccurrence,
  CalendarResizeOperation,
  CalendarResource,
  CalendarView,
  CalendarWeekday,
} from "./types"
import {
  clampResize,
  copyTimeParts,
  expandOccurrences,
  formatAgendaEyebrow,
  formatAgendaHeading,
  formatDayNumber,
  formatWeekday,
  getAllDayEvents,
  getCalendarSlotClassName,
  getDayEvents,
  getDayLayout,
  getDaySpan,
  getEventMetaLabel,
  getMonthDays,
  getOccurrenceAccentColor,
  getRangeLabel,
  getVisibleRange,
  getWeekDays,
  isOutsideMonth,
  isToday,
  setMinuteOfDay,
  shiftDate,
} from "./utils"

const viewLabels: Record<CalendarView, string> = {
  month: "Month",
  week: "Week",
  day: "Day",
  agenda: "Agenda",
}

const viewIcons: Record<CalendarView, React.ComponentType<{ className?: string }>> = {
  month: SquaresFour,
  week: Columns,
  day: Rows,
  agenda: ListBullets,
}

const slotHeight = 30
const defaultSlotDuration = 30
const defaultMinHour = 6
const defaultMaxHour = 23
const maxMonthEvents = 4

type CalendarRootProps = {
  date: Date
  events: CalendarEvent[]
  view: CalendarView
  onDateChange: (date: Date) => void
  onViewChange: (view: CalendarView) => void
  onNavigate?: (direction: -1 | 1) => void
  onToday?: () => void
  onEventMove?: (operation: CalendarMoveOperation) => void
  onEventResize?: (operation: CalendarResizeOperation) => void
  onEventCreate?: (operation: CalendarCreateOperation) => void
  onEventSelect?: (occurrence: CalendarOccurrence) => void
  onSelectedEventChange?: (id?: string) => void
  selectedEventId?: string
  timeZone?: string
  resources?: CalendarResource[]
  classNames?: CalendarClassNames
  weekStartsOn?: CalendarWeekday
  agendaDays?: number
  slotDuration?: number
  minHour?: number
  maxHour?: number
  renderEvent?: CalendarEventRenderer
  getEventColor?: (occurrence: CalendarOccurrence) => string
}

type CalendarToolbarProps = {
  classNames?: CalendarClassNames
  currentLabel: string
  onNavigate: (direction: -1 | 1) => void
  onQuickCreate?: () => void
  onToday: () => void
  onViewChange: (view: CalendarView) => void
  resources?: CalendarResource[]
  timeZone?: string
  view: CalendarView
}

type SharedViewProps = {
  anchorDate: Date
  classNames?: CalendarClassNames
  getEventColor?: (occurrence: CalendarOccurrence) => string
  interactive: boolean
  occurrences: CalendarOccurrence[]
  onEventCreate?: (operation: CalendarCreateOperation) => void
  onEventKeyCommand: (
    occurrence: CalendarOccurrence,
    event: React.KeyboardEvent<HTMLButtonElement>
  ) => void
  onSelectEvent: (occurrence: CalendarOccurrence) => void
  renderEvent?: CalendarEventRenderer
  selectedEventId?: string
  slotDuration: number
  timeZone?: string
  weekStartsOn: CalendarWeekday
}

type EventVariant = "month" | "all-day" | "time-grid" | "agenda" | "overlay"

export function CalendarRoot({
  agendaDays = 14,
  classNames,
  date,
  events,
  getEventColor,
  maxHour = defaultMaxHour,
  minHour = defaultMinHour,
  onDateChange,
  onEventCreate,
  onEventMove,
  onEventResize,
  onEventSelect,
  onNavigate,
  onSelectedEventChange,
  onToday,
  onViewChange,
  renderEvent,
  resources,
  selectedEventId,
  slotDuration = defaultSlotDuration,
  timeZone,
  view,
  weekStartsOn = 1,
}: CalendarRootProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    })
  )
  const deferredEvents = React.useDeferredValue(events)
  const range = getVisibleRange(date, view, {
    agendaDays,
    weekStartsOn,
  })
  const occurrences = expandOccurrences(deferredEvents, range)
  const [isHydrated, setIsHydrated] = React.useState(false)
  const [activeDrag, setActiveDrag] = React.useState<CalendarDragData | null>(null)
  const [liveAnnouncement, setLiveAnnouncement] = React.useState("")

  React.useEffect(() => {
    setIsHydrated(true)
  }, [])

  function announce(message: string) {
    setLiveAnnouncement(message)
  }

  function handleSelectEvent(occurrence: CalendarOccurrence) {
    onSelectedEventChange?.(occurrence.sourceEventId)
    onEventSelect?.(occurrence)
  }

  function handleNavigate(direction: -1 | 1) {
    if (onNavigate) {
      onNavigate(direction)
      return
    }

    onDateChange(shiftDate(date, view, direction))
  }

  function handleToday() {
    if (onToday) {
      onToday()
      return
    }

    onDateChange(new Date())
  }

  function handleQuickCreate() {
    if (!onEventCreate) {
      return
    }

    const start = setMinuteOfDay(startOfDay(date), Math.max(minHour * 60, 9 * 60))

    onEventCreate({
      start,
      end: addMinutes(start, 60),
    })
    announce("Created a new one-hour event.")
  }

  function moveOccurrenceWithTarget(
    occurrence: CalendarOccurrence,
    target: CalendarDropTarget
  ) {
    if (!onEventMove) {
      return
    }

    const durationMs = occurrence.end.getTime() - occurrence.start.getTime()
    let nextStart: Date
    let nextEnd: Date
    let allDay = occurrence.allDay

    if (target.kind === "slot") {
      nextStart = setMinuteOfDay(startOfDay(target.day), target.minuteOfDay)
      nextEnd = new Date(nextStart.getTime() + durationMs)
      allDay = false
    } else {
      allDay = target.kind === "all-day" || occurrence.allDay

      if (allDay) {
        nextStart = startOfDay(target.day)
        nextEnd = addDays(nextStart, getDaySpan(occurrence))
      } else {
        nextStart = copyTimeParts(startOfDay(target.day), occurrence.start)
        nextEnd = new Date(nextStart.getTime() + durationMs)
      }
    }

    onEventMove({
      occurrence,
      nextStart,
      nextEnd,
      previousStart: occurrence.start,
      previousEnd: occurrence.end,
      allDay,
    })
    announce(`Moved ${occurrence.title}.`)
  }

  function resizeOccurrenceWithTarget(
    occurrence: CalendarOccurrence,
    edge: "start" | "end",
    target: CalendarDropTarget
  ) {
    if (!onEventResize) {
      return
    }

    const rawDate =
      target.kind === "slot"
        ? setMinuteOfDay(startOfDay(target.day), target.minuteOfDay)
        : startOfDay(target.day)
    const minimumMinutes = slotDuration

    if (edge === "start") {
      const nextStart = clampResize(rawDate, occurrence.end, "start", minimumMinutes)

      onEventResize({
        occurrence,
        edge,
        nextStart,
        nextEnd: occurrence.end,
        previousStart: occurrence.start,
        previousEnd: occurrence.end,
      })
    } else {
      const adjustedEnd =
        target.kind === "slot" ? addMinutes(rawDate, slotDuration) : addDays(rawDate, 1)
      const nextEnd = clampResize(adjustedEnd, occurrence.start, "end", minimumMinutes)

      onEventResize({
        occurrence,
        edge,
        nextStart: occurrence.start,
        nextEnd,
        previousStart: occurrence.start,
        previousEnd: occurrence.end,
      })
    }

    announce(`Resized ${occurrence.title}.`)
  }

  function handleDragStart(event: DragStartEvent) {
    const dragData = event.active.data.current as CalendarDragData | undefined

    if (!dragData) {
      return
    }

    setActiveDrag(dragData)
  }

  function handleDragEnd(event: DragEndEvent) {
    const dragData = event.active.data.current as CalendarDragData | undefined
    const target = event.over?.data.current as CalendarDropTarget | undefined

    setActiveDrag(null)

    if (!dragData || !target) {
      return
    }

    if (dragData.kind === "event") {
      moveOccurrenceWithTarget(dragData.occurrence, target)
      return
    }

    resizeOccurrenceWithTarget(dragData.occurrence, dragData.edge, target)
  }

  function handleEventKeyCommand(
    occurrence: CalendarOccurrence,
    event: React.KeyboardEvent<HTMLButtonElement>
  ) {
    const dayDelta =
      event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0
    const minuteDelta =
      event.key === "ArrowUp"
        ? -slotDuration
        : event.key === "ArrowDown"
          ? slotDuration
          : 0

    if (dayDelta === 0 && minuteDelta === 0) {
      return
    }

    event.preventDefault()

    if (event.shiftKey && onEventResize) {
      const nextEnd = addMinutes(addDays(occurrence.end, dayDelta), minuteDelta)

      onEventResize({
        occurrence,
        edge: "end",
        nextStart: occurrence.start,
        nextEnd: clampResize(nextEnd, occurrence.start, "end", slotDuration),
        previousStart: occurrence.start,
        previousEnd: occurrence.end,
      })
      announce(`Extended ${occurrence.title}.`)
      return
    }

    if (event.altKey && onEventResize) {
      const nextStart = addMinutes(addDays(occurrence.start, dayDelta), minuteDelta)

      onEventResize({
        occurrence,
        edge: "start",
        nextStart: clampResize(nextStart, occurrence.end, "start", slotDuration),
        nextEnd: occurrence.end,
        previousStart: occurrence.start,
        previousEnd: occurrence.end,
      })
      announce(`Adjusted the start of ${occurrence.title}.`)
      return
    }

    if (!onEventMove) {
      return
    }

    const nextStart = addMinutes(addDays(occurrence.start, dayDelta), minuteDelta)
    const nextEnd = addMinutes(addDays(occurrence.end, dayDelta), minuteDelta)

    onEventMove({
      occurrence,
      nextStart,
      nextEnd,
      previousStart: occurrence.start,
      previousEnd: occurrence.end,
      allDay: occurrence.allDay,
    })
    announce(`Moved ${occurrence.title}.`)
  }

  const currentLabel = getRangeLabel(date, view, {
    agendaDays,
    weekStartsOn,
  })
  const sharedViewProps: SharedViewProps = {
    anchorDate: date,
    classNames,
    getEventColor,
    interactive: isHydrated,
    occurrences,
    onEventCreate,
    onEventKeyCommand: handleEventKeyCommand,
    onSelectEvent: handleSelectEvent,
    renderEvent,
    selectedEventId,
    slotDuration,
    timeZone,
    weekStartsOn,
  }

  return (
    <div
      className={getCalendarSlotClassName(
        classNames,
        "root",
        "flex min-h-[42rem] flex-col overflow-hidden rounded-[calc(var(--radius)*1.6)] border border-border/70 bg-background/90 shadow-[0_20px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur"
      )}
    >
      <CalendarToolbar
        classNames={classNames}
        currentLabel={currentLabel}
        onNavigate={handleNavigate}
        onQuickCreate={onEventCreate ? handleQuickCreate : undefined}
        onToday={handleToday}
        onViewChange={onViewChange}
        resources={resources}
        timeZone={timeZone}
        view={view}
      />
      <DndContext
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <div
          className={getCalendarSlotClassName(
            classNames,
            "shell",
            "flex min-h-0 flex-1 flex-col bg-background"
          )}
        >
          {view === "month" ? (
            <CalendarMonthView {...sharedViewProps} />
          ) : null}
          {view === "week" ? (
            <CalendarWeekView
              {...sharedViewProps}
              maxHour={maxHour}
              minHour={minHour}
            />
          ) : null}
          {view === "day" ? (
            <CalendarDayView
              {...sharedViewProps}
              maxHour={maxHour}
              minHour={minHour}
            />
          ) : null}
          {view === "agenda" ? (
            <CalendarAgendaView
              {...sharedViewProps}
              range={getVisibleRange(date, "agenda", {
                agendaDays,
              })}
            />
          ) : null}
        </div>
        <DragOverlay>
          {activeDrag ? (
            <EventSurface
              accentColor={getResolvedAccentColor(activeDrag.occurrence, getEventColor)}
              className={getCalendarSlotClassName(
                classNames,
                "dragOverlay",
                "w-64 max-w-[80vw]"
              )}
              event={activeDrag.occurrence}
              renderEvent={renderEvent}
              timeLabel={getEventMetaLabel(activeDrag.occurrence, timeZone)}
              variant="overlay"
            />
          ) : null}
        </DragOverlay>
      </DndContext>
      <p aria-live="polite" className="sr-only">
        {liveAnnouncement}
      </p>
    </div>
  )
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
            <CaretLeft className="size-4" />
          </Button>
          <Button
            aria-label="Next range"
            onClick={() => onNavigate(1)}
            size="icon-sm"
            variant="ghost"
          >
            <CaretRight className="size-4" />
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
                  className={getCalendarSlotClassName(classNames, "viewButton")}
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
              <Plus className="size-4" />
              New event
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function CalendarMonthView(props: SharedViewProps) {
  const days = getMonthDays(props.anchorDate, props.weekStartsOn)

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="min-w-[48rem]">
        <div className="grid grid-cols-7 border-b border-border/70">
          {days.slice(0, 7).map((day) => (
            <div
              key={`month-heading-${day.toISOString()}`}
              className="px-3 py-2 text-xs uppercase tracking-[0.24em] text-muted-foreground"
            >
              {format(day, "EEE")}
            </div>
          ))}
        </div>
        <div
          className={getCalendarSlotClassName(
            props.classNames,
            "monthGrid",
            "grid grid-cols-7"
          )}
        >
          {days.map((day) => (
            <MonthDayCell key={day.toISOString()} day={day} {...props} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function CalendarWeekView(
  props: SharedViewProps & {
    minHour: number
    maxHour: number
  }
) {
  return (
    <CalendarTimeGridView
      {...props}
      days={getWeekDays(props.anchorDate, props.weekStartsOn)}
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
      days={[startOfDay(props.anchorDate)]}
    />
  )
}

export function CalendarAgendaView(
  props: SharedViewProps & {
    range: {
      start: Date
      end: Date
    }
  }
) {
  const days = eachDayOfInterval(props.range)

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div
        className={getCalendarSlotClassName(
          props.classNames,
          "agendaList",
          "min-w-[22rem] divide-y divide-border/70"
        )}
      >
        {days.map((day) => {
          return (
            <AgendaDayGroup
              key={day.toISOString()}
              classNames={props.classNames}
              day={day}
              events={getDayEvents(props.occurrences, day)}
              getEventColor={props.getEventColor}
              interactive={props.interactive}
              onEventKeyCommand={props.onEventKeyCommand}
              onSelect={props.onSelectEvent}
              renderEvent={props.renderEvent}
              selectedEventId={props.selectedEventId}
              timeZone={props.timeZone}
            />
          )
        })}
      </div>
    </div>
  )
}

function CalendarTimeGridView(
  props: SharedViewProps & {
    days: Date[]
    minHour: number
    maxHour: number
  }
) {
  const [draft, setDraft] = React.useState<CalendarCreateDraft | null>(null)
  const minMinute = props.minHour * 60
  const maxMinute = props.maxHour * 60
  const totalMinutes = maxMinute - minMinute
  const slotCount = Math.max(1, totalMinutes / props.slotDuration)
  const gridHeight = slotCount * slotHeight
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

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="min-w-[56rem]">
        <div
          className="grid border-b border-border/70"
          style={{
            gridTemplateColumns: `4.5rem repeat(${props.days.length}, minmax(0, 1fr))`,
          }}
        >
          <div className="border-r border-border/70 px-3 py-3 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            Time
          </div>
          {props.days.map((day) => (
            <div
              key={`header-${day.toISOString()}`}
              className={getCalendarSlotClassName(
                props.classNames,
                "timeGridHeader",
                "border-r border-border/70 px-3 py-3 last:border-r-0"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                    {formatWeekday(day)}
                  </p>
                  <p className="text-sm font-medium">{format(day, "MMM d")}</p>
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
          <div className="border-r border-border/70 px-3 py-3 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
            All day
          </div>
          {props.days.map((day) => (
            <AllDayDropZone
              key={`all-day-${day.toISOString()}`}
              classNames={props.classNames}
              day={day}
              events={getAllDayEvents(props.occurrences, day)}
              getEventColor={props.getEventColor}
              interactive={props.interactive}
              onEventKeyCommand={props.onEventKeyCommand}
              onSelect={props.onSelectEvent}
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
              const labelDate = setMinuteOfDay(startOfDay(props.days[0]), minute)

              return (
                <div
                  key={`time-label-${minute}`}
                  className="border-b border-border/50 px-3 text-[11px] text-muted-foreground"
                  style={{
                    height: slotHeight,
                  }}
                >
                  {minute % 60 === 0 ? format(labelDate, "ha") : null}
                </div>
              )
            })}
          </div>
          {props.days.map((day) => {
            const layout = getDayLayout(props.occurrences, day, minMinute, maxMinute)

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
                  <div
                    className="absolute inset-0 grid"
                    style={{
                      gridTemplateRows: `repeat(${slotCount}, ${slotHeight}px)`,
                    }}
                  >
                    {Array.from({ length: slotCount }).map((_, index) => {
                      const minuteOfDay = minMinute + index * props.slotDuration

                      return (
                        <TimeSlotDropZone
                          key={`${day.toISOString()}-${minuteOfDay}`}
                          classNames={props.classNames}
                          day={day}
                          draft={draft}
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
                          ((Math.min(draft.startMinute, draft.endMinute) - minMinute) /
                            props.slotDuration) *
                          slotHeight,
                        height:
                          ((Math.abs(draft.endMinute - draft.startMinute) +
                            props.slotDuration) /
                            props.slotDuration) *
                          slotHeight,
                      }}
                    />
                  ) : null}
                  {layout.map((item, index) => {
                    const width = 100 / item.columns
                    const left = item.column * width

                    return (
                      <div
                        key={item.occurrence.occurrenceId}
                        className="absolute px-1"
                        style={{
                          top: ((item.top - minMinute) / props.slotDuration) * slotHeight,
                          height: Math.max(
                            slotHeight - 4,
                            (item.height / props.slotDuration) * slotHeight
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
                          event={item.occurrence}
                          interactive={props.interactive}
                          onEventKeyCommand={props.onEventKeyCommand}
                          onSelect={props.onSelectEvent}
                          renderEvent={props.renderEvent}
                          selected={
                            props.selectedEventId === item.occurrence.sourceEventId
                          }
                          showResizeHandles
                          timeLabel={getEventMetaLabel(item.occurrence, props.timeZone)}
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

type MonthDayCellProps = SharedViewProps & {
  day: Date
}

function MonthDayCell({
  anchorDate,
  classNames,
  day,
  getEventColor,
  interactive,
  occurrences,
  onEventKeyCommand,
  onSelectEvent,
  renderEvent,
  selectedEventId,
  timeZone,
}: MonthDayCellProps) {
  const events = getDayEvents(occurrences, day)
  const visibleEvents = events.slice(0, maxMonthEvents)
  const remainingEvents = events.length - visibleEvents.length
  const { setNodeRef, isOver } = useDroppable({
    id: `month:${day.toISOString()}`,
    data: {
      kind: "day",
      day,
    } satisfies CalendarDropTarget,
  })

  return (
    <section
      ref={setNodeRef}
      className={getCalendarSlotClassName(
        classNames,
        isOutsideMonth(day, anchorDate) ? "monthCellMuted" : "monthCell",
        cn(
          "flex min-h-[10.5rem] flex-col gap-2 border-r border-b border-border/70 px-2 py-2 transition-colors",
          isOver ? "bg-muted/50" : "",
          isOutsideMonth(day, anchorDate) ? "bg-muted/25" : "bg-background"
        )
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          {formatWeekday(day)}
        </span>
        <span
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-full text-sm font-medium",
            isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground"
          )}
        >
          {formatDayNumber(day)}
        </span>
      </div>
      <div className="space-y-1">
        {visibleEvents.map((occurrence, index) => (
          <CalendarEventCard
            key={occurrence.occurrenceId}
            accentColor={getResolvedAccentColor(occurrence, getEventColor, index)}
            classNames={classNames}
            event={occurrence}
            interactive={interactive}
            onEventKeyCommand={onEventKeyCommand}
            onSelect={onSelectEvent}
            renderEvent={renderEvent}
            selected={selectedEventId === occurrence.sourceEventId}
            timeLabel={getEventMetaLabel(occurrence, timeZone)}
            variant="month"
          />
        ))}
        {remainingEvents > 0 ? (
          <p className="px-1 text-xs text-muted-foreground">
            +{remainingEvents} more
          </p>
        ) : null}
      </div>
    </section>
  )
}

type AllDayDropZoneProps = {
  classNames?: CalendarClassNames
  day: Date
  events: CalendarOccurrence[]
  getEventColor?: (occurrence: CalendarOccurrence) => string
  interactive: boolean
  onEventKeyCommand: (
    occurrence: CalendarOccurrence,
    event: React.KeyboardEvent<HTMLButtonElement>
  ) => void
  onSelect: (occurrence: CalendarOccurrence) => void
  renderEvent?: CalendarEventRenderer
  selectedEventId?: string
  timeZone?: string
}

function AllDayDropZone({
  classNames,
  day,
  events,
  getEventColor,
  interactive,
  onEventKeyCommand,
  onSelect,
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
          "min-h-18 border-r border-border/70 px-2 py-2 last:border-r-0",
          isOver ? "bg-muted/50" : ""
        )
      )}
    >
      <div className="space-y-1">
        {events.map((occurrence, index) => (
          <CalendarEventCard
            key={occurrence.occurrenceId}
            accentColor={getResolvedAccentColor(occurrence, getEventColor, index)}
            classNames={classNames}
            event={occurrence}
            interactive={interactive}
            onEventKeyCommand={onEventKeyCommand}
            onSelect={onSelect}
            renderEvent={renderEvent}
            selected={selectedEventId === occurrence.sourceEventId}
            timeLabel={getEventMetaLabel(occurrence, timeZone)}
            variant="all-day"
          />
        ))}
      </div>
    </div>
  )
}

type TimeSlotDropZoneProps = {
  classNames?: CalendarClassNames
  day: Date
  draft: CalendarCreateDraft | null
  minuteOfDay: number
  onBeginCreate: () => void
  onExtendCreate: () => void
}

function TimeSlotDropZone({
  classNames,
  day,
  draft,
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
      aria-label={`Create event at ${format(setMinuteOfDay(day, minuteOfDay), "p")} on ${format(day, "EEEE")}`}
      className={getCalendarSlotClassName(
        classNames,
        "timeGridSlot",
        cn(
          "border-b border-border/50 text-left transition-colors",
          isOver ? "bg-muted/70" : "",
          draft && isSameDay(draft.day, day) ? "cursor-crosshair" : ""
        )
      )}
      onPointerDown={(event) => {
        if (event.button !== 0) {
          return
        }

        onBeginCreate()
      }}
      onPointerEnter={onExtendCreate}
      type="button"
    />
  )
}

type CalendarEventCardProps = {
  accentColor: string
  classNames?: CalendarClassNames
  event: CalendarOccurrence
  interactive: boolean
  onEventKeyCommand: (
    occurrence: CalendarOccurrence,
    event: React.KeyboardEvent<HTMLButtonElement>
  ) => void
  onSelect: (occurrence: CalendarOccurrence) => void
  renderEvent?: CalendarEventRenderer
  selected?: boolean
  showResizeHandles?: boolean
  timeLabel: string
  variant: EventVariant
}

function CalendarEventCard({
  accentColor,
  classNames,
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
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `event:${event.occurrenceId}`,
    data: {
      kind: "event",
      occurrence: event,
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
        className={getSlotClassNameForEvent(classNames, variant, selected, isDragging)}
        event={event}
        isDragging={isDragging}
        listeners={dragEnabled ? listeners : undefined}
        onKeyDown={(keyEvent) => onEventKeyCommand(event, keyEvent)}
        onSelect={() => onSelect(event)}
        renderEvent={renderEvent}
        showResizeHandles={showResizeHandles && interactive}
        timeLabel={timeLabel}
        variant={variant}
      />
    </div>
  )
}

type EventSurfaceProps = {
  accentColor: string
  ariaLabel?: string
  attributes?: DraggableAttributes
  className?: string
  event: CalendarOccurrence
  isDragging?: boolean
  listeners?: DraggableSyntheticListeners
  onKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>) => void
  onSelect?: () => void
  renderEvent?: CalendarEventRenderer
  showResizeHandles?: boolean
  timeLabel: string
  variant: EventVariant
}

function EventSurface({
  accentColor,
  ariaLabel,
  attributes,
  className,
  event,
  isDragging = false,
  listeners,
  onKeyDown,
  onSelect,
  renderEvent,
  showResizeHandles,
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
        <p className="truncate text-[10px] font-medium uppercase tracking-[0.24em] text-foreground/70">
          {timeLabel}
        </p>
      ) : null}
      <p className="truncate font-medium leading-tight">{event.title}</p>
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
      className={className}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      style={getEventSurfaceStyle(accentColor, variant, isDragging)}
      type="button"
      {...attributes}
      {...listeners}
    >
      {showResizeHandles ? (
        <>
          <ResizeHandle
            accentColor={accentColor}
            edge="start"
            event={event}
            interactive
          />
          <ResizeHandle
            accentColor={accentColor}
            edge="end"
            event={event}
            interactive
          />
        </>
      ) : null}
      {content}
    </button>
  )
}

function AgendaDayGroup({
  classNames,
  day,
  events,
  getEventColor,
  interactive,
  onEventKeyCommand,
  onSelect,
  renderEvent,
  selectedEventId,
  timeZone,
}: {
  classNames?: CalendarClassNames
  day: Date
  events: CalendarOccurrence[]
  getEventColor?: (occurrence: CalendarOccurrence) => string
  interactive: boolean
  onEventKeyCommand: (
    occurrence: CalendarOccurrence,
    event: React.KeyboardEvent<HTMLButtonElement>
  ) => void
  onSelect: (occurrence: CalendarOccurrence) => void
  renderEvent?: CalendarEventRenderer
  selectedEventId?: string
  timeZone?: string
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `agenda:${day.toISOString()}`,
    data: {
      kind: "day",
      day,
    } satisfies CalendarDropTarget,
  })

  return (
    <section
      ref={setNodeRef}
      className={getCalendarSlotClassName(
        classNames,
        "agendaGroup",
        cn(
          "grid gap-4 px-4 py-4 md:grid-cols-[7rem_1fr] md:px-5",
          isOver ? "bg-muted/50" : ""
        )
      )}
    >
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
          {formatAgendaEyebrow(day)}
        </p>
        <h3 className="font-medium">{formatAgendaHeading(day)}</h3>
      </div>
      <div className="space-y-2">
        {events.length === 0 ? (
          <p className="py-3 text-sm text-muted-foreground">No events scheduled.</p>
        ) : (
          events.map((occurrence) => (
            <CalendarEventCard
              key={occurrence.occurrenceId}
              accentColor={getResolvedAccentColor(occurrence, getEventColor)}
              classNames={classNames}
              event={occurrence}
              interactive={interactive}
              onEventKeyCommand={onEventKeyCommand}
              onSelect={onSelect}
              renderEvent={renderEvent}
              selected={selectedEventId === occurrence.sourceEventId}
              timeLabel={getEventMetaLabel(occurrence, timeZone)}
              variant="agenda"
            />
          ))
        )}
      </div>
    </section>
  )
}

function ResizeHandle({
  accentColor,
  edge,
  event,
  interactive,
}: {
  accentColor: string
  edge: "start" | "end"
  event: CalendarOccurrence
  interactive: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `resize:${edge}:${event.occurrenceId}`,
    data: {
      kind: "resize",
      occurrence: event,
      edge,
    } satisfies CalendarDragData,
    disabled: !interactive,
  })

  return (
    <span
      ref={setNodeRef}
      className={cn(
        "absolute inset-x-2 z-10 h-2 rounded-full",
        edge === "start" ? "top-0 -translate-y-1/2 cursor-ns-resize" : "bottom-0 translate-y-1/2 cursor-ns-resize"
      )}
      style={{
        backgroundColor: isDragging ? accentColor : `${accentColor}88`,
      }}
      {...(interactive ? attributes : undefined)}
      {...(interactive ? listeners : undefined)}
    />
  )
}

function getResolvedAccentColor(
  occurrence: CalendarOccurrence,
  getEventColor?: (occurrence: CalendarOccurrence) => string,
  index = 0
) {
  return getEventColor?.(occurrence) ?? getOccurrenceAccentColor(occurrence, index)
}

function getSlotClassNameForEvent(
  classNames: CalendarClassNames | undefined,
  variant: EventVariant,
  selected: boolean | undefined,
  isDragging: boolean
) {
  const slot =
    variant === "month"
      ? "monthEvent"
      : variant === "agenda"
        ? "agendaEvent"
        : "timeGridEvent"

  return getCalendarSlotClassName(
    classNames,
    slot,
    cn(
      "relative w-full min-w-0 overflow-hidden rounded-[calc(var(--radius)*0.95)] border px-2 py-2 text-left shadow-sm outline-none transition",
      variant === "month" || variant === "all-day"
        ? "px-2 py-1.5 text-xs"
        : "h-full text-sm",
      variant === "agenda" ? "min-h-20" : "",
      selected ? "ring-2 ring-ring/70" : "",
      isDragging ? "opacity-70" : "hover:-translate-y-px hover:shadow-md"
    )
  )
}

function getEventSurfaceStyle(
  accentColor: string,
  variant: EventVariant,
  isDragging: boolean
): React.CSSProperties {
  const intensity =
    variant === "time-grid" ? "22%" : variant === "overlay" ? "26%" : "14%"

  return {
    borderColor: `color-mix(in oklab, ${accentColor} 45%, var(--color-border))`,
    background: `color-mix(in oklab, ${accentColor} ${intensity}, var(--color-background))`,
    boxShadow: `inset 3px 0 0 ${accentColor}`,
    opacity: isDragging ? 0.72 : 1,
  }
}
