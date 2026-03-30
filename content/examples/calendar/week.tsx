"use client"

import * as React from "react"
import { addDays, set } from "date-fns"

import type {
  CalendarCreateOperation,
  CalendarEvent,
  CalendarMoveOperation,
  CalendarResizeOperation,
} from "@/components/calendar/types"
import { CalendarScheduler } from "@/components/calendar/scheduler"
import {
  applyMoveOperation,
  applyResizeOperation,
  createEventFromOperation,
  shiftDate,
} from "@/components/calendar/utils"
import { docsCalendarExampleClassNames } from "@/content/examples/calendar/shared"

const seedDate = new Date("2026-03-24T09:00:00.000Z")

const weekEvents: CalendarEvent[] = [
  {
    id: "standup",
    title: "Studio standup",
    start: set(seedDate, { hours: 9, minutes: 0 }),
    end: set(seedDate, { hours: 9, minutes: 30 }),
    color: "#2563eb",
  },
  {
    id: "crit",
    title: "Interface crit",
    start: set(seedDate, { hours: 10, minutes: 0 }),
    end: set(seedDate, { hours: 11, minutes: 30 }),
    color: "#db2777",
  },
  {
    id: "focus",
    title: "Focus block",
    start: set(seedDate, { hours: 13, minutes: 0 }),
    end: set(seedDate, { hours: 15, minutes: 0 }),
    color: "#7c3aed",
  },
  {
    id: "client-dinner",
    title: "Client dinner",
    start: set(addDays(seedDate, 2), { hours: 19, minutes: 0 }),
    end: set(addDays(seedDate, 2), { hours: 21, minutes: 0 }),
    color: "#0891b2",
  },
]

export function WeekCalendarExample() {
  const [date, setDate] = React.useState(seedDate)
  const [events, setEvents] = React.useState(weekEvents)

  function handleNavigate(direction: -1 | 1) {
    setDate((currentDate) => shiftDate(currentDate, "week", direction))
  }

  function handleCreate(operation: CalendarCreateOperation) {
    setEvents((currentEvents) => [
      ...currentEvents,
      createEventFromOperation(operation, {
        title: "New session",
        color: "#2563eb",
      }),
    ])
  }

  function handleMove(operation: CalendarMoveOperation) {
    setEvents((currentEvents) => applyMoveOperation(currentEvents, operation))
  }

  function handleResize(operation: CalendarResizeOperation) {
    setEvents((currentEvents) => applyResizeOperation(currentEvents, operation))
  }

  return (
    <CalendarScheduler
      availableViews={["week"]}
      classNames={docsCalendarExampleClassNames}
      date={date}
      events={events}
      onDateChange={setDate}
      onEventCreate={handleCreate}
      onEventMove={handleMove}
      onEventResize={handleResize}
      onNavigate={handleNavigate}
      onToday={() => setDate(seedDate)}
      onViewChange={() => {}}
      scrollToTime="08:30"
      view="week"
    />
  )
}
