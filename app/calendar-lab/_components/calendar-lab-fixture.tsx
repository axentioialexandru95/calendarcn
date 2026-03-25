"use client"

import * as React from "react"
import { set } from "date-fns"

import {
  CalendarRoot,
  type CalendarEvent,
  type CalendarEventChangeConfirmation,
  type CalendarView,
} from "@/components/calendar"
import { useCalendarController } from "@/hooks/use-calendar-controller"
import {
  buildDemoBlockedRanges,
  buildDemoBusinessHours,
  buildDemoEvents,
  buildDemoResources,
} from "@/lib/calendar-demo-data"

type CalendarLabScenario = "confirm" | "default" | "details" | "recurrence"

type CalendarLabFixtureProps = {
  initialDateIso: string
  scenario?: CalendarLabScenario
}

const createSheetConfig = {
  description: "Capture the details before the appointment lands on the schedule.",
  submitLabel: "Create appointment",
  title: "New appointment",
} as const

const createDefaults = {
  calendarId: "product",
  calendarLabel: "Product",
  color: "#2563eb",
  resourceId: "product",
} as const

const fullViewSet: CalendarView[] = ["month", "week", "day", "agenda"]

export function CalendarLabFixture({
  initialDateIso,
  scenario = "default",
}: CalendarLabFixtureProps) {
  const [initialDate] = React.useState(() => new Date(initialDateIso))
  const resources = React.useMemo(() => buildDemoResources(), [])
  const blockedRanges = React.useMemo(
    () => buildDemoBlockedRanges(initialDate),
    [initialDate]
  )
  const businessHours = React.useMemo(() => buildDemoBusinessHours(), [])
  const initialEvents = React.useMemo(
    () => buildScenarioEvents(initialDate, scenario),
    [initialDate, scenario]
  )
  const availableViews = scenario === "recurrence" ? (["week"] as CalendarView[]) : fullViewSet
  const controller = useCalendarController({
    availableViews,
    createDefaults,
    initialDate,
    initialEvents,
    initialView: "week",
  })
  const eventChangeConfirmation: CalendarEventChangeConfirmation | undefined =
    scenario === "confirm" ? true : undefined

  return (
    <main className="min-h-svh bg-background px-4 py-6 text-foreground">
      <div className="mx-auto max-w-7xl">
        <CalendarRoot
          availableViews={availableViews}
          blockedRanges={blockedRanges}
          businessHours={businessHours}
          createEventSheet={createSheetConfig}
          date={controller.date}
          eventChangeConfirmation={eventChangeConfirmation}
          eventDetails={scenario === "details" ? true : undefined}
          events={controller.events}
          hourCycle={24}
          keyboardShortcuts={scenario === "details" ? true : undefined}
          locale="en-GB"
          onDateChange={controller.setDate}
          onEventArchive={controller.handleEventArchive}
          onEventCreate={controller.handleEventCreate}
          onEventDelete={controller.handleEventDelete}
          onEventDuplicate={controller.handleEventDuplicate}
          onEventMove={controller.handleEventMove}
          onEventResize={controller.handleEventResize}
          onEventUpdate={
            scenario === "details" ? controller.handleEventUpdate : undefined
          }
          onNavigate={controller.step}
          onSelectedEventChange={controller.setSelectedEventId}
          onToday={controller.goToToday}
          onViewChange={controller.setView}
          secondaryTimeZone={
            scenario === "details" ? "America/New_York" : undefined
          }
          resources={resources}
          showSecondaryTimeZone={scenario === "details"}
          defaultResourceFilter={
            scenario === "details" ? ["product", "operations"] : undefined
          }
          scrollToTime="08:00"
          selectedEventId={controller.selectedEventId}
          timeZone="Europe/Bucharest"
          view={controller.view}
        />
      </div>
    </main>
  )
}

function buildScenarioEvents(
  initialDate: Date,
  scenario: CalendarLabScenario
): CalendarEvent[] {
  const events = buildDemoEvents(initialDate)

  if (scenario !== "recurrence") {
    return events
  }

  return [
    ...events,
    {
      id: "daily-sync",
      title: "Daily sync",
      start: set(initialDate, {
        hours: 8,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      }),
      end: set(initialDate, {
        hours: 8,
        minutes: 30,
        seconds: 0,
        milliseconds: 0,
      }),
      color: "#2563eb",
      calendarId: "product",
      calendarLabel: "Product",
      recurrence: {
        count: 3,
        frequency: "daily",
      },
      resourceId: "product",
    },
  ]
}
