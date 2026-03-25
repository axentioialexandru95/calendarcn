import type { ComponentType } from "react"

import type { TypeNode } from "fumadocs-ui/components/type-table"

import { BasicCalendarExample } from "@/content/examples/calendar/basic"
import { AgendaCalendarExample } from "@/content/examples/calendar/agenda"
import { DayCalendarExample } from "@/content/examples/calendar/day"
import { InteractionCalendarExample } from "@/content/examples/calendar/interactions"
import { MonthCalendarExample } from "@/content/examples/calendar/month"
import { ResourceCalendarExample } from "@/content/examples/calendar/resources"
import { WeekCalendarExample } from "@/content/examples/calendar/week"
import { WorkweekCalendarExample } from "@/content/examples/calendar/workweek"

export const calendarUsageSnippet = `"use client"

import * as React from "react"

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

export function TeamSchedule() {
  const [date, setDate] = React.useState(new Date())
  const [events, setEvents] = React.useState<CalendarEvent[]>([])
  const [view, setView] = React.useState<CalendarView>("week")

  function handleNavigate(direction: -1 | 1) {
    setDate((currentDate) => shiftDate(currentDate, view, direction))
  }

  function handleCreate(operation: CalendarCreateOperation) {
    setEvents((currentEvents) => [
      ...currentEvents,
      createEventFromOperation(operation, {
        title: "New event",
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
      date={date}
      events={events}
      onDateChange={setDate}
      onEventCreate={handleCreate}
      onEventMove={handleMove}
      onEventResize={handleResize}
      onNavigate={handleNavigate}
      onToday={() => setDate(new Date())}
      onViewChange={setView}
      view={view}
    />
  )
}`

export const calendarExamples = {
  basic: {
    group: "pattern",
    highlights: ["Controlled state", "All core views", "Create, move, resize"],
    href: "/docs/components/calendar/starter",
    tabLabel: "Starter",
    title: "Starter surface",
    description:
      "A controlled week calendar with local create, move, and resize handlers wired directly into state.",
    filePath: "content/examples/calendar/basic.tsx",
    component: BasicCalendarExample,
  },
  workweek: {
    group: "pattern",
    highlights: ["Compact density", "Weekday-only", "Business hour constraints"],
    href: "/docs/components/calendar/workweek",
    tabLabel: "Workweek",
    title: "Workweek constraints",
    description:
      "Compact density, weekday-only navigation, business hours, and blocked ranges for focused team planning.",
    filePath: "content/examples/calendar/workweek.tsx",
    component: WorkweekCalendarExample,
  },
  resources: {
    group: "pattern",
    highlights: ["Resource lanes", "Shared interaction model", "Day + agenda views"],
    href: "/docs/components/calendar/resources",
    tabLabel: "Resources",
    title: "Resource lanes",
    description:
      "Assign events to teams, rooms, or calendars and keep the same editing model across each lane.",
    filePath: "content/examples/calendar/resources.tsx",
    component: ResourceCalendarExample,
  },
  interactions: {
    group: "pattern",
    highlights: ["Optimistic updates", "Move confirmation", "Built-in create sheet"],
    href: "/docs/components/calendar/interactions",
    tabLabel: "Interactions",
    title: "Direct editing flow",
    description:
      "Combine optimistic move and resize updates with create sheets and optional move confirmations.",
    filePath: "content/examples/calendar/interactions.tsx",
    component: InteractionCalendarExample,
  },
  month: {
    group: "view",
    highlights: ["Long-range planning", "All-day spans", "Milestones and campaigns"],
    href: "/docs/components/calendar/month",
    tabLabel: "Month",
    title: "Month view",
    description:
      "Use the month surface for high-level planning, all-day scheduling, and multi-day event visibility.",
    filePath: "content/examples/calendar/month.tsx",
    component: MonthCalendarExample,
  },
  week: {
    group: "view",
    highlights: ["Time grid planning", "Drag and resize", "Seven-day coordination"],
    href: "/docs/components/calendar/week",
    tabLabel: "Week",
    title: "Week view",
    description:
      "The week grid is the main interactive planning surface for timed events, editing, and schedule density.",
    filePath: "content/examples/calendar/week.tsx",
    component: WeekCalendarExample,
  },
  day: {
    group: "view",
    highlights: ["Single-day focus", "High detail", "Tighter daily coordination"],
    href: "/docs/components/calendar/day",
    tabLabel: "Day",
    title: "Day view",
    description:
      "Reduce the schedule to one day when users need focus, denser event detail, or single-day workflows.",
    filePath: "content/examples/calendar/day.tsx",
    component: DayCalendarExample,
  },
  agenda: {
    group: "view",
    highlights: ["List layout", "Upcoming schedule", "Great for mobile and read-only views"],
    href: "/docs/components/calendar/agenda",
    tabLabel: "Agenda",
    title: "Agenda view",
    description:
      "Render the schedule as a chronological list for upcoming events, summaries, or lower-density layouts.",
    filePath: "content/examples/calendar/agenda.tsx",
    component: AgendaCalendarExample,
  },
} satisfies Record<
  string,
  {
    title: string
    description: string
    group: "pattern" | "view"
    highlights: string[]
    href: string
    filePath: string
    component: ComponentType
    tabLabel: string
  }
