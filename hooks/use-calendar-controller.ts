import * as React from "react"

import type {
  CalendarCreateOperation,
  CalendarEvent,
  CalendarEventCreateDefaults,
  CalendarEventUpdateOperation,
  CalendarMoveOperation,
  CalendarOccurrence,
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

export type UseCalendarControllerOptions = {
  availableViews?: CalendarView[]
  initialDate?: Date
  initialEvents?: CalendarEvent[]
  initialView?: CalendarView
  createDefaults?: CalendarEventCreateDefaults
}

export type UseCalendarControllerResult = {
  date: Date
  events: CalendarEvent[]
  goToToday: () => void
  isPending: boolean
  selectedEventId: string | undefined
  setDate: (nextDate: Date) => void
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>
  setSelectedEventId: React.Dispatch<React.SetStateAction<string | undefined>>
  setView: (nextView: CalendarView) => void
  step: (direction: -1 | 1) => void
  view: CalendarView
  handleEventCreate: (operation: CalendarCreateOperation) => void
  handleEventArchive: (occurrence: CalendarOccurrence) => void
  handleEventDelete: (occurrence: CalendarOccurrence) => void
  handleEventDuplicate: (occurrence: CalendarOccurrence) => void
  handleEventMove: (operation: CalendarMoveOperation) => void
  handleEventResize: (operation: CalendarResizeOperation) => void
  handleEventUpdate: (operation: CalendarEventUpdateOperation) => void
}

export function useCalendarController(
  options: UseCalendarControllerOptions = {}
): UseCalendarControllerResult {
  const [events, setEvents] = React.useState<CalendarEvent[]>(
    options.initialEvents ?? []
  )
  const availableViews = React.useMemo(
    () => normalizeAvailableViews(options.availableViews),
    [options.availableViews]
  )
  const [date, setDateState] = React.useState<Date>(
    options.initialDate ?? new Date()
  )
  const [view, setViewState] = React.useState<CalendarView>(
    resolveCalendarView(options.initialView ?? "week", availableViews)
  )
  const [selectedEventId, setSelectedEventId] = React.useState<
    string | undefined
  >()
  const [isPending, startTransition] = React.useTransition()

  React.useEffect(() => {
    setViewState((currentView) =>
      resolveCalendarView(currentView, availableViews)
    )
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

  function handleEventDuplicate(occurrence: CalendarOccurrence) {
    setEvents((currentEvents) => [
      ...currentEvents,
      duplicateOccurrenceAsEvent(occurrence),
    ])
  }

  function handleEventArchive(occurrence: CalendarOccurrence) {
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

  function handleEventDelete(occurrence: CalendarOccurrence) {
    setEvents((currentEvents) =>
      currentEvents.filter((event) => event.id !== occurrence.sourceEventId)
    )
    setSelectedEventId(undefined)
  }

  function handleEventUpdate(operation: CalendarEventUpdateOperation) {
    setEvents((currentEvents) =>
      applyEventUpdateOperation(currentEvents, operation)
    )
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
