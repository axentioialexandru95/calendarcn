import type { ReactNode } from "react"

export const calendarViews = ["month", "week", "day", "agenda"] as const

export type CalendarView = (typeof calendarViews)[number]

export const calendarSlots = [
  "root",
  "shell",
  "toolbar",
  "toolbarGroup",
  "toolbarTitle",
  "viewSwitcher",
  "viewButton",
  "monthGrid",
  "monthCell",
  "monthCellMuted",
  "monthEvent",
  "timeGrid",
  "timeGridHeader",
  "timeGridDayColumn",
  "timeGridSlot",
  "timeGridEvent",
  "allDayLane",
  "agendaList",
  "agendaGroup",
  "agendaEvent",
  "dragOverlay",
] as const

export type CalendarSlot = (typeof calendarSlots)[number]

export type CalendarClassNames = Partial<Record<CalendarSlot, string>>

export type CalendarWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type CalendarRecurrenceFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"

export type CalendarRecurrenceRule = {
  frequency: CalendarRecurrenceFrequency
  interval?: number
  count?: number
  until?: Date
  byWeekday?: CalendarWeekday[]
  byMonthDay?: number[]
}

export type CalendarResource = {
  id: string
  label: string
  color?: string
  timeZone?: string
  description?: string
  avatar?: ReactNode
}

export type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  allDay?: boolean
  color?: string
  calendarId?: string
  calendarLabel?: string
  timeZone?: string
  recurrence?: CalendarRecurrenceRule
  resourceId?: string
  description?: string
  location?: string
  readOnly?: boolean
  data?: Record<string, unknown>
}

export type CalendarOccurrence = CalendarEvent & {
  occurrenceId: string
  sourceEventId: string
  isRecurringInstance: boolean
  seriesIndex: number
}

export type CalendarMoveOperation = {
  occurrence: CalendarOccurrence
  nextStart: Date
  nextEnd: Date
  previousStart: Date
  previousEnd: Date
  allDay?: boolean
}

export type CalendarResizeOperation = {
  occurrence: CalendarOccurrence
  nextStart: Date
  nextEnd: Date
  previousStart: Date
  previousEnd: Date
  edge: "start" | "end"
}

export type CalendarCreateOperation = {
  start: Date
  end: Date
  allDay?: boolean
  resourceId?: string
}

export type CalendarEventRenderProps = {
  occurrence: CalendarOccurrence
  accentColor: string
  timeLabel: string
  isDragging: boolean
  isCompact: boolean
}

export type CalendarEventRenderer = (
  props: CalendarEventRenderProps
) => ReactNode

export type CalendarCreateDraft = {
  day: Date
  startMinute: number
  endMinute: number
}

export type CalendarDayDropTarget = {
  kind: "day" | "all-day"
  day: Date
}

export type CalendarSlotDropTarget = {
  kind: "slot"
  day: Date
  minuteOfDay: number
}

export type CalendarDropTarget =
  | CalendarDayDropTarget
  | CalendarSlotDropTarget

export type CalendarDragData =
  | {
      kind: "event"
      occurrence: CalendarOccurrence
    }
  | {
      kind: "resize"
      occurrence: CalendarOccurrence
      edge: "start" | "end"
    }

