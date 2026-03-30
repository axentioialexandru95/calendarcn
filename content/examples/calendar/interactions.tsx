"use client"

import * as React from "react"
import { addDays, set } from "date-fns"

import type {
  CalendarCreateOperation,
  CalendarEvent,
  CalendarEventChangeConfirmation,
  CalendarMoveOperation,
  CalendarResizeOperation,
  CalendarView,
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

const interactiveEvents: CalendarEvent[] = [
  {
    id: "standup",
    title: "Studio standup",
    start: set(seedDate, { hours: 9, minutes: 0 }),
    end: set(seedDate, { hours: 9, minutes: 30 }),
    color: "#2563eb",
  },
  {
    id: "focus-block",
    title: "Focus block",
    start: set(seedDate, { hours: 13, minutes: 0 }),
    end: set(seedDate, { hours: 15, minutes: 0 }),
    color: "#7c3aed",
  },
  {
    id: "planning",
    title: "Planning review",
    start: set(addDays(seedDate, 1), { hours: 15, minutes: 0 }),
    end: set(addDays(seedDate, 1), { hours: 16, minutes: 30 }),
    color: "#ea580c",
  },
]

const moveConfirmation: CalendarEventChangeConfirmation = {
  shouldConfirm: (context) => context.action === "move",
  title: ({ occurrence }) => `Move ${occurrence.title}?`,
  description:
    "Use the confirmation hook when your app needs to validate or persist a schedule change before finalizing it.",
  confirmLabel: "Apply change",
}

export function InteractionCalendarExample() {
  const [date, setDate] = React.useState(seedDate)
  const [events, setEvents] = React.useState(interactiveEvents)
  const [selectedEventId, setSelectedEventId] = React.useState<string>()
  const [view, setView] = React.useState<CalendarView>("week")

  function handleNavigate(direction: -1 | 1) {
    setDate((currentDate) => shiftDate(currentDate, view, direction))
  }

  function handleCreate(operation: CalendarCreateOperation) {
    setEvents((currentEvents) => [
      ...currentEvents,
      createEventFromOperation(operation, {
        title: "New appointment",
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
      classNames={docsCalendarExampleClassNames}
      createEventSheet={{
        title: "New appointment",
        description: "Capture details before the event lands on the schedule.",
        submitLabel: "Create event",
      }}
      date={date}
      eventChangeConfirmation={moveConfirmation}
      events={events}
      onDateChange={setDate}
      onEventCreate={handleCreate}
      onEventMove={handleMove}
      onEventResize={handleResize}
      onNavigate={handleNavigate}
      onSelectedEventChange={setSelectedEventId}
      onToday={() => setDate(seedDate)}
      onViewChange={setView}
      scrollToTime="08:30"
      selectedEventId={selectedEventId}
      view={view}
    />
  )
}
