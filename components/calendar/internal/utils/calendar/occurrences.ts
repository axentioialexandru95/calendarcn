import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  endOfDay,
  endOfMonth,
  getDay,
  set,
  startOfMonth,
  startOfWeek,
} from "date-fns"

import type {
  CalendarBlockedRange,
  CalendarBusinessHoursWindow,
  CalendarEvent,
  CalendarOccurrence,
  CalendarWeekday,
} from "../../../types"
import {
  copyTimeParts,
  getMinuteOfDay,
  parseTimeStringToMinuteOfDay,
  type CalendarVisibleRange,
} from "./date-range"

type RecurrenceCursorContext = {
  rangeStart: Date
  rangeEnd: Date
}

type DayEventLayout = {
  occurrence: CalendarOccurrence
  column: number
  columns: number
  top: number
  height: number
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

const MINUTES_IN_DAY = 1_440
const RECURRENCE_LIMIT = 400
const fallbackEventColors = [
  "#0f766e",
  "#2563eb",
  "#db2777",
  "#7c3aed",
  "#ea580c",
  "#059669",
] as const
const allWeekdays: CalendarWeekday[] = [0, 1, 2, 3, 4, 5, 6]

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
        days: window.days?.length ? Array.from(new Set(window.days)) : allWeekdays,
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
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
  const dayEnd = endOfDay(day)

  return (blockedRanges ?? []).flatMap((range) => {
    if (!intervalsOverlap(range.start, range.end, dayStart, addDays(dayStart, 1))) {
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

export function getEventResourceId(
  event: {
    calendarId?: string
    resourceId?: string
  }
) {
  return event.resourceId ?? event.calendarId ?? null
}

export function filterOccurrencesByResource(
  occurrences: CalendarOccurrence[],
  resourceIds?: string[]
) {
  if (!resourceIds?.length) {
    return occurrences
  }

  return occurrences.filter((occurrence) => {
    const resourceId = getEventResourceId(occurrence)

    return resourceId ? resourceIds.includes(resourceId) : false
  })
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

      if (intersectsRange(cursor, nextEnd, context.rangeStart, context.rangeEnd)) {
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

    if (intersectsRange(cursor, nextEnd, context.rangeStart, context.rangeEnd)) {
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
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())

  return occurrences.filter((occurrence) =>
    intervalsOverlap(
      occurrence.start,
      occurrence.end,
      dayStart,
      addDays(dayStart, 1)
    )
  )
}

export function getAllDayEvents(occurrences: CalendarOccurrence[], day: Date) {
  return getDayEvents(occurrences, day).filter((occurrence) => occurrence.allDay)
}

function getTimedEvents(occurrences: CalendarOccurrence[], day: Date) {
  return getDayEvents(occurrences, day).filter((occurrence) => !occurrence.allDay)
}

export function getDayLayout(
  occurrences: CalendarOccurrence[],
  day: Date,
  minMinute = 0,
  maxMinute = MINUTES_IN_DAY
): DayEventLayout[] {
  const segments = getTimedEvents(occurrences, day)
    .map((occurrence) => {
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate())
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
