import * as React from "react"

import type {
  CalendarCreateOperation,
  CalendarEvent,
  CalendarEventUpdateOperation,
  CalendarMoveOperation,
  CalendarResizeOperation,
  CalendarView,
} from "@/components/calendar/types"
import {
  applyEventUpdateOperation,
  applyMoveOperation,
  applyResizeOperation,
  createEventFromOperation,
  duplicateOccurrenceAsEvent,
  normalizeAvailableViews,
  resolveCalendarView,
  shiftDate,
} from "@/components/calendar/utils"

type UseCalendarControllerOptions = {
  availableViews?: CalendarView[]
  initialDate?: Date
  initialEvents?: CalendarEvent[]
  initialView?: CalendarView
  createDefaults?: Partial<CalendarEvent>
}

export function useCalendarController(
  options: UseCalendarControllerOptions = {}
) {
  const [events, setEvents] = React.useState(options.initialEvents ?? [])
  const availableViews = React.useMemo(
    () => normalizeAvailableViews(options.availableViews),
    [options.availableViews]
  )
  const [date, setDateState] = React.useState(options.initialDate ?? new Date())
  const [view, setViewState] = React.useState<CalendarView>(
    resolveCalendarView(options.initialView ?? "week", availableViews)
  )
  const [selectedEventId, setSelectedEventId] = React.useState<string>()
  const [isPending, startTransition] = React.useTransition()

  React.useEffect(() => {
    setViewState((currentView) => resolveCalendarView(currentView, availableViews))
  }, [availableViews])

  function setDate(nextDate: Date) {
    startTransition(() => {
      setDateState(nextDate)
    })
  }

  function setView(nextView: CalendarView) {
    if (!availableViews.includes(nextView)) {
      return
    }

    startTransition(() => {
      setViewState(nextView)
    })
  }

  function goToToday() {
    setDate(new Date())
  }

  function step(direction: -1 | 1) {
    startTransition(() => {
      setDateState((currentDate) => shiftDate(currentDate, view, direction))
    })
  }

  function handleEventMove(operation: CalendarMoveOperation) {
    setEvents((currentEvents) => applyMoveOperation(currentEvents, operation))
  }

  function handleEventResize(operation: CalendarResizeOperation) {
    setEvents((currentEvents) => applyResizeOperation(currentEvents, operation))
  }

  function handleEventCreate(operation: CalendarCreateOperation) {
    setEvents((currentEvents) => {
      const nextEvent = createEventFromOperation(
        operation,
        options.createDefaults
      )

      const hasDuplicate = currentEvents.some((event) => {
        return (
          event.title === nextEvent.title &&
          event.start.getTime() === nextEvent.start.getTime() &&
          event.end.getTime() === nextEvent.end.getTime() &&
          (event.allDay ?? false) === (nextEvent.allDay ?? false) &&
          event.resourceId === nextEvent.resourceId
        )
      })

      if (hasDuplicate) {
        return currentEvents
      }

      return [...currentEvents, nextEvent]
    })
  }

  function handleEventDuplicate(
    occurrence: CalendarMoveOperation["occurrence"]
  ) {
    setEvents((currentEvents) => [
      ...currentEvents,
      duplicateOccurrenceAsEvent(occurrence),
    ])
  }

  function handleEventArchive(occurrence: CalendarMoveOperation["occurrence"]) {
    setEvents((currentEvents) =>
      currentEvents.map((event) => {
        if (event.id !== occurrence.sourceEventId) {
          return event
        }

        return {
          ...event,
          archived: true,
        }
      })
    )
    setSelectedEventId(undefined)
  }

  function handleEventDelete(occurrence: CalendarMoveOperation["occurrence"]) {
    setEvents((currentEvents) =>
      currentEvents.filter((event) => event.id !== occurrence.sourceEventId)
    )
    setSelectedEventId(undefined)
  }

  function handleEventUpdate(operation: CalendarEventUpdateOperation) {
    setEvents((currentEvents) => applyEventUpdateOperation(currentEvents, operation))
  }

  return {
    date,
    events,
    goToToday,
    isPending,
    selectedEventId,
    setDate,
    setEvents,
    setSelectedEventId,
    setView,
    step,
    view,
    handleEventCreate,
    handleEventArchive,
    handleEventDelete,
    handleEventDuplicate,
    handleEventMove,
    handleEventResize,
    handleEventUpdate,
  }
}
