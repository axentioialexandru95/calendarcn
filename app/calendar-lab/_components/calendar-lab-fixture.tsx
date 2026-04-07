"use client"

import * as React from "react"

import {
  type CalendarEvent,
  type CalendarEventChangeConfirmation,
  type CalendarView,
} from "@/components/calendar/types"
import { CalendarScheduler } from "@/components/calendar/scheduler"
import { useCalendarController } from "@/hooks/use-calendar-controller"
import {
  CALENDAR_DEMO_TIME_ZONE,
  buildDemoBlockedRanges,
  buildDemoBusinessHours,
  buildDemoDenseOverlapEvents,
  buildDemoEvents,
  buildDemoResources,
} from "@/lib/calendar-demo-data"
import { setDateInTimeZone } from "@/lib/timezone-date"

type CalendarLabScenario =
  | "confirm"
  | "default"
  | "details"
  | "overlap"
  | "recurrence"

type CalendarLabFixtureProps = {
  initialDateIso: string
  scenario?: CalendarLabScenario
}

const createSheetConfig = {
  description:
    "Capture the details before the appointment lands on the schedule.",
  submitLabel: "Create appointment",
  title: "New appointment",
} as const

const createDefaults = {
  calendarId: "product",
  calendarLabel: "Product",
  color: "#2563eb",
  resourceId: "product",
} as const

const fullViewSet: CalendarView[] = [
  "month",
  "week",
  "day",
  "timeline",
  "agenda",
]

export function CalendarLabFixture({
  initialDateIso,
  scenario = "default",
}: CalendarLabFixtureProps) {
  const [initialDate] = React.useState(() => new Date(initialDateIso))
  const [isReady, setIsReady] = React.useState(false)
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
  const availableViews =
    scenario === "recurrence" ? (["week"] as CalendarView[]) : fullViewSet
  const controller = useCalendarController({
    availableViews,
    createDefaults,
    initialDate,
    initialEvents,
    initialView: scenario === "overlap" ? "day" : "week",
  })
  const eventChangeConfirmation: CalendarEventChangeConfirmation | undefined =
    scenario === "confirm" ? true : undefined

  React.useEffect(() => {
    setIsReady(true)
  }, [])

  return (
    <main
      className="min-h-svh bg-background px-4 py-6 text-foreground"
      data-calendar-lab-ready={isReady ? "true" : "false"}
    >
      <div className="mx-auto max-w-7xl">
        <CalendarScheduler
          availableViews={availableViews}
          blockedRanges={blockedRanges}
          businessHours={businessHours}
          createEventSheet={createSheetConfig}
          date={controller.date}
          eventChangeConfirmation={eventChangeConfirmation}
          eventDetails={
            scenario === "details" || scenario === "overlap" ? true : undefined
          }
          events={controller.events}
          hourCycle={24}
          keyboardShortcuts={
            scenario === "details" || scenario === "overlap"
              ? true
              : undefined
          }
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
          resources={resources}
          defaultResourceFilter={
            scenario === "details" ? ["product", "operations"] : undefined
          }
          scrollToTime={scenario === "overlap" ? "10:45" : "08:00"}
          selectedEventId={controller.selectedEventId}
          timeZone={CALENDAR_DEMO_TIME_ZONE}
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
  if (scenario === "overlap") {
    return buildDemoDenseOverlapEvents(initialDate)
  }

  const events = buildDemoEvents(initialDate)

  if (scenario === "recurrence") {
    return [
      ...events,
      {
        id: "daily-sync",
        title: "Daily sync",
        start: setDateInTimeZone(initialDate, CALENDAR_DEMO_TIME_ZONE, {
          hours: 8,
          minutes: 0,
          seconds: 0,
        }),
        end: setDateInTimeZone(initialDate, CALENDAR_DEMO_TIME_ZONE, {
          hours: 8,
          minutes: 30,
          seconds: 0,
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

  return events
}
