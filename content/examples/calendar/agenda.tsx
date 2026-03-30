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

const agendaEvents: CalendarEvent[] = [
  {
    id: "standup",
    title: "Studio standup",
    start: set(seedDate, { hours: 9, minutes: 0 }),
    end: set(seedDate, { hours: 9, minutes: 30 }),
    color: "#2563eb",
  },
  {
    id: "review",
    title: "Planning review",
    start: set(addDays(seedDate, 1), { hours: 15, minutes: 0 }),
    end: set(addDays(seedDate, 1), { hours: 16, minutes: 30 }),
    color: "#ea580c",
  },
  {
    id: "dinner",
    title: "Client dinner",
    start: set(addDays(seedDate, 2), { hours: 19, minutes: 0 }),
    end: set(addDays(seedDate, 2), { hours: 21, minutes: 0 }),
    color: "#0891b2",
  },
  {
    id: "offsite",
    title: "Berlin offsite",
    start: set(addDays(seedDate, 3), { hours: 0, minutes: 0 }),
    end: set(addDays(seedDate, 5), { hours: 0, minutes: 0 }),
    allDay: true,
    color: "#16a34a",
  },
]

export function AgendaCalendarExample() {
  const [date, setDate] = React.useState(seedDate)
  const [events, setEvents] = React.useState(agendaEvents)

  function handleNavigate(direction: -1 | 1) {
    setDate((currentDate) => shiftDate(currentDate, "agenda", direction))
  }

  function handleCreate(operation: CalendarCreateOperation) {
    setEvents((currentEvents) => [
      ...currentEvents,
      createEventFromOperation(operation, {
        title: "New event",
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
      agendaDays={8}
      availableViews={["agenda"]}
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
      view="agenda"
    />
  )
}
