import {
  addDays,
  addMinutes,
  addMonths,
  addWeeks,
  addYears,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  getDay,
  isSameDay,
  isSameMonth,
  isSameYear,
  set,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns"

import { cn } from "@/lib/utils"

import type {
  CalendarBlockedRange,
  CalendarBusinessHoursWindow,
  CalendarClassNames,
  CalendarCreateOperation,
  CalendarEvent,
  CalendarMoveOperation,
  CalendarOccurrence,
  CalendarResizeOperation,
  CalendarSlot,
  CalendarView,
  CalendarWeekday,
} from "./types"
import { calendarViews } from "./types"

const MINUTES_IN_DAY = 1_440
const MILLISECONDS_IN_DAY = 86_400_000
const RECURRENCE_LIMIT = 400

const fallbackEventColors = [
  "#0f766e",
  "#2563eb",
  "#db2777",
  "#7c3aed",
  "#ea580c",
  "#059669",
] as const

type VisibleRangeOptions = {
  agendaDays?: number
  hiddenDays?: CalendarWeekday[]
  hourCycle?: 12 | 24
  locale?: string
  timeZone?: string
  weekStartsOn?: CalendarWeekday
}

type RecurrenceCursorContext = {
  rangeStart: Date
  rangeEnd: Date
}

type CalendarVisibleRange = {
  start: Date
  end: Date
}

type DayEventLayout = {
  occurrence: CalendarOccurrence
  column: number
  columns: number
  top: number
  height: number
}

type CalendarDateTimeFormatOptions = {
  hourCycle?: 12 | 24
  locale?: string
  timeZone?: string
}

type MinuteSegment = {
  endMinute: number
  startMinute: number
}

type DayTimeSegment = MinuteSegment & {
  color?: string
  id?: string
  label?: string
}

const allWeekdays: CalendarWeekday[] = [0, 1, 2, 3, 4, 5, 6]

export function getCalendarSlotClassName(
  classNames: CalendarClassNames | undefined,
  slot: CalendarSlot,
  ...values: Array<string | undefined>
) {
  return cn(values, classNames?.[slot])
}

export function normalizeHiddenDays(hiddenDays?: CalendarWeekday[]) {
  const nextHiddenDays = Array.from(new Set(hiddenDays ?? [])).filter(
    (day): day is CalendarWeekday => allWeekdays.includes(day as CalendarWeekday)
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
  return normalizeHiddenDays(hiddenDays).includes(getDay(day) as CalendarWeekday)
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

export function getRangeLabel(
  anchorDate: Date,
  view: CalendarView,
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

export function getAgendaDays(
  range: CalendarVisibleRange,
  hiddenDays?: CalendarWeekday[]
) {
  return getVisibleDaysInRange(range, hiddenDays)
}

function mergeMinuteSegments(segments: MinuteSegment[]) {
  if (segments.length === 0) {
    return []
  }

  const sortedSegments = [...segments].sort(
    (left, right) => left.startMinute - right.startMinute
  )
  const mergedSegments = [sortedSegments[0]]

  for (const segment of sortedSegments.slice(1)) {
    const previousSegment = mergedSegments[mergedSegments.length - 1]

    if (segment.startMinute <= previousSegment.endMinute) {
      previousSegment.endMinute = Math.max(
        previousSegment.endMinute,
        segment.endMinute
      )
      continue
    }

    mergedSegments.push({ ...segment })
  }

  return mergedSegments
}

export function normalizeBusinessHours(
  businessHours?: CalendarBusinessHoursWindow[]
) {
  return (businessHours ?? [])
    .map((window) => {
      const startMinute = parseTimeStringToMinuteOfDay(window.start)
      const endMinute = parseTimeStringToMinuteOfDay(window.end)

      if (
        startMinute === null ||
        endMinute === null ||
        startMinute >= endMinute
      ) {
        return null
      }

      return {
        days:
          window.days?.length
            ? Array.from(new Set(window.days))
            : allWeekdays,
        endMinute,
        startMinute,
      }
    })
    .filter((window): window is NonNullable<typeof window> => window !== null)
}

export function getBusinessHourSegmentsForDay(
  day: Date,
  businessHours: CalendarBusinessHoursWindow[] | undefined,
  minMinute: number,
  maxMinute: number
) {
  const weekday = getDay(day) as CalendarWeekday

  return mergeMinuteSegments(
    normalizeBusinessHours(businessHours)
      .filter((window) => window.days.includes(weekday))
      .map((window) => ({
        endMinute: Math.min(maxMinute, window.endMinute),
        startMinute: Math.max(minMinute, window.startMinute),
      }))
      .filter((segment) => segment.endMinute > segment.startMinute)
  )
}

export function getOutsideBusinessHourSegmentsForDay(
  day: Date,
  businessHours: CalendarBusinessHoursWindow[] | undefined,
  minMinute: number,
  maxMinute: number
) {
  if (!businessHours?.length) {
    return []
  }

  const businessHourSegments = getBusinessHourSegmentsForDay(
    day,
    businessHours,
    minMinute,
    maxMinute
  )

  if (businessHourSegments.length === 0) {
    return [
      {
        endMinute: maxMinute,
        startMinute: minMinute,
      },
    ]
  }

  const outsideSegments: MinuteSegment[] = []
  let cursor = minMinute

  for (const segment of businessHourSegments) {
    if (segment.startMinute > cursor) {
      outsideSegments.push({
        endMinute: segment.startMinute,
        startMinute: cursor,
      })
    }

    cursor = segment.endMinute
  }

  if (cursor < maxMinute) {
    outsideSegments.push({
      endMinute: maxMinute,
      startMinute: cursor,
    })
  }

  return outsideSegments
}

export function getBlockedSegmentsForDay(
  day: Date,
  blockedRanges: CalendarBlockedRange[] | undefined,
  minMinute: number,
  maxMinute: number
) {
  const dayStart = startOfDay(day)
  const dayEnd = endOfDay(day)

  return (blockedRanges ?? []).flatMap((range) => {
      if (
        !intervalsOverlap(range.start, range.end, dayStart, addDays(dayStart, 1))
      ) {
        return []
      }

      const clippedStart = new Date(
        Math.max(range.start.getTime(), dayStart.getTime())
      )
      const clippedEnd = new Date(Math.min(range.end.getTime(), dayEnd.getTime()))
      const startMinute = Math.max(minMinute, getMinuteOfDay(clippedStart))
      const endMinute = Math.min(
        maxMinute,
        Math.max(startMinute + 1, getMinuteOfDay(clippedEnd))
      )

      if (endMinute <= startMinute) {
        return []
      }

      return [
        {
          color: range.color,
          endMinute,
          id: range.id,
          label: range.label,
          startMinute,
        } satisfies DayTimeSegment,
      ]
    })
}

export function intervalOverlapsBlockedRanges(
  start: Date,
  end: Date,
  blockedRanges?: CalendarBlockedRange[]
) {
  return (blockedRanges ?? []).some((range) =>
    intervalsOverlap(start, end, range.start, range.end)
  )
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

function getMinuteOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes()
}

function getDateTimeFormatter(
  options: Intl.DateTimeFormatOptions,
  config: CalendarDateTimeFormatOptions = {}
) {
  return new Intl.DateTimeFormat(config.locale, {
    ...options,
    ...(config.timeZone ? { timeZone: config.timeZone } : {}),
    ...(config.hourCycle
      ? { hour12: config.hourCycle === 12 }
      : {}),
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

export function getOccurrenceAccentColor(
  occurrence: CalendarOccurrence,
  index = 0
) {
  if (occurrence.color) {
    return occurrence.color
  }

  const seed = hashString(
    occurrence.calendarId ?? occurrence.resourceId ?? occurrence.id
  )

  return fallbackEventColors[(seed + index) % fallbackEventColors.length]
}

export function expandOccurrences(
  events: CalendarEvent[],
  range: CalendarVisibleRange
) {
  const occurrences: CalendarOccurrence[] = []

  for (const event of events) {
    if (event.archived) {
      continue
    }

    if (!event.recurrence) {
      if (intersectsRange(event.start, event.end, range.start, range.end)) {
        occurrences.push({
          ...event,
          occurrenceId: event.id,
          sourceEventId: event.id,
          isRecurringInstance: false,
          seriesIndex: 0,
        })
      }

      continue
    }

    occurrences.push(
      ...expandRecurringEvent(event, {
        rangeStart: range.start,
        rangeEnd: range.end,
      })
    )
  }

  return occurrences.sort((left, right) => {
    if (left.start.getTime() === right.start.getTime()) {
      return left.end.getTime() - right.end.getTime()
    }

    return left.start.getTime() - right.start.getTime()
  })
}

function expandRecurringEvent(
  event: CalendarEvent,
  context: RecurrenceCursorContext
) {
  const interval = event.recurrence?.interval ?? 1
  const occurrences: CalendarOccurrence[] = []
  const duration = event.end.getTime() - event.start.getTime()
  const countLimit = event.recurrence?.count ?? RECURRENCE_LIMIT
  let seriesIndex = 0

  if (!event.recurrence) {
    return occurrences
  }

  if (event.recurrence.frequency === "daily") {
    let cursor = event.start

    while (seriesIndex < countLimit && seriesIndex < RECURRENCE_LIMIT) {
      const nextEnd = new Date(cursor.getTime() + duration)

      if (event.recurrence.until && cursor > event.recurrence.until) {
        break
      }

      if (
        intersectsRange(cursor, nextEnd, context.rangeStart, context.rangeEnd)
      ) {
        occurrences.push(createOccurrence(event, cursor, nextEnd, seriesIndex))
      }

      if (cursor > context.rangeEnd && !event.recurrence.until) {
        break
      }

      cursor = addDays(cursor, interval)
      seriesIndex += 1
    }

    return occurrences
  }

  if (event.recurrence.frequency === "weekly") {
    const weekdays = [
      ...(event.recurrence.byWeekday?.length
        ? event.recurrence.byWeekday
        : [getDay(event.start) as CalendarWeekday]),
    ].sort()
    let weekCursor = startOfWeek(event.start, { weekStartsOn: 0 })

    while (seriesIndex < countLimit && seriesIndex < RECURRENCE_LIMIT) {
      for (const weekday of weekdays) {
        const candidateDay = addDays(
          weekCursor,
          (weekday - getDay(weekCursor) + 7) % 7
        )
        const candidateStart = copyTimeParts(candidateDay, event.start)

        if (candidateStart < event.start) {
          continue
        }

        if (event.recurrence.until && candidateStart > event.recurrence.until) {
          return occurrences
        }

        const candidateEnd = new Date(candidateStart.getTime() + duration)

        if (
          intersectsRange(
            candidateStart,
            candidateEnd,
            context.rangeStart,
            context.rangeEnd
          )
        ) {
          occurrences.push(
            createOccurrence(event, candidateStart, candidateEnd, seriesIndex)
          )
        }

        seriesIndex += 1

        if (seriesIndex >= countLimit || seriesIndex >= RECURRENCE_LIMIT) {
          return occurrences
        }
      }

      weekCursor = addWeeks(weekCursor, interval)

      if (weekCursor > context.rangeEnd && !event.recurrence.until) {
        break
      }
    }

    return occurrences
  }

  if (event.recurrence.frequency === "monthly") {
    const monthDays = [
      ...(event.recurrence.byMonthDay?.length
        ? event.recurrence.byMonthDay
        : [event.start.getDate()]),
    ].sort((left, right) => left - right)
    let monthCursor = startOfMonth(event.start)

    while (seriesIndex < countLimit && seriesIndex < RECURRENCE_LIMIT) {
      for (const dayOfMonth of monthDays) {
        const lastDayOfMonth = endOfMonth(monthCursor).getDate()

        if (dayOfMonth > lastDayOfMonth) {
          continue
        }

        const candidateStart = copyTimeParts(
          set(monthCursor, {
            date: dayOfMonth,
            hours: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: 0,
          }),
          event.start
        )

        if (candidateStart < event.start) {
          continue
        }

        if (event.recurrence.until && candidateStart > event.recurrence.until) {
          return occurrences
        }

        const candidateEnd = new Date(candidateStart.getTime() + duration)

        if (
          intersectsRange(
            candidateStart,
            candidateEnd,
            context.rangeStart,
            context.rangeEnd
          )
        ) {
          occurrences.push(
            createOccurrence(event, candidateStart, candidateEnd, seriesIndex)
          )
        }

        seriesIndex += 1

        if (seriesIndex >= countLimit || seriesIndex >= RECURRENCE_LIMIT) {
          return occurrences
        }
      }

      monthCursor = addMonths(monthCursor, interval)

      if (monthCursor > context.rangeEnd && !event.recurrence.until) {
        break
      }
    }

    return occurrences
  }

  let cursor = event.start

  while (seriesIndex < countLimit && seriesIndex < RECURRENCE_LIMIT) {
    const nextEnd = new Date(cursor.getTime() + duration)

    if (event.recurrence.until && cursor > event.recurrence.until) {
      break
    }

    if (
      intersectsRange(cursor, nextEnd, context.rangeStart, context.rangeEnd)
    ) {
      occurrences.push(createOccurrence(event, cursor, nextEnd, seriesIndex))
    }

    if (cursor > context.rangeEnd && !event.recurrence.until) {
      break
    }

    cursor = addYears(cursor, interval)
    seriesIndex += 1
  }

  return occurrences
}

function createOccurrence(
  event: CalendarEvent,
  start: Date,
  end: Date,
  seriesIndex: number
): CalendarOccurrence {
  return {
    ...event,
    start,
    end,
    occurrenceId: `${event.id}:${seriesIndex}`,
    sourceEventId: event.id,
    isRecurringInstance: true,
    seriesIndex,
  }
}

export function getDayEvents(occurrences: CalendarOccurrence[], day: Date) {
  return occurrences.filter((occurrence) =>
    intersectsRange(
      occurrence.start,
      occurrence.end,
      startOfDay(day),
      endOfDay(day)
    )
  )
}

export function getAllDayEvents(occurrences: CalendarOccurrence[], day: Date) {
  return getDayEvents(occurrences, day).filter(
    (occurrence) => occurrence.allDay
  )
}

function getTimedEvents(occurrences: CalendarOccurrence[], day: Date) {
  return getDayEvents(occurrences, day).filter(
    (occurrence) => !occurrence.allDay
  )
}

export function getDayLayout(
  occurrences: CalendarOccurrence[],
  day: Date,
  minMinute = 0,
  maxMinute = MINUTES_IN_DAY
): DayEventLayout[] {
  const segments = getTimedEvents(occurrences, day)
    .map((occurrence) => {
      const dayStart = startOfDay(day)
      const dayEnd = endOfDay(day)
      const clippedStart = new Date(
        Math.max(occurrence.start.getTime(), dayStart.getTime())
      )
      const clippedEnd = new Date(
        Math.min(occurrence.end.getTime(), dayEnd.getTime())
      )
      const startMinute = Math.max(minMinute, getMinuteOfDay(clippedStart))
      const endMinute = Math.min(
        maxMinute,
        Math.max(startMinute + 15, getMinuteOfDay(clippedEnd))
      )

      return {
        occurrence,
        startMinute,
        endMinute,
        column: 0,
        columns: 1,
      }
    })
    .filter(
      (segment) =>
        segment.endMinute > minMinute && segment.startMinute < maxMinute
    )
    .sort((left, right) => {
      if (left.startMinute === right.startMinute) {
        return left.endMinute - right.endMinute
      }

      return left.startMinute - right.startMinute
    })

  const groups: (typeof segments)[] = []
  let active: typeof segments = []
  let currentGroup: typeof segments = []

  for (const segment of segments) {
    active = active.filter((item) => item.endMinute > segment.startMinute)

    if (active.length === 0 && currentGroup.length > 0) {
      groups.push(currentGroup)
      currentGroup = []
    }

    let column = 0

    while (active.some((item) => item.column === column)) {
      column += 1
    }

    segment.column = column
    active.push(segment)
    currentGroup.push(segment)
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup)
  }

  for (const group of groups) {
    const columns = Math.max(...group.map((segment) => segment.column)) + 1

    for (const segment of group) {
      segment.columns = columns
    }
  }

  return segments.map((segment) => ({
    occurrence: segment.occurrence,
    column: segment.column,
    columns: segment.columns,
    top: segment.startMinute,
    height: Math.max(15, segment.endMinute - segment.startMinute),
  }))
}

export function applyMoveOperation(
  events: CalendarEvent[],
  operation: CalendarMoveOperation
) {
  return events.map((event) => {
    if (event.id !== operation.occurrence.sourceEventId) {
      return event
    }

    return {
      ...event,
      start: operation.nextStart,
      end: operation.nextEnd,
      allDay: operation.allDay ?? event.allDay,
    }
  })
}

export function applyResizeOperation(
  events: CalendarEvent[],
  operation: CalendarResizeOperation
) {
  return events.map((event) => {
    if (event.id !== operation.occurrence.sourceEventId) {
      return event
    }

    return {
      ...event,
      start: operation.nextStart,
      end: operation.nextEnd,
    }
  })
}

export function createEventFromOperation(
  operation: CalendarCreateOperation,
  overrides: Partial<CalendarEvent> = {}
): CalendarEvent {
  return {
    id: crypto.randomUUID(),
    title: operation.title ?? overrides.title ?? "New event",
    start: operation.start,
    end: operation.end,
    allDay: operation.allDay,
    archived: overrides.archived,
    color: operation.color ?? overrides.color,
    calendarId: operation.calendarId ?? overrides.calendarId,
    calendarLabel: operation.calendarLabel ?? overrides.calendarLabel,
    timeZone: operation.timeZone ?? overrides.timeZone,
    resourceId: operation.resourceId ?? overrides.resourceId,
    description: operation.description ?? overrides.description,
    location: operation.location ?? overrides.location,
    readOnly: operation.readOnly ?? overrides.readOnly,
    data: operation.data ?? overrides.data,
  }
}

export function duplicateOccurrenceAsEvent(
  occurrence: CalendarOccurrence
): CalendarEvent {
  const durationMs = occurrence.end.getTime() - occurrence.start.getTime()
  const nextStart = occurrence.allDay
    ? addDays(occurrence.start, getDaySpan(occurrence))
    : addMinutes(occurrence.end, 30)
  const nextEnd = new Date(nextStart.getTime() + durationMs)

  return {
    id: crypto.randomUUID(),
    title: occurrence.title,
    start: nextStart,
    end: nextEnd,
    allDay: occurrence.allDay,
    archived: false,
    color: occurrence.color,
    calendarId: occurrence.calendarId,
    calendarLabel: occurrence.calendarLabel,
    timeZone: occurrence.timeZone,
    recurrence: undefined,
    resourceId: occurrence.resourceId,
    description: occurrence.description,
    location: occurrence.location,
    readOnly: false,
    data: occurrence.data,
  }
}

export function clampResize(
  nextDate: Date,
  oppositeDate: Date,
  edge: "start" | "end",
  minimumMinutes: number
) {
  if (edge === "start") {
    const latestStart = addMinutes(oppositeDate, -minimumMinutes)

    if (nextDate > latestStart) {
      return latestStart
    }

    return nextDate
  }

  const earliestEnd = addMinutes(oppositeDate, minimumMinutes)

  if (nextDate < earliestEnd) {
    return earliestEnd
  }

  return nextDate
}

function intersectsRange(
  start: Date,
  end: Date,
  rangeStart: Date,
  rangeEnd: Date
) {
  return (
    start.getTime() <= rangeEnd.getTime() &&
    end.getTime() >= rangeStart.getTime()
  )
}

function intervalsOverlap(
  start: Date,
  end: Date,
  rangeStart: Date,
  rangeEnd: Date
) {
  return (
    start.getTime() < rangeEnd.getTime() && end.getTime() > rangeStart.getTime()
  )
}

function hashString(value: string) {
  return value.split("").reduce((result, character) => {
    return character.charCodeAt(0) + ((result << 5) - result)
  }, 0)
}

export function getDaySpan(event: Pick<CalendarEvent, "start" | "end">) {
  return Math.max(
    1,
    Math.ceil(
      (event.end.getTime() - event.start.getTime()) / MILLISECONDS_IN_DAY
    )
  )
}

export function getEventMetaLabel(
  event: CalendarOccurrence,
  options: CalendarDateTimeFormatOptions = {}
) {
  if (event.allDay) {
    return "All day"
  }

  return formatTimeRange(event.start, event.end, {
    ...options,
    timeZone: options.timeZone ?? event.timeZone,
  })
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
