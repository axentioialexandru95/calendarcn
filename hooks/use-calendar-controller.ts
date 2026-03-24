"use client"

import * as React from "react"

import type {
  CalendarCreateOperation,
  CalendarEvent,
  CalendarMoveOperation,
  CalendarResizeOperation,
  CalendarView,
} from "@/components/calendar/types"
import {
  applyMoveOperation,
  applyResizeOperation,
  createEventFromOperation,
  shiftDate,
} from "@/components/calendar/utils"

type UseCalendarControllerOptions = {
  initialDate?: Date
  initialEvents?: CalendarEvent[]
  initialView?: CalendarView
  createDefaults?: Partial<CalendarEvent>
}

export function useCalendarController(
  options: UseCalendarControllerOptions = {}
) {
  const [events, setEvents] = React.useState(options.initialEvents ?? [])
  const [date, setDateState] = React.useState(options.initialDate ?? new Date())
  const [view, setViewState] = React.useState<CalendarView>(
    options.initialView ?? "week"
  )
  const [selectedEventId, setSelectedEventId] = React.useState<string>()
  const [isPending, startTransition] = React.useTransition()

  function setDate(nextDate: Date) {
    startTransition(() => {
      setDateState(nextDate)
    })
  }

  function setView(nextView: CalendarView) {
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
    setEvents((currentEvents) => [
      ...currentEvents,
      createEventFromOperation(operation, options.createDefaults),
    ])
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
    handleEventMove,
    handleEventResize,
  }
}

