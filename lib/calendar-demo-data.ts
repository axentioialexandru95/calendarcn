import { addDays, set } from "date-fns"

import type {
  CalendarEvent,
  CalendarResource,
} from "@/components/calendar/types"

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
  const day = set(baseDate, {
    seconds: 0,
    milliseconds: 0,
  })

  return [
    {
      id: "standup",
      title: "Studio standup",
      start: set(day, { hours: 9, minutes: 0 }),
      end: set(day, { hours: 9, minutes: 30 }),
      color: "#2563eb",
      calendarId: "product",
      calendarLabel: "Product",
      resourceId: "product",
      recurrence: {
        frequency: "daily",
        interval: 1,
        count: 10,
      },
    },
    {
      id: "crit",
      title: "Interface crit",
      start: set(day, { hours: 10, minutes: 0 }),
      end: set(day, { hours: 11, minutes: 30 }),
      color: "#db2777",
      calendarId: "design",
      calendarLabel: "Design",
      resourceId: "design",
      description: "Review the new dense calendar interactions and mobile layout",
    },
    {
      id: "handoff",
      title: "Support handoff",
      start: set(day, { hours: 10, minutes: 45 }),
      end: set(day, { hours: 11, minutes: 45 }),
      color: "#0f766e",
      calendarId: "ops",
      calendarLabel: "Operations",
      resourceId: "ops",
    },
    {
      id: "focus",
      title: "Focus block",
      start: set(day, { hours: 13, minutes: 0 }),
      end: set(day, { hours: 15, minutes: 0 }),
      color: "#7c3aed",
      calendarId: "product",
      calendarLabel: "Product",
      resourceId: "product",
    },
    {
      id: "planning",
      title: "Planning review",
      start: set(addDays(day, 1), { hours: 15, minutes: 0 }),
      end: set(addDays(day, 1), { hours: 16, minutes: 30 }),
      color: "#ea580c",
      calendarId: "product",
      calendarLabel: "Product",
      resourceId: "product",
      recurrence: {
        frequency: "weekly",
        interval: 1,
        count: 8,
        byWeekday: [2, 4],
      },
    },
    {
      id: "dinner",
      title: "Client dinner",
      start: set(addDays(day, 2), { hours: 19, minutes: 0 }),
      end: set(addDays(day, 2), { hours: 21, minutes: 0 }),
      color: "#0891b2",
      calendarId: "ops",
      calendarLabel: "Operations",
      resourceId: "ops",
      location: "Bucharest",
    },
    {
      id: "travel",
      title: "Offsite in Berlin",
      start: set(addDays(day, 3), { hours: 0, minutes: 0 }),
      end: set(addDays(day, 5), { hours: 0, minutes: 0 }),
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
      start: set(addDays(day, -1), { hours: 16, minutes: 0 }),
      end: set(addDays(day, -1), { hours: 17, minutes: 0 }),
      color: "#db2777",
      calendarId: "design",
      calendarLabel: "Design",
      resourceId: "design",
      recurrence: {
        frequency: "weekly",
        interval: 1,
        count: 10,
        byWeekday: [3],
      },
    },
  ]
}
