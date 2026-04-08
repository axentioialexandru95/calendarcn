import * as React from "react"

import { isSameDay, startOfDay } from "date-fns"

import { cn } from "../lib/utils"

import type {
  CalendarCreateDraft,
  CalendarDragData,
  CalendarDropTarget,
  CalendarEventVariant,
  CalendarOccurrence,
} from "../../types"
import {
  formatEventTimeLabel,
  formatHourLabel,
  formatMonthDayLabel,
  formatWeekday,
  intervalOverlapsBlockedRanges,
  getAllDayEvents,
  getCalendarSlotClassName,
  getDayLayout,
  getEventMetaLabel,
  getNextVisibleDay,
  getWeekDays,
  getZoomedWeekDays,
  isToday,
  parseTimeStringToMinuteOfDay,
  setMinuteOfDay,
  formatDurationLabel,
} from "../../utils"
import { CalendarEventCard, getResolvedAccentColor } from "./event-card"
import { type SharedViewProps, type TimeGridViewProps } from "../shared"
import { MemoizedAllDayDropZone } from "./time-grid/all-day-drop-zone"
import { TimeGridBackground } from "./time-grid/time-grid-background"
import { TimeGridPreviewLayer } from "./time-grid/time-grid-preview-layer"
import { MemoizedTimeSlotDropZone } from "./time-grid/time-slot-drop-zone"
import {
  getPreviewOccurrence,
  getTimeGridDropTargetFromPoint,
  getPointerDistance,
  hasPointerExceededSlop,
  lockDocumentTouchScroll,
  touchLongPressDelay,
} from "./root/root-utils"
import {
  clampGridMinute,
  getTimeGridHeaderId,
  getTimeGridPreviewLayout,
  getTimeGridSlotId,
} from "./time-grid/time-grid-utils"
import { useTimeGridNavigation } from "./time-grid/use-time-grid-navigation"

type ActiveDropTargetStore = {
  getSnapshot: () => CalendarDropTarget | null
  subscribe: (listener: () => void) => () => void
}

const nullActiveDropTargetStore: ActiveDropTargetStore = {
  getSnapshot: () => null,
  subscribe: () => () => undefined,
}

type TimeGridLiveDragProps = {
  activeDrag?: CalendarDragData | null
  activeDragOffsetMinutes?: number
  activeDropTargetStore?: ActiveDropTargetStore
  getPragmaticDragConfig?: (
    event: CalendarOccurrence,
    variant: CalendarEventVariant
  ) => {
    getInitialData: () => {
      occurrence: CalendarOccurrence
      type: "calendar-event"
      variant: CalendarEventVariant
    }
  } | null
  isPointerDragging?: boolean
}

export const CalendarWeekView = React.memo(function CalendarWeekView(
  props: SharedViewProps &
    TimeGridLiveDragProps & {
      minHour: number
      maxHour: number
      visibleDayCount?: number
    }
) {
  const days = React.useMemo(
    () =>
      props.visibleDayCount
        ? getZoomedWeekDays(
            props.anchorDate,
            props.weekStartsOn,
            props.visibleDayCount,
            props.hiddenDays
          )
        : getWeekDays(props.anchorDate, props.weekStartsOn, props.hiddenDays),
    [
      props.anchorDate,
      props.hiddenDays,
      props.visibleDayCount,
      props.weekStartsOn,
    ]
  )

  return <CalendarTimeGridView {...props} days={days} />
})

export const CalendarDayView = React.memo(function CalendarDayView(
  props: SharedViewProps &
    TimeGridLiveDragProps & {
      minHour: number
      maxHour: number
    }
) {
  const days = React.useMemo(
    () => [startOfDay(getNextVisibleDay(props.anchorDate, props.hiddenDays))],
    [props.anchorDate, props.hiddenDays]
  )

  return <CalendarTimeGridView {...props} days={days} />
})

type DraftMode = "mouse" | "touch"

type TouchCreateState = {
  captureElement: HTMLDivElement
  day: Date
  initialClientX: number
  initialClientY: number
  isActive: boolean
  pointerId: number
  releaseScrollLock: (() => void) | null
  startMinute: number
  timerId: number | null
}

function getClosestTouchPoint(
  touchList: TouchList,
  referenceX: number,
  referenceY: number
) {
  const touches = Array.from(touchList)

  if (touches.length === 0) {
    return null
  }

  return touches.reduce((closestTouch, touch) => {
    const closestDistance = getPointerDistance(
      referenceX,
      referenceY,
      closestTouch.clientX,
      closestTouch.clientY
    )
    const nextDistance = getPointerDistance(
      referenceX,
      referenceY,
      touch.clientX,
      touch.clientY
    )

    return nextDistance < closestDistance ? touch : closestTouch
  })
}

