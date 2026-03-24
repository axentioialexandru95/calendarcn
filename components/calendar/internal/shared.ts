import type { KeyboardEvent } from "react"

import type {
  CalendarClassNames,
  CalendarCreateOperation,
  CalendarEvent,
  CalendarEventVariant,
  CalendarEventRenderer,
  CalendarMoveOperation,
  CalendarOccurrence,
  CalendarResizeOperation,
  CalendarResource,
  CalendarView,
  CalendarWeekday,
} from "../types"

export const slotHeight = 30
export const defaultSlotDuration = 30
export const defaultMinHour = 6
export const defaultMaxHour = 23
export const maxMonthEvents = 4

export type CalendarRootProps = {
  date: Date
  events: CalendarEvent[]
  view: CalendarView
  onDateChange: (date: Date) => void
  onViewChange: (view: CalendarView) => void
  onNavigate?: (direction: -1 | 1) => void
  onToday?: () => void
  onEventMove?: (operation: CalendarMoveOperation) => void
  onEventResize?: (operation: CalendarResizeOperation) => void
  onEventCreate?: (operation: CalendarCreateOperation) => void
  onEventSelect?: (occurrence: CalendarOccurrence) => void
  onSelectedEventChange?: (id?: string) => void
  selectedEventId?: string
  timeZone?: string
  resources?: CalendarResource[]
  classNames?: CalendarClassNames
  weekStartsOn?: CalendarWeekday
  agendaDays?: number
  slotDuration?: number
  minHour?: number
  maxHour?: number
  renderEvent?: CalendarEventRenderer
  getEventColor?: (occurrence: CalendarOccurrence) => string
}

export type CalendarToolbarProps = {
  classNames?: CalendarClassNames
  currentLabel: string
  onNavigate: (direction: -1 | 1) => void
  onQuickCreate?: () => void
  onToday: () => void
  onViewChange: (view: CalendarView) => void
  resources?: CalendarResource[]
  timeZone?: string
  view: CalendarView
}

export type SharedViewProps = {
  anchorDate: Date
  classNames?: CalendarClassNames
  getEventColor?: (occurrence: CalendarOccurrence) => string
  interactive: boolean
  occurrences: CalendarOccurrence[]
  onEventCreate?: (operation: CalendarCreateOperation) => void
  onEventKeyCommand: (
    occurrence: CalendarOccurrence,
    event: KeyboardEvent<HTMLButtonElement>
  ) => void
  onSelectEvent: (occurrence: CalendarOccurrence) => void
  renderEvent?: CalendarEventRenderer
  selectedEventId?: string
  slotDuration: number
  timeZone?: string
  weekStartsOn: CalendarWeekday
}

export type TimeGridViewProps = SharedViewProps & {
  days: Date[]
  minHour: number
  maxHour: number
}

export type CalendarAgendaViewProps = SharedViewProps & {
  range: {
    start: Date
    end: Date
  }
}

export type EventVariant = CalendarEventVariant
