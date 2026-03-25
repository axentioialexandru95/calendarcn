"use client"

import * as React from "react"
import { addDays, set } from "date-fns"

import type {
  CalendarCreateOperation,
  CalendarEvent,
  CalendarMoveOperation,
  CalendarResizeOperation,
  CalendarResource,
  CalendarView,
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

const resources: CalendarResource[] = [
  {
    id: "product",
    label: "Product",
    color: "#2563eb",
    description: "Roadmap, launches, discovery",
  },
  {
    id: "design",
    label: "Design",
    color: "#db2777",
    description: "Crits, prototypes, reviews",
  },
  {
    id: "ops",
    label: "Operations",
    color: "#0f766e",
    description: "Support, logistics, vendor calls",
  },
]

const resourceEvents: CalendarEvent[] = [
  {
    id: "product-standup",
    title: "Product standup",
    start: set(seedDate, { hours: 9, minutes: 0 }),
    end: set(seedDate, { hours: 9, minutes: 30 }),
    color: "#2563eb",
    resourceId: "product",
  },
  {
    id: "design-crit",
    title: "Design crit",
    start: set(seedDate, { hours: 10, minutes: 0 }),
    end: set(seedDate, { hours: 11, minutes: 0 }),
    color: "#db2777",
    resourceId: "design",
  },
  {
    id: "ops-handoff",
    title: "Support handoff",
    start: set(seedDate, { hours: 11, minutes: 0 }),
    end: set(seedDate, { hours: 11, minutes: 45 }),
    color: "#0f766e",
    resourceId: "ops",
  },
  {
    id: "product-review",
    title: "Planning review",
    start: set(addDays(seedDate, 1), { hours: 15, minutes: 0 }),
    end: set(addDays(seedDate, 1), { hours: 16, minutes: 30 }),
    color: "#ea580c",
    resourceId: "product",
  },
]

export function ResourceCalendarExample() {
  const [date, setDate] = React.useState(seedDate)
  const [events, setEvents] = React.useState(resourceEvents)
  const [view, setView] = React.useState<CalendarView>("day")

  function handleNavigate(direction: -1 | 1) {
    setDate((currentDate) => shiftDate(currentDate, view, direction))
  }

  function handleCreate(operation: CalendarCreateOperation) {
    setEvents((currentEvents) => [
      ...currentEvents,
      createEventFromOperation(operation, {
        title: "New handoff",
        color: "#2563eb",
        resourceId: operation.resourceId ?? resources[0].id,
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
      availableViews={["day", "agenda"]}
      classNames={docsCalendarExampleClassNames}
      date={date}
      events={events}
      onDateChange={setDate}
      onEventCreate={handleCreate}
      onEventMove={handleMove}
      onEventResize={handleResize}
      onNavigate={handleNavigate}
      onToday={() => setDate(seedDate)}
      onViewChange={setView}
      resources={resources}
      scrollToTime="08:30"
      view={view}
    />
  )
}
