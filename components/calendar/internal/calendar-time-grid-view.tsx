import * as React from "react"

import { useDroppable } from "@dnd-kit/core"
import { format, isSameDay, startOfDay } from "date-fns"

import { cn } from "@/lib/utils"

import type {
  CalendarClassNames,
  CalendarCreateDraft,
  CalendarDropTarget,
  CalendarEventRenderer,
  CalendarOccurrence,
} from "../types"
import {
  formatWeekday,
  getAllDayEvents,
  getCalendarSlotClassName,
  getDayLayout,
  getEventMetaLabel,
  getWeekDays,
  isToday,
  setMinuteOfDay,
} from "../utils"
import {
  CalendarEventCard,
  getResolvedAccentColor,
} from "./calendar-event-card"
import {
  slotHeight,
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
    <CalendarTimeGridView {...props} days={[startOfDay(props.anchorDate)]} />
  )
}

function CalendarTimeGridView(props: TimeGridViewProps) {
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
          <div className="border-r border-border/70 px-3 py-3 text-[11px] tracking-[0.24em] text-muted-foreground uppercase">
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
                  <p className="text-[11px] tracking-[0.24em] text-muted-foreground uppercase">
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
          <div className="border-r border-border/70 px-3 py-3 text-[11px] tracking-[0.24em] text-muted-foreground uppercase">
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
              const labelDate = setMinuteOfDay(
                startOfDay(props.days[0]),
                minute
              )

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
            const layout = getDayLayout(
              props.occurrences,
              day,
              minMinute,
              maxMinute
            )

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
                          ((Math.min(draft.startMinute, draft.endMinute) -
                            minMinute) /
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
                          top:
                            ((item.top - minMinute) / props.slotDuration) *
                            slotHeight,
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
                          dragInstanceId={`time-grid:${day.toISOString()}:${item.occurrence.occurrenceId}`}
                          event={item.occurrence}
                          interactive={props.interactive}
                          onEventKeyCommand={props.onEventKeyCommand}
                          onSelect={props.onSelectEvent}
                          renderEvent={props.renderEvent}
                          selected={
                            props.selectedEventId ===
                            item.occurrence.occurrenceId
                          }
                          showResizeHandles
                          timeLabel={getEventMetaLabel(
                            item.occurrence,
                            props.timeZone
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
            accentColor={getResolvedAccentColor(
              occurrence,
              getEventColor,
              index
            )}
            classNames={classNames}
            dragInstanceId={`all-day:${day.toISOString()}:${occurrence.occurrenceId}`}
            event={occurrence}
            interactive={interactive}
            onEventKeyCommand={onEventKeyCommand}
            onSelect={onSelect}
            renderEvent={renderEvent}
            selected={selectedEventId === occurrence.occurrenceId}
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
