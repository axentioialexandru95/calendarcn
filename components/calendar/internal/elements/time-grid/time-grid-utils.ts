import { isSameDay, startOfDay } from "date-fns"

import type {
  CalendarCreateDraft,
  CalendarOccurrence,
} from "../../../types"
import {
  formatDurationLabel,
  formatEventTimeLabel,
  formatHourLabel,
  formatMonthDayLabel,
  formatWeekday,
  getDayLayout,
  setMinuteOfDay,
} from "../../../utils"

export type FocusedTimeSlot = {
  dayIndex: number
  minuteOfDay: number
}

export function formatDraftRangeLabel(
  draft: CalendarCreateDraft,
  options: {
    day: Date
    hourCycle?: 12 | 24
    locale?: string
    slotDuration: number
    timeZone?: string
  }
) {
  const startMinute = Math.min(draft.startMinute, draft.endMinute)
  const endMinute = Math.max(draft.startMinute, draft.endMinute)
  const start = setMinuteOfDay(startOfDay(options.day), startMinute)
  const end = setMinuteOfDay(
    startOfDay(options.day),
    Math.min(endMinute + options.slotDuration, 1_440)
  )

  return `${formatEventTimeLabel(start, end, {
    hourCycle: options.hourCycle,
    locale: options.locale,
    timeZone: options.timeZone,
  })} · ${formatDurationLabel(start, end)}`
}

export function getTimeGridPreviewLayout(
  layout: ReturnType<typeof getDayLayout>,
  previewOccurrence: CalendarOccurrence | undefined,
  day: Date,
  minMinute: number,
  maxMinute: number
) {
  if (!previewOccurrence || previewOccurrence.allDay) {
    return null
  }

  const previewLayout = getDayLayout(
    [
      ...layout
        .map((item) => item.occurrence)
        .filter(
          (occurrence) =>
            occurrence.occurrenceId !== previewOccurrence.occurrenceId
        ),
      previewOccurrence,
    ],
    day,
    minMinute,
    maxMinute
  )

  return (
    previewLayout.find(
      (item) => item.occurrence.occurrenceId === previewOccurrence.occurrenceId
    ) ?? null
  )
}

export function getDefaultFocusedTimeSlot(
  days: Date[],
  minMinute: number,
  maxMinute: number,
  slotDuration: number
): FocusedTimeSlot {
  const today = new Date()
  const todayIndex = days.findIndex((day) => isSameDay(day, today))
  const currentMinuteOfDay = today.getHours() * 60 + today.getMinutes()

  return {
    dayIndex: todayIndex >= 0 ? todayIndex : 0,
    minuteOfDay: clampGridMinute(
      currentMinuteOfDay,
      minMinute,
      maxMinute,
      slotDuration
    ),
  }
}

export function normalizeFocusedTimeSlot(
  focusedSlot: FocusedTimeSlot,
  dayCount: number,
  minMinute: number,
  maxMinute: number,
  slotDuration: number
): FocusedTimeSlot {
  return {
    dayIndex: Math.min(Math.max(focusedSlot.dayIndex, 0), Math.max(dayCount - 1, 0)),
    minuteOfDay: clampGridMinute(
      focusedSlot.minuteOfDay,
      minMinute,
      maxMinute,
      slotDuration
    ),
  }
}

export function clampGridMinute(
  minuteOfDay: number,
  minMinute: number,
  maxMinute: number,
  slotDuration: number
) {
  const maxSlotMinute = Math.max(minMinute, maxMinute - slotDuration)
  const normalizedMinute = Math.max(minMinute, Math.min(maxSlotMinute, minuteOfDay))
  const roundedOffset = Math.round((normalizedMinute - minMinute) / slotDuration)

  return minMinute + roundedOffset * slotDuration
}

export function getTimeGridHeaderId(day: Date) {
  return `calendar-time-grid-heading-${day.getTime()}`
}

export function getTimeGridSlotId(day: Date, minuteOfDay: number) {
  return `calendar-time-grid-slot-${day.getTime()}-${minuteOfDay}`
}

export function formatTimeGridSlotLabel(
  day: Date,
  minuteOfDay: number,
  options: {
    blocked: boolean
    hourCycle?: 12 | 24
    locale?: string
    timeZone?: string
  }
) {
  return `${formatWeekday(day, {
    locale: options.locale,
    timeZone: options.timeZone,
  })} ${formatMonthDayLabel(day, {
    locale: options.locale,
    timeZone: options.timeZone,
  })} at ${formatHourLabel(setMinuteOfDay(day, minuteOfDay), {
    hourCycle: options.hourCycle,
    locale: options.locale,
    timeZone: options.timeZone,
  })}${options.blocked ? ", unavailable" : ""}`
}