function CalendarTimeGridView(
  props: TimeGridViewProps & TimeGridLiveDragProps
) {
  const [draft, setDraft] = React.useState<CalendarCreateDraft | null>(null)
  const [draftMode, setDraftMode] = React.useState<DraftMode | null>(null)
  const [now, setNow] = React.useState(() => new Date())
  const [activeTouchCreatePointerId, setActiveTouchCreatePointerId] =
    React.useState<number | null>(null)
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null)
  const touchCreateRef = React.useRef<TouchCreateState | null>(null)
  const minMinute = props.minHour * 60
  const maxMinute = props.maxHour * 60
  const totalMinutes = maxMinute - minMinute
  const slotCount = Math.max(1, totalMinutes / props.slotDuration)
  const gridHeight = slotCount * props.slotHeight
  const {
    focusDayGrid,
    focusedGridDayIndex,
    focusedSlot,
    gridInstructionsId,
    handleGridKeyDown,
    setDayGridRef,
    setFocusedGridDayIndex,
    setFocusedSlot,
  } = useTimeGridNavigation({
    days: props.days,
    maxMinute,
    minMinute,
    onEventCreate: props.onEventCreate,
    slotDuration: props.slotDuration,
  })

  React.useLayoutEffect(() => {
    if (!props.selectedEventId && !props.isPointerDragging) {
      return
    }

    setFocusedGridDayIndex(null)
  }, [props.isPointerDragging, props.selectedEventId, setFocusedGridDayIndex])

  const pragmaticActiveDropTarget = React.useSyncExternalStore(
    (props.activeDropTargetStore ?? nullActiveDropTargetStore).subscribe,
    (props.activeDropTargetStore ?? nullActiveDropTargetStore).getSnapshot,
    (props.activeDropTargetStore ?? nullActiveDropTargetStore).getSnapshot
  )
  const liveActiveDropTarget =
    pragmaticActiveDropTarget ?? props.activeDropTarget ?? null
  const clearDraft = React.useEffectEvent(() => {
    setDraft(null)
    setDraftMode(null)
  })
  const commitDraft = React.useEffectEvent(() => {
    if (!draft) {
      return
    }

    if (!props.onEventCreate) {
      clearDraft()
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
    clearDraft()
  })

  const clearTouchCreateState = React.useCallback(
    (options: { clearDraft?: boolean } = {}) => {
      const touchCreate = touchCreateRef.current

      if (touchCreate?.timerId != null) {
        window.clearTimeout(touchCreate.timerId)
      }

      touchCreate?.releaseScrollLock?.()

      if (touchCreate) {
        try {
          if (
            touchCreate.captureElement.hasPointerCapture(touchCreate.pointerId)
          ) {
            touchCreate.captureElement.releasePointerCapture(
              touchCreate.pointerId
            )
          }
        } catch {
          // Ignore capture teardown errors.
        }
      }

      touchCreateRef.current = null
      setActiveTouchCreatePointerId(null)

      if (options.clearDraft) {
        setDraft(null)
        setDraftMode(null)
      }
    },
    []
  )

  const handleTouchCreatePointerDown = React.useCallback(
    (
      day: Date,
      minuteOfDay: number,
      event: React.PointerEvent<HTMLDivElement>
    ) => {
      if (!props.onEventCreate) {
        return
      }

      clearTouchCreateState({
        clearDraft: true,
      })

      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // Pointer capture is not guaranteed on every platform.
      }

      const nextTouchCreate: TouchCreateState = {
        captureElement: event.currentTarget,
        day,
        initialClientX: event.clientX,
        initialClientY: event.clientY,
        isActive: false,
        pointerId: event.pointerId,
        releaseScrollLock: null,
        startMinute: minuteOfDay,
        timerId: null,
      }

      nextTouchCreate.timerId = window.setTimeout(() => {
        const activeTouchCreate = touchCreateRef.current

        if (
          !activeTouchCreate ||
          activeTouchCreate.pointerId !== event.pointerId ||
          activeTouchCreate.isActive
        ) {
          return
        }

        activeTouchCreate.isActive = true
        activeTouchCreate.releaseScrollLock = lockDocumentTouchScroll()
        setDraft({
          day: activeTouchCreate.day,
          endMinute: activeTouchCreate.startMinute,
          startMinute: activeTouchCreate.startMinute,
        })
        setDraftMode("touch")
      }, touchLongPressDelay)

      touchCreateRef.current = nextTouchCreate
      setActiveTouchCreatePointerId(event.pointerId)
    },
    [clearTouchCreateState, props.onEventCreate]
  )
  const updateTouchCreateDraftFromPoint = React.useEffectEvent(
    (touchCreate: TouchCreateState, clientX: number, clientY: number) => {
      const target = getTimeGridDropTargetFromPoint(clientX, clientY)

      if (
        !target ||
        target.kind !== "slot" ||
        !isSameDay(target.day, touchCreate.day)
      ) {
        return
      }

      setDraft((currentDraft) => {
        if (
          currentDraft &&
          isSameDay(currentDraft.day, touchCreate.day) &&
          currentDraft.endMinute === target.minuteOfDay
        ) {
          return currentDraft
        }

        return {
          day: touchCreate.day,
          endMinute: target.minuteOfDay,
          startMinute: touchCreate.startMinute,
        }
      })
    }
  )

  React.useEffect(() => {
    if (!draft || draftMode !== "mouse") {
      return
    }

    function handlePointerUp() {
      commitDraft()
    }

    function handlePointerCancel() {
      clearDraft()
    }

    window.addEventListener("pointerup", handlePointerUp)
    window.addEventListener("pointercancel", handlePointerCancel)

    return () => {
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("pointercancel", handlePointerCancel)
    }
  }, [draft, draftMode])

  React.useEffect(() => {
    if (activeTouchCreatePointerId == null) {
      return
    }

    const pointerId = activeTouchCreatePointerId

    function handlePointerMove(event: PointerEvent) {
      const touchCreate = touchCreateRef.current

      if (!touchCreate || event.pointerId !== pointerId) {
        return
      }

      if (!touchCreate.isActive) {
        if (
          hasPointerExceededSlop(
            touchCreate.initialClientX,
            touchCreate.initialClientY,
            event.clientX,
            event.clientY
          )
        ) {
          clearTouchCreateState()
        }

        return
      }

      event.preventDefault()
      updateTouchCreateDraftFromPoint(touchCreate, event.clientX, event.clientY)
    }

    function handlePointerUp(event: PointerEvent) {
      const touchCreate = touchCreateRef.current

      if (!touchCreate || event.pointerId !== pointerId) {
        return
      }

      if (!touchCreate.isActive) {
        clearTouchCreateState()
        return
      }

      event.preventDefault()
      commitDraft()
      clearTouchCreateState()
    }

    function handlePointerCancel(event: PointerEvent) {
      const touchCreate = touchCreateRef.current

      if (!touchCreate || event.pointerId !== pointerId) {
        return
      }

      if (touchCreate.isActive) {
        return
      }

      clearTouchCreateState({
        clearDraft: true,
      })
    }

    function handleTouchMove(event: TouchEvent) {
      const touchCreate = touchCreateRef.current

      if (!touchCreate) {
        return
      }

      const touch = getClosestTouchPoint(
        event.touches.length > 0 ? event.touches : event.changedTouches,
        touchCreate.initialClientX,
        touchCreate.initialClientY
      )

      if (!touch) {
        return
      }

      if (!touchCreate.isActive) {
        if (
          hasPointerExceededSlop(
            touchCreate.initialClientX,
            touchCreate.initialClientY,
            touch.clientX,
            touch.clientY
          )
        ) {
          clearTouchCreateState()
        }

        return
      }

      event.preventDefault()
      updateTouchCreateDraftFromPoint(touchCreate, touch.clientX, touch.clientY)
    }

    function handleTouchEnd(event: TouchEvent) {
      const touchCreate = touchCreateRef.current

      if (!touchCreate) {
        return
      }

      if (!touchCreate.isActive) {
        clearTouchCreateState()
        return
      }

      const touch = getClosestTouchPoint(
        event.changedTouches,
        touchCreate.initialClientX,
        touchCreate.initialClientY
      )

      if (touch) {
        updateTouchCreateDraftFromPoint(
          touchCreate,
          touch.clientX,
          touch.clientY
        )
      }

      event.preventDefault()
      commitDraft()
      clearTouchCreateState()
    }

    function handleTouchCancel() {
      if (!touchCreateRef.current) {
        return
      }

      clearTouchCreateState({
        clearDraft: true,
      })
    }

    window.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    })
    window.addEventListener("pointerup", handlePointerUp)
    window.addEventListener("pointercancel", handlePointerCancel)
    window.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    })
    window.addEventListener("touchend", handleTouchEnd, {
      passive: false,
    })
    window.addEventListener("touchcancel", handleTouchCancel)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("pointercancel", handlePointerCancel)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
      window.removeEventListener("touchcancel", handleTouchCancel)
    }
  }, [activeTouchCreatePointerId, clearTouchCreateState])

  React.useEffect(() => {
    return () => {
      clearTouchCreateState()
    }
  }, [clearTouchCreateState])

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
      props.days.map((day) => [
        day.getTime(),
        getAllDayEvents(props.occurrences, day),
      ])
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

  const liveDragPreviewOccurrence = React.useMemo(() => {
    if (!props.activeDrag || !liveActiveDropTarget) {
      return props.dragPreviewOccurrence
    }

    const nextPreviewOccurrence = getPreviewOccurrence(
      props.activeDrag,
      liveActiveDropTarget,
      props.slotDuration,
      props.activeDragOffsetMinutes ?? 0
    )

    if (
      !nextPreviewOccurrence.allDay &&
      props.blockedRanges?.length &&
      intervalOverlapsBlockedRanges(
        nextPreviewOccurrence.start,
        nextPreviewOccurrence.end,
        props.blockedRanges
      )
    ) {
      return undefined
    }

    return nextPreviewOccurrence
  }, [
    liveActiveDropTarget,
    props.activeDrag,
    props.activeDragOffsetMinutes,
    props.blockedRanges,
    props.dragPreviewOccurrence,
    props.slotDuration,
  ])

  const liveDraggingOccurrenceId =
    props.isPointerDragging && props.activeDrag?.kind === "event"
      ? props.activeDrag.occurrence.occurrenceId
      : props.draggingOccurrenceId

  const handleBeginCreate = React.useCallback(
    (day: Date, minuteOfDay: number) => {
      if (!props.onEventCreate) {
        return
      }

      setDraftMode("mouse")
      setDraft({
        day,
        startMinute: minuteOfDay,
        endMinute: minuteOfDay,
      })
    },
    [props.onEventCreate]
  )

  const handleExtendCreate = React.useCallback(
    (day: Date, minuteOfDay: number) => {
      setDraft((currentDraft) => {
        if (!currentDraft || !isSameDay(currentDraft.day, day)) {
          return currentDraft
        }

        if (currentDraft.endMinute === minuteOfDay) {
          return currentDraft
        }

        return {
          ...currentDraft,
          endMinute: minuteOfDay,
        }
      })
    },
    []
  )

  const handleFocusCell = React.useCallback(
    (dayIndex: number, minuteOfDay: number) => {
      setFocusedGridDayIndex(dayIndex)
      setFocusedSlot({
        dayIndex,
        minuteOfDay,
      })
      focusDayGrid(dayIndex)
    },
    [focusDayGrid, setFocusedGridDayIndex, setFocusedSlot]
  )

  const handleBlurDayGrid = React.useCallback(
    (
      dayIndex: number,
      relatedTarget: EventTarget | null,
      currentTarget: EventTarget | null
    ) => {
      if (
        relatedTarget instanceof Node &&
        currentTarget instanceof Node &&
        currentTarget.contains(relatedTarget)
      ) {
        return
      }

      setFocusedGridDayIndex((currentIndex) =>
        currentIndex === dayIndex ? null : currentIndex
      )
    },
    [setFocusedGridDayIndex]
  )

  const handleFocusDayGrid = React.useCallback(
    (dayIndex: number) => {
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
    },
    [
      maxMinute,
      minMinute,
      props.slotDuration,
      setFocusedGridDayIndex,
      setFocusedSlot,
    ]
  )

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
              data-calendar-zoom-day={day.toISOString()}
              data-calendar-zoom-surface="header"
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
            <MemoizedAllDayDropZone
              key={`all-day-${day.toISOString()}`}
              classNames={props.classNames}
              day={day}
              density={props.density}
              dragPreviewOccurrence={
                liveDragPreviewOccurrence?.allDay &&
                getAllDayEvents([liveDragPreviewOccurrence], day).length > 0
                  ? liveDragPreviewOccurrence
                  : undefined
              }
              draggingOccurrenceId={liveDraggingOccurrenceId}
              events={allDayEventsByDay.get(day.getTime()) ?? []}
              getEventColor={props.getEventColor}
              hourCycle={props.hourCycle}
              isDragTarget={
                liveActiveDropTarget?.kind === "all-day" &&
                liveActiveDropTarget.day.getTime() === day.getTime()
              }
              interactive={props.interactive}
              locale={props.locale}
              onEventDragPointerDown={props.onEventDragPointerDown}
              onEventKeyCommand={props.onEventKeyCommand}
              onOpenContextMenu={props.onOpenContextMenu}
              onSelect={props.onSelectEvent}
              pragmaticDragConfigFactory={props.getPragmaticDragConfig}
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
                    <div className="pt-0.5">
                      <p>
                        {formatHourLabel(labelDate, {
                          hourCycle: props.hourCycle,
                          locale: props.locale,
                          timeZone: props.timeZone,
                        })}
                      </p>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
          {props.days.map((day, dayIndex) => (
            <MemoizedTimeGridDayColumn
              key={`day-column-${day.toISOString()}`}
              activeDropTargetMinuteOfDay={
                liveActiveDropTarget?.kind === "slot" &&
                liveActiveDropTarget.day.getTime() === day.getTime()
                  ? liveActiveDropTarget.minuteOfDay
                  : null
              }
              blockedRanges={props.blockedRanges}
              businessHours={props.businessHours}
              classNames={props.classNames}
              day={day}
              dayIndex={dayIndex}
              dragPreviewOccurrence={
                liveDragPreviewOccurrence &&
                !liveDragPreviewOccurrence.allDay &&
                isSameDay(liveDragPreviewOccurrence.start, day)
                  ? liveDragPreviewOccurrence
                  : undefined
              }
              draggingOccurrenceId={liveDraggingOccurrenceId}
              draft={draft && isSameDay(draft.day, day) ? draft : null}
              focusVisible={focusedGridDayIndex === dayIndex}
              focusedMinuteOfDay={
                focusedSlot.dayIndex === dayIndex
                  ? focusedSlot.minuteOfDay
                  : null
              }
              getEventColor={props.getEventColor}
              gridHeight={gridHeight}
              gridInstructionsId={gridInstructionsId}
              handleBeginCreate={handleBeginCreate}
              handleExtendCreate={handleExtendCreate}
              handleBlurDayGrid={handleBlurDayGrid}
              handleFocusCell={handleFocusCell}
              handleFocusDayGrid={handleFocusDayGrid}
              handleGridKeyDown={handleGridKeyDown}
              handleTouchCreatePointerDown={handleTouchCreatePointerDown}
              hourCycle={props.hourCycle}
              interactive={props.interactive}
              isTodayColumn={isSameDay(day, now)}
              locale={props.locale}
              maxMinute={maxMinute}
              minMinute={minMinute}
              nowIndicatorMinuteOfDay={now.getHours() * 60 + now.getMinutes()}
              onEventDragPointerDown={props.onEventDragPointerDown}
              onEventKeyCommand={props.onEventKeyCommand}
              onOpenContextMenu={props.onOpenContextMenu}
              onResizeHandlePointerDown={props.onResizeHandlePointerDown}
              onSelectEvent={props.onSelectEvent}
              pragmaticDragConfigFactory={props.getPragmaticDragConfig}
              previewOccurrenceId={props.previewOccurrenceId}
              renderEvent={props.renderEvent}
              selectedEventId={props.selectedEventId}
              setDayGridRef={setDayGridRef}
              suppressKeyboardGridFocus={Boolean(
                props.isPointerDragging || props.selectedEventId
              )}
              shouldSuppressEventClick={props.shouldSuppressEventClick}
              showCreatePreviewMeta={Boolean(props.showCreatePreviewMeta)}
              showDragPreviewMeta={Boolean(props.showDragPreviewMeta)}
              slotCount={slotCount}
              slotDuration={props.slotDuration}
              slotHeight={props.slotHeight}
              timeZone={props.timeZone}
              timedLayout={timedLayoutsByDay.get(day.getTime()) ?? []}
              totalMinutes={totalMinutes}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

type TimeGridDayColumnProps = {
  activeDropTargetMinuteOfDay: number | null
  blockedRanges: TimeGridViewProps["blockedRanges"]
  businessHours: TimeGridViewProps["businessHours"]
  classNames?: TimeGridViewProps["classNames"]
  day: Date
  dayIndex: number
  dragPreviewOccurrence?: TimeGridViewProps["dragPreviewOccurrence"]
  draggingOccurrenceId?: string
  draft: CalendarCreateDraft | null
  focusVisible: boolean
  focusedMinuteOfDay: number | null
  getEventColor?: TimeGridViewProps["getEventColor"]
  gridHeight: number
  gridInstructionsId: string
  handleBeginCreate: (day: Date, minuteOfDay: number) => void
  handleExtendCreate: (day: Date, minuteOfDay: number) => void
  handleBlurDayGrid: (
    dayIndex: number,
    relatedTarget: EventTarget | null,
    currentTarget: EventTarget | null
  ) => void
  handleFocusCell: (dayIndex: number, minuteOfDay: number) => void
  handleFocusDayGrid: (dayIndex: number) => void
  handleGridKeyDown: (
    dayIndex: number,
    day: Date,
    event: React.KeyboardEvent<HTMLDivElement>
  ) => void
  handleTouchCreatePointerDown?: (
    day: Date,
    minuteOfDay: number,
    event: React.PointerEvent<HTMLDivElement>
  ) => void
  hourCycle?: 12 | 24
  interactive: boolean
  isTodayColumn: boolean
  locale?: string
  maxMinute: number
  minMinute: number
  nowIndicatorMinuteOfDay: number
  onEventDragPointerDown?: TimeGridViewProps["onEventDragPointerDown"]
  onEventKeyCommand: TimeGridViewProps["onEventKeyCommand"]
  onOpenContextMenu?: TimeGridViewProps["onOpenContextMenu"]
  onResizeHandlePointerDown?: TimeGridViewProps["onResizeHandlePointerDown"]
  onSelectEvent: TimeGridViewProps["onSelectEvent"]
  pragmaticDragConfigFactory?: TimeGridLiveDragProps["getPragmaticDragConfig"]
  previewOccurrenceId?: string
  renderEvent?: TimeGridViewProps["renderEvent"]
  selectedEventId?: string
  setDayGridRef: (dayIndex: number, element: HTMLDivElement | null) => void
  suppressKeyboardGridFocus: boolean
  shouldSuppressEventClick?: TimeGridViewProps["shouldSuppressEventClick"]
  showCreatePreviewMeta: boolean
  showDragPreviewMeta: boolean
  slotCount: number
  slotDuration: number
  slotHeight: number
  timeZone?: string
  timedLayout: ReturnType<typeof getDayLayout>
  totalMinutes: number
}

const MemoizedTimeGridDayColumn = React.memo(
  function TimeGridDayColumn({
    activeDropTargetMinuteOfDay,
    blockedRanges,
    businessHours,
    classNames,
    day,
    dayIndex,
    dragPreviewOccurrence,
    draggingOccurrenceId,
    draft,
    focusVisible,
    focusedMinuteOfDay,
    getEventColor,
    gridHeight,
    gridInstructionsId,
    handleBeginCreate,
    handleExtendCreate,
    handleBlurDayGrid,
    handleFocusCell,
    handleFocusDayGrid,
    handleGridKeyDown,
    handleTouchCreatePointerDown,
    hourCycle,
    interactive,
    isTodayColumn,
    locale,
    maxMinute,
    minMinute,
    nowIndicatorMinuteOfDay,
    onEventDragPointerDown,
    onEventKeyCommand,
    onOpenContextMenu,
    onResizeHandlePointerDown,
    onSelectEvent,
    pragmaticDragConfigFactory,
    previewOccurrenceId,
    renderEvent,
    selectedEventId,
    setDayGridRef,
    suppressKeyboardGridFocus,
    shouldSuppressEventClick,
    showCreatePreviewMeta,
    showDragPreviewMeta,
    slotCount,
    slotDuration,
    slotHeight,
    timeZone,
    timedLayout,
    totalMinutes,
  }: TimeGridDayColumnProps) {
    const previewLayout = getTimeGridPreviewLayout(
      timedLayout,
      dragPreviewOccurrence,
      day,
      minMinute,
      maxMinute
    )
    const showFocusedGridCell = !suppressKeyboardGridFocus
    const showTimedSlotDropHighlight = !previewLayout
    const showNowIndicator =
      isTodayColumn &&
      nowIndicatorMinuteOfDay >= minMinute &&
      nowIndicatorMinuteOfDay <= maxMinute
    const nowIndicatorTop =
      ((nowIndicatorMinuteOfDay - minMinute) / totalMinutes) * gridHeight
    const headerId = getTimeGridHeaderId(day)
    const activeSlotId =
      focusedMinuteOfDay != null
        ? getTimeGridSlotId(day, focusedMinuteOfDay)
        : undefined
    const slotDescriptors = React.useMemo(() => {
      return Array.from({ length: slotCount }, (_, index) => {
        const minuteOfDay = minMinute + index * slotDuration
        const slotStart = setMinuteOfDay(startOfDay(day), minuteOfDay)
        const slotEnd = setMinuteOfDay(
          startOfDay(day),
          Math.min(minuteOfDay + slotDuration, 1_440)
        )

        return {
          blocked:
            blockedRanges?.some(
              (range) =>
                slotStart.getTime() < range.end.getTime() &&
                slotEnd.getTime() > range.start.getTime()
            ) ?? false,
          minuteOfDay,
          slotId: getTimeGridSlotId(day, minuteOfDay),
        }
      })
    }, [blockedRanges, day, minMinute, slotCount, slotDuration])
    const draftPreviewLabels = React.useMemo(() => {
      if (!draft) {
        return null
      }

      const startMinute = Math.min(draft.startMinute, draft.endMinute)
      const endMinute = Math.max(draft.startMinute, draft.endMinute)
      const start = setMinuteOfDay(startOfDay(day), startMinute)
      const end = setMinuteOfDay(
        startOfDay(day),
        Math.min(endMinute + slotDuration, 1_440)
      )

      return {
        durationLabel: formatDurationLabel(start, end),
        timeLabel: formatEventTimeLabel(start, end, {
          hourCycle,
          locale,
          timeZone,
        }),
      }
    }, [day, draft, hourCycle, locale, slotDuration, timeZone])

    return (
      <div
        className={getCalendarSlotClassName(
          classNames,
          "timeGridDayColumn",
          "relative border-r border-border/70 last:border-r-0"
        )}
        data-calendar-zoom-day={day.toISOString()}
        data-calendar-zoom-surface="column"
      >
        <div
          aria-activedescendant={showFocusedGridCell ? activeSlotId : undefined}
          aria-colcount={1}
          aria-describedby={gridInstructionsId}
          aria-labelledby={headerId}
          aria-rowcount={slotCount}
          className="relative h-full outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-inset"
          onBlur={(event) =>
            handleBlurDayGrid(
              dayIndex,
              event.relatedTarget,
              event.currentTarget
            )
          }
          onFocus={() => {
            handleFocusDayGrid(dayIndex)
          }}
          onKeyDown={(event) => handleGridKeyDown(dayIndex, day, event)}
          ref={(element) => {
            setDayGridRef(dayIndex, element)
          }}
          role="grid"
          style={{
            height: gridHeight,
          }}
          tabIndex={showFocusedGridCell && focusedMinuteOfDay != null ? 0 : -1}
        >
          <TimeGridBackground
            blockedRanges={blockedRanges}
            businessHours={businessHours}
            day={day}
            gridHeight={gridHeight}
            maxMinute={maxMinute}
            minMinute={minMinute}
            slotDuration={slotDuration}
            slotHeight={slotHeight}
          />
          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateRows: `repeat(${slotCount}, ${slotHeight}px)`,
            }}
          >
            {slotDescriptors.map(({ blocked, minuteOfDay, slotId }) => {
              return (
                <div key={`${day.toISOString()}-${minuteOfDay}`} role="row">
                  <MemoizedTimeSlotDropZone
                    active={
                      showFocusedGridCell &&
                      focusedMinuteOfDay === minuteOfDay &&
                      !draft
                    }
                    blocked={blocked}
                    classNames={classNames}
                    day={day}
                    dayIndex={dayIndex}
                    focusVisible={showFocusedGridCell && focusVisible}
                    hourCycle={hourCycle}
                    isDragTarget={
                      showTimedSlotDropHighlight &&
                      activeDropTargetMinuteOfDay === minuteOfDay
                    }
                    isDraftDay={Boolean(draft)}
                    locale={locale}
                    minuteOfDay={minuteOfDay}
                    onBeginCreate={handleBeginCreate}
                    onExtendCreate={handleExtendCreate}
                    onFocusCell={handleFocusCell}
                    onTouchCreatePointerDown={handleTouchCreatePointerDown}
                    slotId={slotId}
                    timeZone={timeZone}
                  />
                </div>
              )
            })}
          </div>
          {draft ? (
            <div
              className="pointer-events-none absolute inset-x-1 overflow-hidden rounded-[min(var(--radius-sm),4px)] border border-dashed border-primary/55 bg-primary/10 shadow-xs"
              style={{
                top:
                  ((Math.min(draft.startMinute, draft.endMinute) - minMinute) /
                    slotDuration) *
                  slotHeight,
                height:
                  ((Math.abs(draft.endMinute - draft.startMinute) +
                    slotDuration) /
                    slotDuration) *
                  slotHeight,
              }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute top-1.5 bottom-1.5 left-1 w-0.5 rounded-full bg-primary/80"
              />
              {showCreatePreviewMeta ? (
                <div className="absolute top-2 right-2 left-3 min-w-0 rounded-[min(var(--radius-sm),4px)] bg-background/95 px-2 py-1 shadow-xs">
                  <p className="truncate text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                    {draftPreviewLabels?.timeLabel}
                  </p>
                  <p className="truncate text-[11px] leading-tight font-medium text-foreground">
                    {draftPreviewLabels?.durationLabel}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
          {previewLayout ? (
            <TimeGridPreviewLayer
              column={previewLayout.column}
              columns={previewLayout.columns}
              height={previewLayout.height}
              minMinute={minMinute}
              slotDuration={slotDuration}
              slotHeight={slotHeight}
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
          {timedLayout.map((item, index) => {
            const width = 100 / item.columns
            const left = item.column * width

            return (
              <div
                key={item.occurrence.occurrenceId}
                className="absolute px-1"
                style={{
                  top: ((item.top - minMinute) / slotDuration) * slotHeight,
                  height: Math.max(
                    slotHeight - 4,
                    (item.height / slotDuration) * slotHeight
                  ),
                  left: `calc(${left}% + 0px)`,
                  width: `calc(${width}% - 0px)`,
                }}
              >
                <CalendarEventCard
                  accentColor={getResolvedAccentColor(
                    item.occurrence,
                    getEventColor,
                    index
                  )}
                  classNames={classNames}
                  density="comfortable"
                  dragging={
                    previewOccurrenceId === item.occurrence.occurrenceId
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
                  pragmaticDragConfigFactory={pragmaticDragConfigFactory}
                  preview={previewOccurrenceId === item.occurrence.occurrenceId}
                  previewMetaLabel={
                    showDragPreviewMeta &&
                    previewOccurrenceId === item.occurrence.occurrenceId
                      ? formatDurationLabel(
                          item.occurrence.start,
                          item.occurrence.end,
                          item.occurrence.allDay
                        )
                      : undefined
                  }
                  renderEvent={renderEvent}
                  selected={selectedEventId === item.occurrence.occurrenceId}
                  shouldSuppressClick={shouldSuppressEventClick}
                  showResizeHandles={
                    selectedEventId === item.occurrence.occurrenceId &&
                    Boolean(onResizeHandlePointerDown)
                  }
                  timeLabel={getEventMetaLabel(item.occurrence, {
                    hourCycle,
                    locale,
                    timeZone,
                  })}
                  variant="time-grid"
                />
              </div>
            )
          })}
        </div>
      </div>
    )
  },
  (previousProps, nextProps) => {
    return (
      previousProps.activeDropTargetMinuteOfDay ===
        nextProps.activeDropTargetMinuteOfDay &&
      previousProps.blockedRanges === nextProps.blockedRanges &&
      previousProps.businessHours === nextProps.businessHours &&
      previousProps.classNames === nextProps.classNames &&
      previousProps.day.getTime() === nextProps.day.getTime() &&
      previousProps.dayIndex === nextProps.dayIndex &&
      previousProps.dragPreviewOccurrence === nextProps.dragPreviewOccurrence &&
      previousProps.draggingOccurrenceId === nextProps.draggingOccurrenceId &&
      previousProps.draft === nextProps.draft &&
      previousProps.focusVisible === nextProps.focusVisible &&
      previousProps.focusedMinuteOfDay === nextProps.focusedMinuteOfDay &&
      previousProps.getEventColor === nextProps.getEventColor &&
      previousProps.gridHeight === nextProps.gridHeight &&
      previousProps.gridInstructionsId === nextProps.gridInstructionsId &&
      previousProps.handleBeginCreate === nextProps.handleBeginCreate &&
      previousProps.handleExtendCreate === nextProps.handleExtendCreate &&
      previousProps.handleBlurDayGrid === nextProps.handleBlurDayGrid &&
      previousProps.handleFocusCell === nextProps.handleFocusCell &&
      previousProps.handleFocusDayGrid === nextProps.handleFocusDayGrid &&
      previousProps.handleGridKeyDown === nextProps.handleGridKeyDown &&
      previousProps.handleTouchCreatePointerDown ===
        nextProps.handleTouchCreatePointerDown &&
      previousProps.hourCycle === nextProps.hourCycle &&
      previousProps.interactive === nextProps.interactive &&
      previousProps.isTodayColumn === nextProps.isTodayColumn &&
      previousProps.locale === nextProps.locale &&
      previousProps.maxMinute === nextProps.maxMinute &&
      previousProps.minMinute === nextProps.minMinute &&
      previousProps.nowIndicatorMinuteOfDay ===
        nextProps.nowIndicatorMinuteOfDay &&
      previousProps.onEventDragPointerDown ===
        nextProps.onEventDragPointerDown &&
      previousProps.onEventKeyCommand === nextProps.onEventKeyCommand &&
      previousProps.onOpenContextMenu === nextProps.onOpenContextMenu &&
      previousProps.onResizeHandlePointerDown ===
        nextProps.onResizeHandlePointerDown &&
      previousProps.onSelectEvent === nextProps.onSelectEvent &&
      previousProps.pragmaticDragConfigFactory ===
        nextProps.pragmaticDragConfigFactory &&
      previousProps.previewOccurrenceId === nextProps.previewOccurrenceId &&
      previousProps.renderEvent === nextProps.renderEvent &&
      previousProps.selectedEventId === nextProps.selectedEventId &&
      previousProps.setDayGridRef === nextProps.setDayGridRef &&
      previousProps.suppressKeyboardGridFocus ===
        nextProps.suppressKeyboardGridFocus &&
      previousProps.shouldSuppressEventClick ===
        nextProps.shouldSuppressEventClick &&
      previousProps.showCreatePreviewMeta === nextProps.showCreatePreviewMeta &&
      previousProps.showDragPreviewMeta === nextProps.showDragPreviewMeta &&
      previousProps.slotCount === nextProps.slotCount &&
      previousProps.slotDuration === nextProps.slotDuration &&
      previousProps.slotHeight === nextProps.slotHeight &&
      previousProps.timeZone === nextProps.timeZone &&
      previousProps.timedLayout === nextProps.timedLayout &&
      previousProps.totalMinutes === nextProps.totalMinutes
    )
  }
)
