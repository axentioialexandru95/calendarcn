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
  CalendarClassNames,
  CalendarCreateOperation,
  CalendarEvent,
  CalendarMoveOperation,
  CalendarResizeOperation,
  CalendarView,
} from "@/components/calendar/types"
import { CalendarRoot } from "@/components/calendar/root"
import { CalendarToolbar } from "@/components/calendar/toolbar"
import {
  getRangeLabel,
  applyMoveOperation,
  applyResizeOperation,
  createEventFromOperation,
  shiftDate,
} from "@/components/calendar/utils"

const primitiveEventClassNames: CalendarClassNames = {
  agendaEvent:
    "data-[selected=true]:border-ring data-[selected=true]:ring-2 data-[selected=true]:ring-ring/60",
  monthEvent:
    "data-[selected=true]:border-ring data-[selected=true]:ring-2 data-[selected=true]:ring-ring/60",
  timeGridEvent:
    "data-[selected=true]:border-ring data-[selected=true]:ring-2 data-[selected=true]:ring-ring/60",
}

export function TeamSchedule() {
  const [date, setDate] = React.useState(new Date())
  const [events, setEvents] = React.useState<CalendarEvent[]>([])
  const [selectedEventId, setSelectedEventId] = React.useState<string>()
  const [view, setView] = React.useState<CalendarView>("week")
  const currentLabel = React.useMemo(() => getRangeLabel(date, view), [date, view])

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
    <div className="overflow-hidden rounded-[calc(var(--radius)*1.6)] border border-border/70">
      <CalendarToolbar
        activeResourceIds={[]}
        availableViews={["month", "week", "day", "agenda"]}
        currentLabel={currentLabel}
        onNavigate={(direction) =>
          setDate((currentDate) => shiftDate(currentDate, view, direction))
        }
        onToday={() => setDate(new Date())}
        onViewChange={setView}
        view={view}
      />
      <CalendarRoot
        classNames={primitiveEventClassNames}
        date={date}
        events={events}
        onEventCreate={handleCreate}
        onEventMove={handleMove}
        onEventResize={handleResize}
        onSelectedEventChange={setSelectedEventId}
        secondaryTimeZone="America/New_York"
        selectedEventId={selectedEventId}
        showSecondaryTimeZone
        view={view}
      />
    </div>
  )
}`

export const calendarExamples = {
  basic: {
    group: "pattern",
    highlights: ["Primitive root", "Separate toolbar", "Create, move, resize"],
    href: "/docs/calendar/patterns/starter",
    tabLabel: "Starter",
    title: "Primitive starter",
    description:
      "Compose `CalendarRoot` and `CalendarToolbar` directly when you want the smallest install surface and total source ownership.",
    filePath: "content/examples/calendar/basic.tsx",
    component: BasicCalendarExample,
  },
  workweek: {
    group: "pattern",
    highlights: [
      "Compact density",
      "Weekday-only",
      "Business hour constraints",
    ],
    href: "/docs/calendar/patterns/workweek",
    tabLabel: "Workweek",
    title: "Workweek constraints",
    description:
      "Compact density, weekday-only navigation, business hours, and blocked ranges for focused team planning.",
    filePath: "content/examples/calendar/workweek.tsx",
    component: WorkweekCalendarExample,
  },
  resources: {
    group: "pattern",
    highlights: [
      "Resource lanes",
      "Shared interaction model",
      "Day + agenda views",
    ],
    href: "/docs/calendar/patterns/resources",
    tabLabel: "Resources",
    title: "Resource lanes",
    description:
      "Assign events to teams, rooms, or calendars and keep the same editing model across each lane.",
    filePath: "content/examples/calendar/resources.tsx",
    component: ResourceCalendarExample,
  },
  interactions: {
    group: "pattern",
    highlights: [
      "Starter bundle",
      "Move confirmation",
      "Built-in create sheet",
    ],
    href: "/docs/calendar/patterns/interactions",
    tabLabel: "Interactions",
    title: "Direct editing flow",
    description:
      "Use the `CalendarScheduler` starter when you want the current full CalendarCN overlays and productized interaction flow.",
    filePath: "content/examples/calendar/interactions.tsx",
    component: InteractionCalendarExample,
  },
  month: {
    group: "view",
    highlights: [
      "Long-range planning",
      "All-day spans",
      "Milestones and campaigns",
    ],
    href: "/docs/calendar/views/month",
    tabLabel: "Month",
    title: "Month view",
    description:
      "Use the month surface for high-level planning, all-day scheduling, and multi-day event visibility.",
    filePath: "content/examples/calendar/month.tsx",
    component: MonthCalendarExample,
  },
  week: {
    group: "view",
    highlights: [
      "Time grid planning",
      "Drag and resize",
      "Seven-day coordination",
    ],
    href: "/docs/calendar/views/week",
    tabLabel: "Week",
    title: "Week view",
    description:
      "The week grid is the main interactive planning surface for timed events, editing, and schedule density.",
    filePath: "content/examples/calendar/week.tsx",
    component: WeekCalendarExample,
  },
  day: {
    group: "view",
    highlights: [
      "Single-day focus",
      "High detail",
      "Tighter daily coordination",
    ],
    href: "/docs/calendar/views/day",
    tabLabel: "Day",
    title: "Day view",
    description:
      "Reduce the schedule to one day when users need focus, denser event detail, or single-day workflows.",
    filePath: "content/examples/calendar/day.tsx",
    component: DayCalendarExample,
  },
  agenda: {
    group: "view",
    highlights: [
      "List layout",
      "Upcoming schedule",
      "Great for mobile and read-only views",
    ],
    href: "/docs/calendar/views/agenda",
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
      description:
        "Number of days to include when the current view is `agenda`.",
      type: "`number`",
    },
    date: {
      description:
        "Anchor date for the visible range. Required and fully controlled.",
      required: true,
      type: "`Date`",
    },
    events: {
      description:
        "Base event records. CalendarCN expands recurrence and computes visible occurrences for the active range.",
      required: true,
      type: "`CalendarEvent[]`",
    },
    view: {
      description:
        "Current visible mode. Use with `date` for a fully controlled calendar state model.",
      required: true,
      type: "`CalendarView`",
    },
  },
  interactions: {
    onEventCreate: {
      description:
        "Persist a newly created time range immediately. Pair with `createEventFromOperation` for quick local state wiring.",
      parameters: [
        {
          description: "The draft event timing and optional metadata.",
          name: "operation",
        },
      ],
      returns: "`void`",
      type: "`(operation) => void`",
    },
    onEventCreateRequest: {
      description:
        "Intercept creates before they commit. Use this when your app opens a sheet, side panel, or custom form instead of inserting immediately.",
      returns: "`void`",
      type: "`(operation) => void`",
    },
    onEventContextMenu: {
      description:
        "Receive right-click and keyboard context-menu requests from the primitive surface so you can render your own menu or action panel.",
      returns: "`void`",
      type: "`(occurrence, position) => void`",
    },
    onEventMove: {
      description:
        "Commit a drag move immediately. The calendar already computes the next timing, so your handler can focus on persistence.",
      parameters: [
        {
          description: "Previous and next timing for the moved occurrence.",
          name: "operation",
        },
      ],
      returns: "`void`",
      type: "`(operation) => void`",
    },
    onEventMoveRequest: {
      description:
        "Intercept drag moves before they commit. Use this for confirmation dialogs or server-backed validation flows.",
      returns: "`void`",
      type: "`(operation) => void`",
    },
    onEventResize: {
      description:
        "Commit a resize change immediately from the start or end handle with the resolved next range.",
      parameters: [
        {
          description: "Previous and next timing for the resized occurrence.",
          name: "operation",
        },
      ],
      returns: "`void`",
      type: "`(operation) => void`",
    },
    onEventResizeRequest: {
      description:
        "Intercept resize changes before they commit. Use this when resizing needs an extra confirmation or app-level approval step.",
      returns: "`void`",
      type: "`(operation) => void`",
    },
    onEventSelect: {
      description: "Called whenever the user selects or focuses an occurrence.",
      returns: "`void`",
      type: "`(occurrence) => void`",
    },
    onEventUpdate: {
      description:
        "Persist edits from your own event details surface when you pair `CalendarRoot` with the optional event-sheet add-on.",
      parameters: [
        {
          description:
            "The previous event, next event, occurrence metadata, and recurrence scope for the update.",
          name: "operation",
        },
      ],
      returns: "`void`",
      type: "`(operation) => void`",
    },
    onSelectedEventChange: {
      description:
        "Control the currently selected occurrence if your app needs external selection state.",
      returns: "`void`",
      type: "`(occurrenceId?) => void`",
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
    resourceFilter: {
      description:
        "Control the active resource filter from outside the surface. The primitive root never owns this state internally.",
      type: "`string[]`",
    },
    onResourceFilterChange: {
      description:
        "Called when your own toolbar or controls update the visible calendar/resource selection.",
      type: "`(resourceIds) => void`",
    },
    secondaryTimeZone: {
      description:
        "Optional secondary time zone rendered in the week/day time axis and details surfaces.",
      type: "`string`",
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
        "Per-slot class overrides for the root, toolbar, month cells, time-grid surface, agenda list, and drag overlay. Primitive `CalendarRoot` exposes event selection through `data-selected=true`, so use event slots like `timeGridEvent`, `monthEvent`, and `agendaEvent` when you want custom selected styling.",
      type: "`CalendarClassNames`",
    },
    density: {
      default: "`comfortable`",
      description:
        "Toggle between the default surface density and a compact planner layout.",
      type: '`"comfortable" | "compact"`',
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
    renderEmptyState: {
      description:
        "Inject custom content for the empty schedule overlay when no visible events match the current view and filters.",
      returns: "`ReactNode`",
      type: "`(props) => ReactNode`",
    },
    scrollToTime: {
      description:
        'Initial scroll position for day and week views. Use `"now"` or a `HH:mm` string.',
      type: '`"now" | string`',
    },
    showSecondaryTimeZone: {
      description:
        "Render secondary time-zone labels alongside the primary schedule time labels when `secondaryTimeZone` is set.",
      type: "`boolean`",
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
