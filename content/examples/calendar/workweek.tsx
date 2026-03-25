"use client"

import * as React from "react"
import { set } from "date-fns"

import type {
  CalendarBlockedRange,
  CalendarBusinessHoursWindow,
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

const businessHours: CalendarBusinessHoursWindow[] = [
  {
    days: [1, 2, 3, 4, 5],
    start: "09:00",
    end: "18:00",
  },
]

const blockedRanges: CalendarBlockedRange[] = [
  {
    id: "lunch",
    label: "Lunch",
    start: set(seedDate, { hours: 12, minutes: 0 }),
    end: set(seedDate, { hours: 13, minutes: 0 }),
    color: "#ea580c",
  },
  {
    id: "release-freeze",
    label: "Release freeze",
    start: set(seedDate, { date: 25, hours: 16, minutes: 0 }),
    end: set(seedDate, { date: 25, hours: 17, minutes: 0 }),
    color: "#db2777",
  },
]

const constrainedEvents: CalendarEvent[] = [
  {
    id: "standup",
    title: "Standup",
    start: set(seedDate, { hours: 9, minutes: 0 }),
    end: set(seedDate, { hours: 9, minutes: 30 }),
    color: "#2563eb",
  },
  {
    id: "design-review",
    title: "Design review",
    start: set(seedDate, { hours: 10, minutes: 0 }),
    end: set(seedDate, { hours: 11, minutes: 30 }),
    color: "#db2777",
  },
  {
    id: "planning",
    title: "Planning review",
    start: set(seedDate, { date: 25, hours: 15, minutes: 0 }),
    end: set(seedDate, { date: 25, hours: 16, minutes: 30 }),
    color: "#ea580c",
  },
]

export function WorkweekCalendarExample() {
  const [date, setDate] = React.useState(seedDate)
  const [events, setEvents] = React.useState(constrainedEvents)
  const [view, setView] = React.useState<CalendarView>("week")

  function handleNavigate(direction: -1 | 1) {
    setDate((currentDate) => shiftDate(currentDate, view, direction, [0, 6]))
  }

  function handleCreate(operation: CalendarCreateOperation) {
    setEvents((currentEvents) => [
      ...currentEvents,
      createEventFromOperation(operation, {
        title: "New work block",
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
        availableViews={["week", "day", "agenda"]}
        blockedRanges={blockedRanges}
        businessHours={businessHours}
        date={date}
        density="compact"
        events={events}
        hiddenDays={[0, 6] as const}
        hourCycle={24}
        locale="en-GB"
        onDateChange={setDate}
        onEventCreate={handleCreate}
        onEventMove={handleMove}
        onEventResize={handleResize}
        onNavigate={handleNavigate}
        onToday={() => setDate(seedDate)}
        onViewChange={setView}
        scrollToTime="08:00"
        view={view}
      />
    </div>
  )
}