>

export type CalendarExampleId = keyof typeof calendarExamples

export const calendarApiSections = {
  core: {
    agendaDays: {
      default: "14",
      description: "Number of days to include when the current view is `agenda`.",
      type: "`number`",
    },
    availableViews: {
      description:
        "Restrict the visible view switcher and resolve the current view against that list.",
      type: "`CalendarView[]`",
    },
    date: {
      description: "Anchor date for the visible range. Required and fully controlled.",
      required: true,
      type: "`Date`",
    },
    events: {
      description:
        "Base event records. CalendarCN expands recurrence and computes visible occurrences for the active range.",
      required: true,
      type: "`CalendarEvent[]`",
    },
    onDateChange: {
      description: "Called when the calendar changes its anchor date.",
      parameters: [
        {
          description: "The next anchor date for the current range.",
          name: "date",
        },
      ],
      required: true,
      returns: "`void`",
      type: "`(date) => void`",
    },
    onViewChange: {
      description: "Called when the user switches between month, week, day, and agenda.",
      parameters: [
        {
          description: "The next active view.",
          name: "view",
        },
      ],
      required: true,
      returns: "`void`",
      type: "`(view) => void`",
    },
    view: {
      description:
        "Current visible mode. Use with `date` for a fully controlled calendar state model.",
      required: true,
      type: "`CalendarView`",
    },
  },
  interactions: {
    createEventSheet: {
      description:
        "Enable the built-in create sheet and optionally customize its labels and copy.",
      type: "`boolean | { title?: string; description?: string; submitLabel?: string; cancelLabel?: string }`",
    },
    eventChangeConfirmation: {
      description:
        "Gate move and resize commits behind your own confirmation logic, labels, and copy.",
      type: "`boolean | CalendarEventChangeConfirmation`",
    },
    onEventArchive: {
      description: "Archive the selected occurrence from the built-in context menu.",
      returns: "`void`",
      type: "`(occurrence) => void`",
    },
    onEventCreate: {
      description:
        "Persist a newly created time range. Pair with `createEventFromOperation` for quick local state wiring.",
      parameters: [
        {
          description: "The draft event timing and optional metadata.",
          name: "operation",
        },
      ],
      returns: "`void`",
      type: "`(operation) => void`",
    },
    onEventDelete: {
      description: "Delete the selected occurrence from the built-in context menu.",
      returns: "`void`",
      type: "`(occurrence) => void`",
    },
    onEventDuplicate: {
      description: "Duplicate the selected occurrence from the built-in context menu.",
      returns: "`void`",
      type: "`(occurrence) => void`",
    },
    onEventMove: {
      description:
        "Commit a drag move. The calendar already computes the next timing, so your handler can focus on persistence.",
      parameters: [
        {
          description: "Previous and next timing for the moved occurrence.",
          name: "operation",
        },
      ],
      returns: "`void`",
      type: "`(operation) => void`",
    },
    onEventResize: {
      description:
        "Commit a resize change from the start or end handle with the resolved next range.",
      parameters: [
        {
          description: "Previous and next timing for the resized occurrence.",
          name: "operation",
        },
      ],
      returns: "`void`",
      type: "`(operation) => void`",
    },
    onEventSelect: {
      description: "Called whenever the user selects or focuses an occurrence.",
      returns: "`void`",
      type: "`(occurrence) => void`",
    },
    onNavigate: {
      description:
        "Override previous and next navigation. If omitted, CalendarCN shifts the controlled `date` for you.",
      parameters: [
        {
          description: "`-1` for backward navigation and `1` for forward navigation.",
          name: "direction",
        },
      ],
      returns: "`void`",
      type: "`(direction) => void`",
    },
    onSelectedEventChange: {
      description:
        "Control the currently selected occurrence if your app needs external selection state.",
      returns: "`void`",
      type: "`(occurrenceId?) => void`",
    },
    onToday: {
      description:
        "Override the default Today action. Useful when your examples or seeded schedules should reset to a fixed anchor date.",
      returns: "`void`",
      type: "`() => void`",
    },
    selectedEventId: {
      description:
        "Currently selected occurrence id when you control selection outside the calendar.",
      type: "`string | undefined`",
    },
  },
  scheduling: {
    blockedRanges: {
      description:
        "Timed segments that render as unavailable and block overlapping moves, resizes, and creates.",
      type: "`CalendarBlockedRange[]`",
    },
    businessHours: {
      description:
        "Working windows per weekday, used to visually emphasize valid scheduling hours.",
      type: "`CalendarBusinessHoursWindow[]`",
    },
    hiddenDays: {
      description:
        "Remove weekdays from week and agenda navigation, such as `[0, 6]` for a focused workweek.",
      type: "`CalendarWeekday[]`",
    },
    locale: {
      description: "Locale passed into all date and time labels.",
      type: "`string`",
    },
    resources: {
      description:
        "Optional lane definitions for team, room, or calendar-based scheduling.",
      type: "`CalendarResource[]`",
    },
    timeZone: {
      description:
        "Time zone used for labels and date formatting when your schedule is not local to the viewer.",
      type: "`string`",
    },
    weekStartsOn: {
      default: "1",
      description: "Weekday index used for week and month boundaries.",
      type: "`0 | 1 | 2 | 3 | 4 | 5 | 6`",
    },
  },
  display: {
    classNames: {
      description:
        "Per-slot class overrides for the root, toolbar, month cells, time-grid surface, agenda list, and drag overlay.",
      type: "`CalendarClassNames`",
    },
    density: {
      default: "`comfortable`",
      description: "Toggle between the default surface density and a compact planner layout.",
      type: "`\"comfortable\" | \"compact\"`",
    },
    getEventColor: {
      description:
        "Resolve the accent color for each occurrence without mutating the underlying event records.",
      returns: "`string`",
      type: "`(occurrence) => string`",
    },
    hourCycle: {
      description: "Render time labels in 12-hour or 24-hour format.",
      type: "`12 | 24`",
    },
    maxHour: {
      default: "23",
      description: "Last visible hour in day and week views.",
      type: "`number`",
    },
    minHour: {
      default: "6",
      description: "First visible hour in day and week views.",
      type: "`number`",
    },
    renderEvent: {
      description:
        "Replace the built-in event card body while preserving positioning, drag handles, and selection.",
      returns: "`ReactNode`",
      type: "`CalendarEventRenderer`",
    },
    scrollToTime: {
      description:
        "Initial scroll position for day and week views. Use `\"now\"` or a `HH:mm` string.",
      type: "`\"now\" | string`",
    },
    slotDuration: {
      default: "30",
      description: "Minute step used for time-grid slots and resize snapping.",
      type: "`number`",
    },
    slotHeight: {
      description:
        "Override the rendered slot height when you need tighter or roomier time-grid spacing.",
      type: "`number`",
    },
  },
} satisfies Record<string, Record<string, TypeNode>>

export type CalendarApiSectionId = keyof typeof calendarApiSections
