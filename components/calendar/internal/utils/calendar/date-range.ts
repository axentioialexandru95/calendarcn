import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  getDay,
  set,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns"

import type {
  CalendarEvent,
  CalendarView,
  CalendarWeekday,
} from "../../../types"
import { calendarViews } from "../../../types"

const allWeekdays: CalendarWeekday[] = [0, 1, 2, 3, 4, 5, 6]
const MILLISECONDS_IN_DAY = 86_400_000

export type VisibleRangeOptions = {
  agendaDays?: number
  hiddenDays?: CalendarWeekday[]
  hourCycle?: 12 | 24
  locale?: string
  timeZone?: string
  weekStartsOn?: CalendarWeekday
}

export type CalendarVisibleRange = {
  start: Date
  end: Date
}

function getVisibleDaysInRange(
  range: CalendarVisibleRange,
  hiddenDays?: CalendarWeekday[]
) {
  return eachDayOfInterval(range).filter((day) => !isHiddenDay(day, hiddenDays))
}

export function parseTimeStringToMinuteOfDay(value: string) {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(value.trim())

  if (!match) {
    return null
  }

  return Number(match[1]) * 60 + Number(match[2])
}

export function normalizeHiddenDays(hiddenDays?: CalendarWeekday[]) {
  const nextHiddenDays = Array.from(new Set(hiddenDays ?? [])).filter(
    (day): day is CalendarWeekday =>
      allWeekdays.includes(day as CalendarWeekday)
  )

  return nextHiddenDays.length === allWeekdays.length ? [] : nextHiddenDays
}

export function normalizeAvailableViews(availableViews?: CalendarView[]) {
  const nextAvailableViews = calendarViews.filter((view) =>
    availableViews?.includes(view)
  )

  return nextAvailableViews.length ? nextAvailableViews : [...calendarViews]
}

export function resolveCalendarView(
  view: CalendarView,
  availableViews?: CalendarView[]
) {
  const nextAvailableViews = normalizeAvailableViews(availableViews)

  return nextAvailableViews.includes(view) ? view : nextAvailableViews[0]
}

export function getNextVisibleDay(
  anchorDate: Date,
  hiddenDays?: CalendarWeekday[],
  direction: -1 | 1 = 1,
  includeAnchor = true
) {
  const nextHiddenDays = normalizeHiddenDays(hiddenDays)

  if (nextHiddenDays.length === 0) {
    return anchorDate
  }

  let cursor = anchorDate
  let stepsRemaining = 8

  if (!includeAnchor) {
    cursor = addDays(cursor, direction)
  }

  while (stepsRemaining > 0) {
    if (!nextHiddenDays.includes(getDay(cursor) as CalendarWeekday)) {
      return cursor
    }

    cursor = addDays(cursor, direction)
    stepsRemaining -= 1
  }

  return anchorDate
}

export function isHiddenDay(day: Date, hiddenDays?: CalendarWeekday[]) {
  return normalizeHiddenDays(hiddenDays).includes(
    getDay(day) as CalendarWeekday
  )
}

export function getVisibleRange(
  anchorDate: Date,
  view: CalendarView,
  options: VisibleRangeOptions = {}
): CalendarVisibleRange {
  const weekStartsOn = options.weekStartsOn ?? 1

  if (view === "month") {
    const monthStart = startOfMonth(anchorDate)
    const monthEnd = endOfMonth(anchorDate)

    return {
      start: startOfWeek(monthStart, { weekStartsOn }),
      end: endOfWeek(monthEnd, { weekStartsOn }),
    }
  }

  if (view === "week") {
    return {
      start: startOfWeek(anchorDate, { weekStartsOn }),
      end: endOfWeek(anchorDate, { weekStartsOn }),
    }
  }

  if (view === "agenda") {
    const agendaDays = options.agendaDays ?? 14

    return {
      start: startOfDay(anchorDate),
      end: endOfDay(addDays(anchorDate, agendaDays - 1)),
    }
  }

  return {
    start: startOfDay(anchorDate),
    end: endOfDay(anchorDate),
  }
}

export function shiftDate(
  anchorDate: Date,
  view: CalendarView,
  direction: -1 | 1,
  hiddenDays?: CalendarWeekday[]
) {
  if (view === "month") {
    return addMonths(anchorDate, direction)
  }

  if (view === "week" || view === "agenda") {
    return addWeeks(anchorDate, direction)
  }

  return getNextVisibleDay(anchorDate, hiddenDays, direction, false)
}

export function getMonthDays(
  anchorDate: Date,
  weekStartsOn: CalendarWeekday,
  hiddenDays?: CalendarWeekday[]
) {
  const range = getVisibleRange(anchorDate, "month", { weekStartsOn })

  return getVisibleDaysInRange(range, hiddenDays)
}

export function getWeekDays(
  anchorDate: Date,
  weekStartsOn: CalendarWeekday,
  hiddenDays?: CalendarWeekday[]
) {
  const start = startOfWeek(anchorDate, { weekStartsOn })

  return Array.from({ length: 7 }, (_, index) => addDays(start, index)).filter(
    (day) => !isHiddenDay(day, hiddenDays)
  )
}

export function getWeekZoomDayCounts(visibleDayCount: number) {
  if (visibleDayCount <= 1) {
    return [1]
  }

  if (visibleDayCount <= 3) {
    return [visibleDayCount]
  }

  if (visibleDayCount <= 5) {
    return [visibleDayCount, 3]
  }

  return [visibleDayCount, 5, 3]
}

export function getZoomedWeekDays(
  anchorDate: Date,
  weekStartsOn: CalendarWeekday,
  visibleDayCount: number,
  hiddenDays?: CalendarWeekday[]
) {
  const weekDays = getWeekDays(anchorDate, weekStartsOn, hiddenDays)

  if (visibleDayCount >= weekDays.length) {
    return weekDays
  }

  const focusDay = getNextVisibleDay(anchorDate, hiddenDays)
  const focusIndex = weekDays.findIndex(
    (day) => day.getTime() === startOfDay(focusDay).getTime()
  )
  const normalizedFocusIndex = focusIndex >= 0 ? focusIndex : 0
  const maxStartIndex = Math.max(0, weekDays.length - visibleDayCount)
  const unclampedStartIndex =
    normalizedFocusIndex - Math.floor(visibleDayCount / 2)
  const startIndex = Math.min(Math.max(0, unclampedStartIndex), maxStartIndex)

  return weekDays.slice(startIndex, startIndex + visibleDayCount)
}

export function getAgendaDays(
  range: CalendarVisibleRange,
  hiddenDays?: CalendarWeekday[]
) {
  return getVisibleDaysInRange(range, hiddenDays)
}

export function copyTimeParts(targetDay: Date, sourceDate: Date) {
  return set(targetDay, {
    hours: sourceDate.getHours(),
    minutes: sourceDate.getMinutes(),
    seconds: sourceDate.getSeconds(),
    milliseconds: sourceDate.getMilliseconds(),
  })
}

export function setMinuteOfDay(day: Date, minuteOfDay: number) {
  const hours = Math.floor(minuteOfDay / 60)
  const minutes = minuteOfDay % 60

  return set(day, {
    hours,
    minutes,
    seconds: 0,
    milliseconds: 0,
  })
}

export function getMinuteOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes()
}

export function getDaySpan(event: Pick<CalendarEvent, "start" | "end">) {
  return Math.max(
    1,
    Math.ceil(
      (event.end.getTime() - event.start.getTime()) / MILLISECONDS_IN_DAY
    )
  )
}
