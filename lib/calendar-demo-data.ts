import { setDateInTimeZone } from "./timezone-date"

import type {
  CalendarBlockedRange,
  CalendarBusinessHoursWindow,
  CalendarEvent,
  CalendarResource,
} from "@/components/calendar/types"

export const CALENDAR_DEMO_SEED_VERSION = "2026-04-07-snapped-grid-v1"
export const CALENDAR_DEMO_TIME_ZONE = "Europe/Bucharest"

export function buildDemoBusinessHours(): CalendarBusinessHoursWindow[] {
  return [
    {
      days: [1, 2, 3, 4, 5],
      start: "09:00",
      end: "18:00",
    },
  ]
}

export function buildDemoBlockedRanges(
  baseDate = new Date()
): CalendarBlockedRange[] {
  return [
    {
      id: "lunch-block",
      label: "Lunch",
      start: setDateInTimeZone(baseDate, CALENDAR_DEMO_TIME_ZONE, {
        hours: 12,
        minutes: 0,
        seconds: 0,
      }),
      end: setDateInTimeZone(baseDate, CALENDAR_DEMO_TIME_ZONE, {
        hours: 13,
        minutes: 0,
        seconds: 0,
      }),
      color: "#ea580c",
    },
    {
      id: "ops-freeze",
      label: "Release freeze",
      start: setDateInTimeZone(baseDate, CALENDAR_DEMO_TIME_ZONE, {
        dayOffset: 1,
        hours: 16,
        minutes: 0,
        seconds: 0,
      }),
      end: setDateInTimeZone(baseDate, CALENDAR_DEMO_TIME_ZONE, {
        dayOffset: 1,
        hours: 17,
        minutes: 0,
        seconds: 0,
      }),
      color: "#db2777",
    },
  ]
}

export function buildDemoResources(): CalendarResource[] {
  return [
    {
      id: "product",
      label: "Product",
      color: "#2563eb",
      description: "Roadmap, discovery, launches",
    },
    {
      id: "design",
      label: "Design",
      color: "#db2777",
      description: "Crits, explorations, reviews",
    },
    {
      id: "ops",
      label: "Operations",
      color: "#0f766e",
      description: "Support, logistics, vendor calls",
    },
  ]
}

export function buildDemoEvents(baseDate = new Date()): CalendarEvent[] {
  return [
    {
      id: "standup",
      title: "Studio standup",
      start: setDateInTimeZone(baseDate, CALENDAR_DEMO_TIME_ZONE, {
        hours: 9,
        minutes: 0,
        seconds: 0,
      }),
      end: setDateInTimeZone(baseDate, CALENDAR_DEMO_TIME_ZONE, {
        hours: 9,
        minutes: 30,
        seconds: 0,
      }),
      color: "#2563eb",
      calendarId: "product",
      calendarLabel: "Product",
      resourceId: "product",
    },
    {
      id: "crit",
      title: "Interface crit",
      start: setDateInTimeZone(baseDate, CALENDAR_DEMO_TIME_ZONE, {
        hours: 10,
        minutes: 0,
        seconds: 0,
      }),
      end: setDateInTimeZone(baseDate, CALENDAR_DEMO_TIME_ZONE, {
        hours: 11,
        minutes: 30,
        seconds: 0,
      }),
      color: "#db2777",
      calendarId: "design",
      calendarLabel: "Design",
      resourceId: "design",
      description:
        "Review the new dense calendar interactions and mobile layout",
    },
    {
      id: "handoff",
      title: "Support handoff",
      start: setDateInTimeZone(baseDate, CALENDAR_DEMO_TIME_ZONE, {
        hours: 10,
        minutes: 30,
        seconds: 0,
      }),
      end: setDateInTimeZone(baseDate, CALENDAR_DEMO_TIME_ZONE, {
        hours: 11,
        minutes: 30,
        seconds: 0,
      }),
      color: "#0f766e",
      calendarId: "ops",
      calendarLabel: "Operations",
      resourceId: "ops",
    },
    {
      id: "focus",
      title: "Focus block",
      start: setDateInTimeZone(baseDate, CALENDAR_DEMO_TIME_ZONE, {
        hours: 13,
        minutes: 0,
        seconds: 0,
      }),
      end: setDateInTimeZone(baseDate, CALENDAR_DEMO_TIME_ZONE, {
        hours: 15,
        minutes: 0,
        seconds: 0,
      }),
      color: "#7c3aed",
      calendarId: "product",
      calendarLabel: "Product",
      resourceId: "product",
    },
    {
      id: "planning",
      title: "Planning review",
      start: setDateInTimeZone(baseDate, CALENDAR_DEMO_TIME_ZONE, {
        dayOffset: 1,
        hours: 14,
        minutes: 0,
        seconds: 0,
      }),
      end: setDateInTimeZone(baseDate, CALENDAR_DEMO_TIME_ZONE, {
        dayOffset: 1,
        hours: 15,
        minutes: 30,
        seconds: 0,
      }),
      color: "#ea580c",
      calendarId: "product",
      calendarLabel: "Product",
      resourceId: "product",
    },
    {
      id: "dinner",
      title: "Client dinner",
      start: setDateInTimeZone(baseDate, CALENDAR_DEMO_TIME_ZONE, {
        dayOffset: 2,
        hours: 19,
        minutes: 0,
        seconds: 0,
      }),
      end: setDateInTimeZone(baseDate, CALENDAR_DEMO_TIME_ZONE, {
        dayOffset: 2,
        hours: 21,
        minutes: 0,
        seconds: 0,
      }),
      color: "#0891b2",
      calendarId: "ops",
      calendarLabel: "Operations",
      resourceId: "ops",
      location: "Bucharest",
    },
    {
      id: "travel",
      title: "Offsite in Berlin",
      start: setDateInTimeZone(baseDate, CALENDAR_DEMO_TIME_ZONE, {
        dayOffset: 3,
        hours: 0,
        minutes: 0,
        seconds: 0,
      }),
      end: setDateInTimeZone(baseDate, CALENDAR_DEMO_TIME_ZONE, {
        dayOffset: 5,
        hours: 0,
        minutes: 0,
        seconds: 0,
      }),
      allDay: true,
      color: "#16a34a",
      calendarId: "design",
      calendarLabel: "Design",
      resourceId: "design",
      description: "Team offsite and partner workshops",
    },
    {
      id: "office-hours",
      title: "Design office hours",
      start: setDateInTimeZone(baseDate, CALENDAR_DEMO_TIME_ZONE, {
        dayOffset: -1,
        hours: 16,
        minutes: 0,
        seconds: 0,
      }),
      end: setDateInTimeZone(baseDate, CALENDAR_DEMO_TIME_ZONE, {
        dayOffset: -1,
        hours: 17,
        minutes: 0,
        seconds: 0,
      }),
      color: "#db2777",
      calendarId: "design",
      calendarLabel: "Design",
      resourceId: "design",
    },
  ]
}

