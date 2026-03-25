import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react"

import type {
  CalendarBlockedRange,
  CalendarBusinessHoursWindow,
  CalendarClassNames,
  CalendarCreateOperation,
  CalendarCreateSheetConfig,
  CalendarDensity,
  CalendarEvent,
  CalendarEventChangeConfirmation,
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
export const compactSlotHeight = 24
export const defaultSlotDuration = 30
export const defaultMinHour = 6
export const defaultMaxHour = 23
export const maxMonthEvents = 4

export type CalendarEventMenuPosition = {
  x: number
  y: number
}

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
  createEventSheet?: CalendarCreateSheetConfig
  eventChangeConfirmation?: CalendarEventChangeConfirmation
  onEventArchive?: (occurrence: CalendarOccurrence) => void
  onEventDelete?: (occurrence: CalendarOccurrence) => void
  onEventDuplicate?: (occurrence: CalendarOccurrence) => void
  onEventSelect?: (occurrence: CalendarOccurrence) => void
  onSelectedEventChange?: (id?: string) => void
  selectedEventId?: string
  timeZone?: string
  resources?: CalendarResource[]
  classNames?: CalendarClassNames
  availableViews?: CalendarView[]
  blockedRanges?: CalendarBlockedRange[]
  businessHours?: CalendarBusinessHoursWindow[]
  density?: CalendarDensity
  hiddenDays?: CalendarWeekday[]
  weekStartsOn?: CalendarWeekday
  agendaDays?: number
  locale?: string
  slotDuration?: number
  slotHeight?: number
  minHour?: number
  maxHour?: number
  hourCycle?: 12 | 24
  scrollToTime?: "now" | string
  renderEvent?: CalendarEventRenderer
  getEventColor?: (occurrence: CalendarOccurrence) => string
}

export type CalendarToolbarProps = {
  availableViews: CalendarView[]
  classNames?: CalendarClassNames
  currentLabel: string
  density?: CalendarDensity
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
  blockedRanges?: CalendarBlockedRange[]
  businessHours?: CalendarBusinessHoursWindow[]
  classNames?: CalendarClassNames
  density: CalendarDensity
  dragPreviewOccurrence?: CalendarOccurrence
  getEventColor?: (occurrence: CalendarOccurrence) => string
  hiddenDays: CalendarWeekday[]
  hourCycle?: 12 | 24
  interactive: boolean
  locale?: string
  occurrences: CalendarOccurrence[]
  previewOccurrenceId?: string
  onEventCreate?: (operation: CalendarCreateOperation) => void
  onEventKeyCommand: (
    occurrence: CalendarOccurrence,
    event: KeyboardEvent<HTMLButtonElement>
  ) => void
  onResizeHandlePointerDown?: (
    occurrence: CalendarOccurrence,
    edge: "start" | "end",
    event: ReactPointerEvent<HTMLSpanElement>
  ) => void
  onOpenContextMenu?: (
    occurrence: CalendarOccurrence,
    position: CalendarEventMenuPosition
  ) => void
  onSelectEvent: (occurrence: CalendarOccurrence) => void
  renderEvent?: CalendarEventRenderer
  scrollToTime?: "now" | string
  selectedEventId?: string
  slotDuration: number
  slotHeight: number
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
