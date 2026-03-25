import { isSameDay, isSameMonth, isSameYear } from "date-fns"

import type {
  CalendarOccurrence,
  CalendarWeekday,
} from "../../../types"
import {
  getDaySpan,
  getNextVisibleDay,
  getVisibleRange,
  isHiddenDay,
  type VisibleRangeOptions,
} from "./date-range"

type CalendarDateTimeFormatOptions = {
  hourCycle?: 12 | 24
  locale?: string
  timeZone?: string
}

function getDateTimeFormatter(
  options: Intl.DateTimeFormatOptions,
  config: CalendarDateTimeFormatOptions = {}
) {
  return new Intl.DateTimeFormat(config.locale, {
    ...options,
    ...(config.timeZone ? { timeZone: config.timeZone } : {}),
    ...(config.hourCycle ? { hour12: config.hourCycle === 12 } : {}),
  })
}

function formatMonthYearLabel(
  date: Date,
  options: CalendarDateTimeFormatOptions = {}
) {
  return getDateTimeFormatter(
    {
      month: "long",
      year: "numeric",
    },
    options
  ).format(date)
}

export function formatMonthDayLabel(
  date: Date,
  options: CalendarDateTimeFormatOptions = {}
) {
  return getDateTimeFormatter(
    {
      day: "numeric",
      month: "short",
    },
    options
  ).format(date)
}

function formatLongDateLabel(
  date: Date,
  options: CalendarDateTimeFormatOptions = {}
) {
  return getDateTimeFormatter(
    {
      day: "numeric",
      month: "long",
      weekday: "long",
    },
    options
  ).format(date)
}

function formatYearLabel(
  date: Date,
  options: CalendarDateTimeFormatOptions = {}
) {
  return getDateTimeFormatter(
    {
      year: "numeric",
    },
    options
  ).format(date)
}

export function formatDayNumber(
  day: Date,
  options: CalendarDateTimeFormatOptions = {}
) {
  return getDateTimeFormatter(
    {
      day: "numeric",
    },
    options
  ).format(day)
}

function formatRangeDateLabel(
  start: Date,
  end: Date,
  options: CalendarDateTimeFormatOptions = {}
) {
  if (isSameYear(start, end)) {
    if (isSameMonth(start, end)) {
      return `${formatMonthDayLabel(start, options)} - ${formatDayNumber(end, options)}, ${formatYearLabel(end, options)}`
    }

    return `${formatMonthDayLabel(start, options)} - ${formatMonthDayLabel(end, options)}, ${formatYearLabel(end, options)}`
  }

  return `${formatMonthDayLabel(start, options)} - ${getDateTimeFormatter(
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
    options
  ).format(end)}`
}

function getVisibleDaysInRange(
  range: { start: Date; end: Date },
  hiddenDays?: CalendarWeekday[]
) {
  const days: Date[] = []
  const cursor = new Date(range.start)

  while (cursor.getTime() <= range.end.getTime()) {
    if (!isHiddenDay(cursor, hiddenDays)) {
      days.push(new Date(cursor))
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

export function getRangeLabel(
  anchorDate: Date,
  view: "month" | "week" | "day" | "agenda",
  options: VisibleRangeOptions = {}
) {
  const range = getVisibleRange(anchorDate, view, options)
  const visibleDays = getVisibleDaysInRange(range, options.hiddenDays)
  const labelStart = visibleDays[0] ?? range.start
  const labelEnd = visibleDays[visibleDays.length - 1] ?? range.end

  if (view === "month") {
    return formatMonthYearLabel(anchorDate, options)
  }

  if (view === "day") {
    return formatLongDateLabel(
      getNextVisibleDay(anchorDate, options.hiddenDays),
      options
    )
  }

  if (view === "agenda") {
    return formatRangeDateLabel(labelStart, labelEnd, options)
  }

  const sameMonth = isSameMonth(labelStart, labelEnd)

  if (sameMonth) {
    return `${formatMonthDayLabel(labelStart, options)} - ${formatDayNumber(labelEnd, options)}, ${formatYearLabel(labelEnd, options)}`
  }

  return formatRangeDateLabel(labelStart, labelEnd, options)
}

export function formatHourLabel(
  date: Date,
  options: CalendarDateTimeFormatOptions = {}
) {
  return getDateTimeFormatter(
    {
      hour: options.hourCycle === 24 ? "2-digit" : "numeric",
    },
    options
  ).format(date)
}

function formatTimeRange(
  start: Date,
  end: Date,
  options: CalendarDateTimeFormatOptions = {},
  includeTimeZone = false
) {
  const formatter = getDateTimeFormatter(
    {
      hour: options.hourCycle === 24 ? "2-digit" : "numeric",
      minute: "2-digit",
    },
    options
  )

  const label = `${formatter.format(start)} - ${formatter.format(end)}`

  if (!includeTimeZone || !options.timeZone) {
    return label
  }

  return `${label} ${options.timeZone}`
}

export function formatEventTimeLabel(
  start: Date,
  end: Date,
  options: CalendarDateTimeFormatOptions & {
    allDay?: boolean
  } = {}
) {
  if (options.allDay) {
    return "All day"
  }

  return formatTimeRange(start, end, options)
}

export function formatDurationLabel(start: Date, end: Date, allDay = false) {
  if (allDay) {
    const days = getDaySpan({ end, start })

    return `${days} day${days === 1 ? "" : "s"}`
  }

  const durationMinutes = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / 60_000)
  )
  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`
  }

  if (hours > 0) {
    return `${hours}h`
  }

  return `${minutes}m`
}

export function getEventMetaLabel(
  event: CalendarOccurrence,
  options: CalendarDateTimeFormatOptions = {}
) {
  return formatEventTimeLabel(event.start, event.end, {
    allDay: event.allDay,
    ...options,
    timeZone: options.timeZone ?? event.timeZone,
  })
}

export function formatWeekday(
  day: Date,
  options: CalendarDateTimeFormatOptions = {}
) {
  return getDateTimeFormatter(
    {
      weekday: "short",
    },
    options
  ).format(day)
}

export function formatAgendaHeading(
  day: Date,
  options: CalendarDateTimeFormatOptions = {}
) {
  return formatLongDateLabel(day, options)
}

export function formatAgendaEyebrow(
  day: Date,
  options: CalendarDateTimeFormatOptions = {}
) {
  return formatWeekday(day, options)
}

export function isOutsideMonth(day: Date, anchorDate: Date) {
  return !isSameMonth(day, anchorDate)
}

export function isToday(day: Date) {
  return isSameDay(day, new Date())
}
