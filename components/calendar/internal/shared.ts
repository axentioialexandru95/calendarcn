import type {
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react"

import type {
  CalendarBlockedRange,
  CalendarBusinessHoursWindow,
  CalendarClassNames,
  CalendarCreateOperation,
  CalendarCreateSheetConfig,
  CalendarDensity,
  CalendarDropTarget,
  CalendarEvent,
  CalendarEventChangeConfirmation,
  CalendarEventMenuPosition,
  CalendarEventDetailsConfig,
  CalendarEventDetailsRenderProps,
  CalendarEventVariant,
  CalendarEventRenderer,
  CalendarEventUpdateOperation,
  CalendarEmptyStateRenderProps,
  CalendarKeyboardShortcutsConfig,
  CalendarMoveOperation,
  CalendarOccurrence,
  CalendarResizeOperation,
  CalendarResource,
  CalendarToolbarExtrasRenderProps,
  CalendarSurfaceShadow,
  CalendarSurfaceVariant,
  CalendarView,
  CalendarWeekday,
} from "../types"

export const slotHeight = 30
export const compactSlotHeight = 24
export const defaultSlotDuration = 30
export const defaultMinHour = 6
export const defaultMaxHour = 23
export const maxMonthEvents = 4

export type { CalendarEventMenuPosition }

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
  eventDetails?: CalendarEventDetailsConfig
  onEventArchive?: (occurrence: CalendarOccurrence) => void
  onEventDelete?: (occurrence: CalendarOccurrence) => void
  onEventDuplicate?: (occurrence: CalendarOccurrence) => void
  onEventSelect?: (occurrence: CalendarOccurrence) => void
  onEventUpdate?: (operation: CalendarEventUpdateOperation) => void
  onSelectedEventChange?: (id?: string) => void
  selectedEventId?: string
  timeZone?: string
  secondaryTimeZone?: string
  showSecondaryTimeZone?: boolean
  resources?: CalendarResource[]
  resourceFilter?: string[]
  defaultResourceFilter?: string[]
  onResourceFilterChange?: (resourceIds: string[]) => void
  classNames?: CalendarClassNames
  availableViews?: CalendarView[]
  blockedRanges?: CalendarBlockedRange[]
  businessHours?: CalendarBusinessHoursWindow[]
  density?: CalendarDensity
  surfaceShadow?: CalendarSurfaceShadow
  surfaceVariant?: CalendarSurfaceVariant
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
  renderEventDetails?: (props: CalendarEventDetailsRenderProps) => ReactNode
  renderToolbarExtras?: (props: CalendarToolbarExtrasRenderProps) => ReactNode
  renderEmptyState?: (props: CalendarEmptyStateRenderProps) => ReactNode
  getEventColor?: (occurrence: CalendarOccurrence) => string
  showCreatePreviewMeta?: boolean
  showDragPreviewMeta?: boolean
  keyboardShortcuts?: CalendarKeyboardShortcutsConfig
}

export type CalendarToolbarProps = {
  activeResourceIds: string[]
  availableViews: CalendarView[]
  classNames?: CalendarClassNames
  currentLabel: string
  density?: CalendarDensity
  onNavigate: (direction: -1 | 1) => void
  onOpenKeyboardShortcuts?: () => void
  onQuickCreate?: () => void
  onResourceFilterChange?: (resourceIds: string[]) => void
  onToday: () => void
  onViewChange: (view: CalendarView) => void
  keyboardShortcutsButtonLabel?: string
  renderToolbarExtras?: (props: CalendarToolbarExtrasRenderProps) => ReactNode
  resources?: CalendarResource[]
  secondaryTimeZone?: string
  showSecondaryTimeZone?: boolean
  timeZone?: string
  view: CalendarView
}

export type SharedViewProps = {
  availableViews?: CalendarView[]
  activeResourceIds: string[]
  anchorDate: Date
  blockedRanges?: CalendarBlockedRange[]
  activeDropTarget?: CalendarDropTarget | null
  businessHours?: CalendarBusinessHoursWindow[]
  classNames?: CalendarClassNames
  density: CalendarDensity
  dragPreviewOccurrence?: CalendarOccurrence
  draggingOccurrenceId?: string
  getEventColor?: (occurrence: CalendarOccurrence) => string
  hiddenDays: CalendarWeekday[]
  hourCycle?: 12 | 24
  interactive: boolean
  locale?: string
  occurrences: CalendarOccurrence[]
  onDateChange?: (date: Date) => void
  previewOccurrenceId?: string
  secondaryTimeZone?: string
  showCreatePreviewMeta?: boolean
  showDragPreviewMeta?: boolean
  showSecondaryTimeZone?: boolean
  onEventCreate?: (operation: CalendarCreateOperation) => void
  onEventDragPointerDown?: (
    occurrence: CalendarOccurrence,
    variant: CalendarEventVariant,
    event: ReactPointerEvent<HTMLButtonElement>
  ) => void
  onEventKeyCommand: (
    occurrence: CalendarOccurrence,
    event: KeyboardEvent<HTMLButtonElement>
  ) => void
  onResizeHandlePointerDown?: (
    occurrence: CalendarOccurrence,
    edge: "start" | "end",
    variant: CalendarEventVariant,
    event: ReactPointerEvent<HTMLSpanElement>
  ) => void
  onOpenContextMenu?: (
    occurrence: CalendarOccurrence,
    position: CalendarEventMenuPosition
  ) => void
  onSelectEvent: (occurrence: CalendarOccurrence) => void
  onViewChange?: (view: CalendarView) => void
  shouldSuppressEventClick?: (occurrenceId: string) => boolean
  renderEvent?: CalendarEventRenderer
  resources?: CalendarResource[]
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
