import { addDays, addMinutes } from "date-fns"

import type {
  CalendarEvent,
  CalendarICSExportOptions,
  CalendarICSParseOptions,
  CalendarWeekday,
} from "../../../types"

const ICS_LINE_BREAK = "\r\n"
const weekdayToICS: Record<CalendarWeekday, string> = {
  0: "SU",
  1: "MO",
  2: "TU",
  3: "WE",
  4: "TH",
  5: "FR",
  6: "SA",
}
const icsToWeekday: Record<string, CalendarWeekday> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
}

export function exportEventsToICS(
  events: CalendarEvent[],
  options: CalendarICSExportOptions = {}
) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${escapeICSValue(
      options.productId ?? "-//CalendarCN//CalendarCN Export//EN"
    )}`,
    "CALSCALE:GREGORIAN",
    options.calendarName
      ? `X-WR-CALNAME:${escapeICSValue(options.calendarName)}`
      : null,
    ...events.flatMap((event) => {
      const eventTimeZone = event.timeZone ?? options.timeZone
      const eventLines = [
        "BEGIN:VEVENT",
        `UID:${event.id}`,
        `DTSTAMP:${formatICSUtcDateTime(new Date())}`,
        formatICSDateLine("DTSTART", event.start, {
          allDay: event.allDay,
          timeZone: eventTimeZone,
        }),
        formatICSDateLine("DTEND", event.end, {
          allDay: event.allDay,
          timeZone: eventTimeZone,
        }),
        `SUMMARY:${escapeICSValue(event.title)}`,
        event.description
          ? `DESCRIPTION:${escapeICSValue(event.description)}`
          : null,
        event.location ? `LOCATION:${escapeICSValue(event.location)}` : null,
        event.calendarLabel
          ? `CATEGORIES:${escapeICSValue(event.calendarLabel)}`
          : null,
        event.recurrence
          ? `RRULE:${formatICSRecurrenceRule(event.recurrence)}`
          : null,
        "END:VEVENT",
      ]

      return eventLines.filter((line): line is string => Boolean(line))
    }),
    "END:VCALENDAR",
  ]

  return `${lines.join(ICS_LINE_BREAK)}${ICS_LINE_BREAK}`
}

export async function parseICSFile(
  source: Blob | string,
  options: CalendarICSParseOptions = {}
) {
  const content = typeof source === "string" ? source : await source.text()

  return parseICSText(content, options)
}

export function parseICSText(
  content: string,
  options: CalendarICSParseOptions = {}
) {
  const lines = unfoldICSLines(content)
  const events: CalendarEvent[] = []
  let eventState: Record<
    string,
    { params: Record<string, string>; value: string }
  > | null = null

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      eventState = {}
      continue
    }

    if (line === "END:VEVENT") {
      const event = eventState
        ? buildEventFromICSRecord(eventState, options)
        : null

      if (event) {
        events.push(event)
      }

      eventState = null
      continue
    }

    if (!eventState || !line.includes(":")) {
      continue
    }

    const { name, params, value } = parseICSProperty(line)
    eventState[name] = { params, value }
  }

  return events
}

function buildEventFromICSRecord(
  record: Record<string, { params: Record<string, string>; value: string }>,
  options: CalendarICSParseOptions
) {
  const startRecord = record.DTSTART

  if (!startRecord) {
    return null
  }

  const startValue = parseICSDateValue(startRecord.value, startRecord.params)

  if (!startValue) {
    return null
  }

  const endRecord = record.DTEND
  const endValue = endRecord
    ? parseICSDateValue(endRecord.value, endRecord.params)
    : null
  const timeZone =
    startValue.timeZone ?? endValue?.timeZone ?? options.defaultTimeZone

  return {
    id:
      record.UID?.value?.trim() ||
      record.SUMMARY?.value?.trim() ||
      crypto.randomUUID(),
    title: unescapeICSValue(record.SUMMARY?.value ?? "Imported event"),
    start: startValue.date,
    end:
      endValue?.date ??
      (startValue.allDay
        ? addDays(startValue.date, 1)
        : addMinutes(startValue.date, 60)),
    allDay: startValue.allDay,
    calendarLabel: record.CATEGORIES
      ? unescapeICSValue(record.CATEGORIES.value)
      : options.defaultCalendarLabel,
    description: record.DESCRIPTION
      ? unescapeICSValue(record.DESCRIPTION.value)
      : undefined,
    location: record.LOCATION
      ? unescapeICSValue(record.LOCATION.value)
      : undefined,
    recurrence: record.RRULE
      ? parseICSRecurrenceRule(record.RRULE.value)
      : undefined,
    timeZone,
  } satisfies CalendarEvent
}

function unfoldICSLines(content: string) {
  return content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .reduce<string[]>((result, line) => {
      if ((line.startsWith(" ") || line.startsWith("\t")) && result.length > 0) {
        result[result.length - 1] += line.slice(1)
        return result
      }

      if (line.length > 0) {
        result.push(line)
      }

      return result
    }, [])
}

function parseICSProperty(line: string) {
  const separatorIndex = line.indexOf(":")
  const rawKey = line.slice(0, separatorIndex)
  const value = line.slice(separatorIndex + 1)
  const [name, ...rawParams] = rawKey.split(";")
  const params = rawParams.reduce<Record<string, string>>((result, item) => {
    const [paramName, paramValue] = item.split("=")

    if (paramName && paramValue) {
      result[paramName.toUpperCase()] = paramValue
    }

    return result
  }, {})

  return {
    name: name.toUpperCase(),
    params,
    value,
  }
}

function parseICSDateValue(
  value: string,
  params: Record<string, string>
): {
  allDay: boolean
  date: Date
  timeZone?: string
} | null {
  const normalizedValue = value.trim()
  const isAllDay = params.VALUE === "DATE" || /^\d{8}$/.test(normalizedValue)

  if (isAllDay) {
    const year = Number(normalizedValue.slice(0, 4))
    const month = Number(normalizedValue.slice(4, 6)) - 1
    const day = Number(normalizedValue.slice(6, 8))

    return {
      allDay: true,
      date: new Date(year, month, day),
      timeZone: params.TZID,
    }
  }

  const dateMatch =
    /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/.exec(normalizedValue)

  if (!dateMatch) {
    return null
  }

  const [, year, month, day, hour, minute, second = "00", isUtc] = dateMatch
  const date = isUtc
    ? new Date(
        Date.UTC(
          Number(year),
          Number(month) - 1,
          Number(day),
          Number(hour),
          Number(minute),
          Number(second)
        )
      )
    : new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      )

  return {
    allDay: false,
    date,
    timeZone: isUtc ? "UTC" : params.TZID,
  }
}

function formatICSRecurrenceRule(
  recurrence: NonNullable<CalendarEvent["recurrence"]>
) {
  const parts = [`FREQ=${recurrence.frequency.toUpperCase()}`]

  if (recurrence.interval && recurrence.interval > 1) {
    parts.push(`INTERVAL=${recurrence.interval}`)
  }

  if (recurrence.count) {
    parts.push(`COUNT=${recurrence.count}`)
  }

  if (recurrence.until) {
    parts.push(`UNTIL=${formatICSUtcDateTime(recurrence.until)}`)
  }

  if (recurrence.byWeekday?.length) {
    parts.push(
      `BYDAY=${recurrence.byWeekday.map((day) => weekdayToICS[day]).join(",")}`
    )
  }

  if (recurrence.byMonthDay?.length) {
    parts.push(`BYMONTHDAY=${recurrence.byMonthDay.join(",")}`)
  }

  return parts.join(";")
}

function parseICSRecurrenceRule(value: string): CalendarEvent["recurrence"] | undefined {
  const rule = value.split(";").reduce<Record<string, string>>((result, item) => {
    const [key, itemValue] = item.split("=")

    if (key && itemValue) {
      result[key.toUpperCase()] = itemValue
    }

    return result
  }, {})
  const frequency = rule.FREQ?.toLowerCase()

  if (
    frequency !== "daily" &&
    frequency !== "weekly" &&
    frequency !== "monthly" &&
    frequency !== "yearly"
  ) {
    return undefined
  }

  return {
    frequency,
    interval: rule.INTERVAL ? Number(rule.INTERVAL) : undefined,
    count: rule.COUNT ? Number(rule.COUNT) : undefined,
    until: rule.UNTIL ? parseICSDateValue(rule.UNTIL, {})?.date : undefined,
    byWeekday: rule.BYDAY
      ? rule.BYDAY.split(",")
          .map((entry) => icsToWeekday[entry])
          .filter((day): day is CalendarWeekday => day !== undefined)
      : undefined,
    byMonthDay: rule.BYMONTHDAY
      ? rule.BYMONTHDAY.split(",").map((entry) => Number(entry))
      : undefined,
  }
}

function formatICSDateLine(
  key: "DTEND" | "DTSTART",
  date: Date,
  options: {
    allDay?: boolean
    timeZone?: string
  }
) {
  if (options.allDay) {
    return `${key};VALUE=DATE:${formatICSDate(date)}`
  }

  if (options.timeZone && options.timeZone !== "UTC") {
    return `${key};TZID=${options.timeZone}:${formatICSLocalDateTime(date)}`
  }

  if (options.timeZone === "UTC") {
    return `${key}:${formatICSUtcDateTime(date)}`
  }

  return `${key}:${formatICSLocalDateTime(date)}`
}

function formatICSDate(date: Date) {
  return `${date.getFullYear()}${padICSNumber(date.getMonth() + 1)}${padICSNumber(
    date.getDate()
  )}`
}

function formatICSLocalDateTime(date: Date) {
  return `${formatICSDate(date)}T${padICSNumber(date.getHours())}${padICSNumber(
    date.getMinutes()
  )}${padICSNumber(date.getSeconds())}`
}

function formatICSUtcDateTime(date: Date) {
  return `${date.getUTCFullYear()}${padICSNumber(
    date.getUTCMonth() + 1
  )}${padICSNumber(date.getUTCDate())}T${padICSNumber(
    date.getUTCHours()
  )}${padICSNumber(date.getUTCMinutes())}${padICSNumber(
    date.getUTCSeconds()
  )}Z`
}

function padICSNumber(value: number) {
  return value.toString().padStart(2, "0")
}

function escapeICSValue(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
}

function unescapeICSValue(value: string) {
  return value
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
}
