"use client"

import * as React from "react"
import { addDays, set } from "date-fns"

import type {
  CalendarCreateOperation,
  CalendarEvent,
  CalendarMoveOperation,
  CalendarResizeOperation,
} from "@/components/calendar"
import { CalendarRoot } from "@/components/calendar"
import {
  applyMoveOperation,
  applyResizeOperation,
  createEventFromOperation,
  shiftDate,
} from "@/components/calendar/utils"
import { docsCalendarExampleClassNames } from "@/content/examples/calendar/shared"

const seedDate = new Date("2026-03-24T09:00:00.000Z")

const monthEvents: CalendarEvent[] = [
  {
    id: "offsite",
    title: "Offsite in Berlin",
    start: set(seedDate, { date: 26, hours: 0, minutes: 0 }),
    end: set(seedDate, { date: 29, hours: 0, minutes: 0 }),
    allDay: true,
    color: "#16a34a",
  },
  {
    id: "launch-week",
    title: "Launch week",
    start: set(seedDate, { date: 30, hours: 0, minutes: 0 }),
    end: set(addDays(seedDate, 10), { hours: 0, minutes: 0 }),
    allDay: true,
    color: "#7c3aed",
  },
  {
    id: "planning",
    title: "Planning review",
    start: set(seedDate, { date: 25, hours: 15, minutes: 0 }),
    end: set(seedDate, { date: 25, hours: 16, minutes: 30 }),
    color: "#ea580c",
  },
]

export function MonthCalendarExample() {
  const [date, setDate] = React.useState(seedDate)
  const [events, setEvents] = React.useState(monthEvents)

  function handleNavigate(direction: -1 | 1) {
    setDate((currentDate) => shiftDate(currentDate, "month", direction))
  }

  function handleCreate(operation: CalendarCreateOperation) {
    setEvents((currentEvents) => [
      ...currentEvents,
      createEventFromOperation(operation, {
        title: "New milestone",
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
    <CalendarRoot
      availableViews={["month"]}
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
      view="month"
    />
  )
}
