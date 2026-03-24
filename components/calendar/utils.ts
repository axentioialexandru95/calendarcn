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
  format,
  getDay,
  isSameDay,
  isSameMonth,
  set,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns"

import { cn } from "@/lib/utils"

import type {
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

export function getCalendarSlotClassName(
  classNames: CalendarClassNames | undefined,
  slot: CalendarSlot,
  ...values: Array<string | undefined>
) {
  return cn(values, classNames?.[slot])
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
  direction: -1 | 1
) {
  if (view === "month") {
    return addMonths(anchorDate, direction)
  }

  if (view === "week" || view === "agenda") {
    return addWeeks(anchorDate, direction)
  }

  return addDays(anchorDate, direction)
}

export function getRangeLabel(
  anchorDate: Date,
  view: CalendarView,
  options: VisibleRangeOptions = {}
) {
  const range = getVisibleRange(anchorDate, view, options)

  if (view === "month") {
    return format(anchorDate, "MMMM yyyy")
  }

  if (view === "day") {
    return format(anchorDate, "EEEE, MMMM d")
  }

  if (view === "agenda") {
    return `${format(range.start, "MMM d")} - ${format(range.end, "MMM d, yyyy")}`
  }

  const sameMonth = isSameMonth(range.start, range.end)

  if (sameMonth) {
    return `${format(range.start, "MMM d")} - ${format(range.end, "d, yyyy")}`
  }

  return `${format(range.start, "MMM d")} - ${format(range.end, "MMM d, yyyy")}`
}

export function getMonthDays(anchorDate: Date, weekStartsOn: CalendarWeekday) {
  const range = getVisibleRange(anchorDate, "month", { weekStartsOn })

  return eachDayOfInterval(range)
}

export function getWeekDays(anchorDate: Date, weekStartsOn: CalendarWeekday) {
  const start = startOfWeek(anchorDate, { weekStartsOn })

  return Array.from({ length: 7 }, (_, index) => addDays(start, index))
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

function formatTimeRange(
  start: Date,
  end: Date,
  timeZone?: string,
  includeTimeZone = false
) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  })

  const label = `${formatter.format(start)} - ${formatter.format(end)}`

  if (!includeTimeZone || !timeZone) {
    return label
  }

  return `${label} ${timeZone}`
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
    title: overrides.title ?? "New event",
    start: operation.start,
    end: operation.end,
    allDay: operation.allDay,
    color: overrides.color,
    calendarId: overrides.calendarId,
    calendarLabel: overrides.calendarLabel,
    timeZone: overrides.timeZone,
    resourceId: overrides.resourceId ?? operation.resourceId,
    description: overrides.description,
    location: overrides.location,
    readOnly: overrides.readOnly,
    data: overrides.data,
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
  timeZone?: string
) {
  if (event.allDay) {
    return "All day"
  }

  return formatTimeRange(event.start, event.end, timeZone ?? event.timeZone)
}

export function formatDayNumber(day: Date) {
  return format(day, "d")
}

export function formatWeekday(day: Date) {
  return format(day, "EEE")
}

export function formatAgendaHeading(day: Date) {
  return format(day, "EEEE, MMMM d")
}

export function formatAgendaEyebrow(day: Date) {
  return format(day, "EEE")
}

export function isOutsideMonth(day: Date, anchorDate: Date) {
  return !isSameMonth(day, anchorDate)
}

export function isToday(day: Date) {
  return isSameDay(day, new Date())
}
