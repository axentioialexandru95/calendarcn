"use client"

import * as React from "react"
import { addDays, set } from "date-fns"

import type {
  CalendarCreateOperation,
  CalendarEvent,
  CalendarMoveOperation,
  CalendarResizeOperation,
  CalendarView,
} from "@/components/calendar"
import { CalendarRoot } from "@/components/calendar"
import {
  applyMoveOperation,
  applyResizeOperation,
  createEventFromOperation,
  shiftDate,
} from "@/components/calendar/utils"

const seedDate = new Date("2026-03-24T09:00:00.000Z")

const starterEvents: CalendarEvent[] = [
  {
    id: "standup",
    title: "Studio standup",
    start: set(seedDate, { hours: 9, minutes: 0 }),
    end: set(seedDate, { hours: 9, minutes: 30 }),
    color: "#2563eb",
    calendarId: "product",
    calendarLabel: "Product",
  },
  {
    id: "crit",
    title: "Interface crit",
    start: set(seedDate, { hours: 10, minutes: 0 }),
    end: set(seedDate, { hours: 11, minutes: 30 }),
    color: "#db2777",
    calendarId: "design",
    calendarLabel: "Design",
  },
  {
    id: "focus",
    title: "Focus block",
    start: set(seedDate, { hours: 13, minutes: 0 }),
    end: set(seedDate, { hours: 15, minutes: 0 }),
    color: "#7c3aed",
    calendarId: "product",
    calendarLabel: "Product",
  },
  {
    id: "planning",
    title: "Planning review",
    start: set(addDays(seedDate, 1), { hours: 15, minutes: 0 }),
    end: set(addDays(seedDate, 1), { hours: 16, minutes: 30 }),
    color: "#ea580c",
    calendarId: "product",
    calendarLabel: "Product",
  },
  {
    id: "client-dinner",
    title: "Client dinner",
    start: set(addDays(seedDate, 2), { hours: 19, minutes: 0 }),
    end: set(addDays(seedDate, 2), { hours: 21, minutes: 0 }),
    color: "#0891b2",
    calendarId: "ops",
    calendarLabel: "Operations",
    location: "Bucharest",
  },
]

export function BasicCalendarExample() {
  const [date, setDate] = React.useState(seedDate)
  const [events, setEvents] = React.useState(starterEvents)
  const [view, setView] = React.useState<CalendarView>("week")

  function handleNavigate(direction: -1 | 1) {
    setDate((currentDate) => shiftDate(currentDate, view, direction))
  }

  function handleCreate(operation: CalendarCreateOperation) {
    setEvents((currentEvents) => [
      ...currentEvents,
      createEventFromOperation(operation, {
        title: "New session",
        calendarId: "product",
        calendarLabel: "Product",
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
    <div className="h-[640px] overflow-hidden rounded-[2rem] border border-border/70 bg-background shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)]">
      <CalendarRoot
        date={date}
        events={events}
        onDateChange={setDate}
        onEventCreate={handleCreate}
        onEventMove={handleMove}
        onEventResize={handleResize}
        onNavigate={handleNavigate}
        onToday={() => setDate(seedDate)}
        onViewChange={setView}
        scrollToTime="08:30"
        view={view}
      />
    </div>
  )
}
