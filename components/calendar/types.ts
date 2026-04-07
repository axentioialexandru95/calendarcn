import type { ReactNode } from "react"

export const calendarViews = [
  "month",
  "week",
  "day",
  "timeline",
  "agenda",
] as const

export type CalendarView = (typeof calendarViews)[number]

export type CalendarDensity = "comfortable" | "compact"

export type CalendarSurfaceShadow = "none" | "sm" | "md"
export type CalendarSurfaceVariant = "card" | "flush"

export type CalendarEventMenuPosition = {
  x: number
  y: number
}

export const calendarEventVariants = [
  "month",
  "all-day",
  "time-grid",
  "timeline",
  "agenda",
] as const

export type CalendarEventVariant = (typeof calendarEventVariants)[number]

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
  "timelineGrid",
  "timelineHeader",
  "timelineRow",
  "timelineEvent",
  "agendaList",
  "agendaGroup",
  "agendaEvent",
  "dragOverlay",
] as const

export type CalendarSlot = (typeof calendarSlots)[number]

export type CalendarClassNames = Partial<Record<CalendarSlot, string>>

export type CalendarWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export type CalendarBusinessHoursWindow = {
  days?: CalendarWeekday[]
  start: string
  end: string
}

export type CalendarRecurrenceEditScope = "occurrence" | "following" | "series"

export type CalendarBlockedRange = {
  id: string
  start: Date
  end: Date
  label?: string
  color?: string
}

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
  archived?: boolean
  color?: string
  calendarId?: string
  calendarLabel?: string
  timeZone?: string
  recurrence?: CalendarRecurrenceRule
  resourceId?: string
  description?: string
  location?: string
  readOnly?: boolean
  canArchive?: boolean
  canDelete?: boolean
  canDuplicate?: boolean
  canMove?: boolean
  canOpenDetails?: boolean
  canResize?: boolean
  canUpdate?: boolean
  data?: Record<string, unknown>
}

export type CalendarEventCreateDefaults = Partial<
  Pick<
    CalendarEvent,
    | "allDay"
    | "archived"
    | "calendarId"
    | "calendarLabel"
    | "color"
    | "data"
    | "description"
    | "location"
    | "readOnly"
    | "resourceId"
    | "timeZone"
    | "title"
  >
>

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
  nextResourceId?: string
  previousStart: Date
  previousEnd: Date
  allDay?: boolean
  scope?: CalendarRecurrenceEditScope
}

export type CalendarResizeOperation = {
  occurrence: CalendarOccurrence
  nextStart: Date
  nextEnd: Date
  previousStart: Date
  previousEnd: Date
  edge: "start" | "end"
  scope?: CalendarRecurrenceEditScope
}

export type CalendarEventUpdateOperation = {
  occurrence: CalendarOccurrence
  nextEvent: CalendarEvent
  previousEvent: CalendarEvent
  scope?: CalendarRecurrenceEditScope
}

export type CalendarCreateOperation = {
  start: Date
  end: Date
  allDay?: boolean
  resourceId?: string
  title?: string
  color?: string
  calendarId?: string
  calendarLabel?: string
  timeZone?: string
  description?: string
  location?: string
  readOnly?: boolean
  data?: Record<string, unknown>
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

export type CalendarToolbarExtrasRenderProps = {
  activeResourceIds: string[]
  availableViews: CalendarView[]
  resources: CalendarResource[]
  view: CalendarView
}

export type CalendarEmptyStateRenderProps = {
  activeResourceIds: string[]
  clearResourceFilter: () => void
  resources: CalendarResource[]
  view: CalendarView
}

export type CalendarEventDetailsRenderProps = {
  canEdit: boolean
  close: () => void
  isEditing: boolean
  occurrence: CalendarOccurrence
  resource?: CalendarResource
  resources: CalendarResource[]
  startEditing: () => void
  submitUpdate: (nextEvent: CalendarEvent) => string | void
}

export type CalendarEventContextAction = "archive" | "delete" | "duplicate"

export type CalendarEventChangeAction = "move" | "resize"

export type CalendarEventChangeConfirmationContext =
  | ({
      action: "move"
    } & CalendarMoveOperation)
  | ({
      action: "resize"
    } & CalendarResizeOperation)

export type CalendarEventChangeConfirmation =
  | boolean
  | {
      title?:
        | string
        | ((context: CalendarEventChangeConfirmationContext) => string)
      description?:
        | string
        | ((context: CalendarEventChangeConfirmationContext) => string)
      confirmLabel?:
        | string
        | ((context: CalendarEventChangeConfirmationContext) => string)
      cancelLabel?: string
      shouldConfirm?: (
        context: CalendarEventChangeConfirmationContext
      ) => boolean
    }

export type CalendarEventDetailsConfig =
  | boolean
  | {
      title?: string
      description?: string
      editLabel?: string
      submitLabel?: string
      cancelLabel?: string
      closeLabel?: string
      openOnSelect?: boolean
    }

export type CalendarKeyboardShortcutsConfig =
  | boolean
  | {
      title?: string
      description?: string
      buttonLabel?: string
      trigger?: "?" | "button" | "both"
    }

export type CalendarICSExportOptions = {
  calendarName?: string
  productId?: string
  timeZone?: string
}

export type CalendarICSParseOptions = {
  defaultCalendarLabel?: string
  defaultTimeZone?: string
}

export type CalendarCreateSheetConfig =
  | boolean
  | {
      title?: string
      description?: string
      submitLabel?: string
      cancelLabel?: string
    }

export type CalendarCreateDraft = {
  day: Date
  startMinute: number
  endMinute: number
}

export type CalendarDayDropTarget = {
  kind: "day" | "all-day"
  day: Date
  resourceId?: string
}

export type CalendarSlotDropTarget = {
  kind: "slot"
  day: Date
  minuteOfDay: number
  resourceId?: string
}

export type CalendarDropTarget = CalendarDayDropTarget | CalendarSlotDropTarget

export type CalendarDragData =
  | {
      kind: "event"
      occurrence: CalendarOccurrence
      variant: CalendarEventVariant
    }
  | {
      kind: "resize"
      occurrence: CalendarOccurrence
      edge: "start" | "end"
      variant: CalendarEventVariant
    }