export function buildDemoDenseOverlapEvents(
  baseDate = new Date()
): CalendarEvent[] {
  const overlapBlueprints: Array<{
    calendarId: "design" | "ops" | "product"
    color: string
    end: [number, number]
    id: string
    location?: string
    start: [number, number]
    title: string
  }> = [
    {
      id: "overlap-01",
      title: "Product review",
      start: [11, 0],
      end: [11, 30],
      color: "#2563eb",
      calendarId: "product",
    },
    {
      id: "overlap-02",
      title: "Incident triage",
      start: [11, 0],
      end: [12, 0],
      color: "#0f766e",
      calendarId: "ops",
    },
    {
      id: "overlap-03",
      title: "Launch prep",
      start: [11, 0],
      end: [12, 30],
      color: "#ea580c",
      calendarId: "product",
    },
    {
      id: "overlap-04",
      title: "Design QA",
      start: [11, 30],
      end: [12, 0],
      color: "#db2777",
      calendarId: "design",
    },
    {
      id: "overlap-05",
      title: "Client callback",
      start: [11, 30],
      end: [12, 30],
      color: "#0891b2",
      calendarId: "ops",
      location: "Zoom",
    },
    {
      id: "overlap-06",
      title: "API pairing",
      start: [11, 30],
      end: [13, 0],
      color: "#7c3aed",
      calendarId: "product",
    },
    {
      id: "overlap-07",
      title: "Support sweep",
      start: [12, 0],
      end: [12, 30],
      color: "#16a34a",
      calendarId: "ops",
    },
    {
      id: "overlap-08",
      title: "Copy pass",
      start: [12, 0],
      end: [13, 0],
      color: "#f59e0b",
      calendarId: "design",
    },
    {
      id: "overlap-09",
      title: "Sprint checkpoint",
      start: [12, 0],
      end: [13, 30],
      color: "#ef4444",
      calendarId: "product",
    },
    {
      id: "overlap-10",
      title: "Ops handoff",
      start: [12, 30],
      end: [13, 30],
      color: "#14b8a6",
      calendarId: "ops",
    },
  ]

  return overlapBlueprints.map((event) => ({
    id: event.id,
    title: event.title,
    start: setDateInTimeZone(baseDate, CALENDAR_DEMO_TIME_ZONE, {
      hours: event.start[0],
      minutes: event.start[1],
      seconds: 0,
    }),
    end: setDateInTimeZone(baseDate, CALENDAR_DEMO_TIME_ZONE, {
      hours: event.end[0],
      minutes: event.end[1],
      seconds: 0,
    }),
    color: event.color,
    calendarId: event.calendarId,
    calendarLabel:
      event.calendarId === "product"
        ? "Product"
        : event.calendarId === "design"
          ? "Design"
          : "Operations",
    location: event.location,
    resourceId: event.calendarId,
  }))
}
