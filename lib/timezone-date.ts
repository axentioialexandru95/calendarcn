type TimeZoneDateParts = {
  day: number
  hours: number
  minutes: number
  month: number
  seconds: number
  year: number
}

type TimeZoneDateOptions = {
  date?: number
  dayOffset?: number
  hours?: number
  minutes?: number
  month?: number
  seconds?: number
  year?: number
}

const timeZoneFormatterCache = new Map<string, Intl.DateTimeFormat>()

function getTimeZoneFormatter(timeZone: string) {
  const cachedFormatter = timeZoneFormatterCache.get(timeZone)

  if (cachedFormatter) {
    return cachedFormatter
  }

  const nextFormatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone,
    year: "numeric",
  })

  timeZoneFormatterCache.set(timeZone, nextFormatter)

  return nextFormatter
}

function getTimeZoneDateParts(date: Date, timeZone: string): TimeZoneDateParts {
  const parts = getTimeZoneFormatter(timeZone).formatToParts(date)

  return parts.reduce<TimeZoneDateParts>(
    (result, part) => {
      if (part.type === "year") {
        result.year = Number(part.value)
      } else if (part.type === "month") {
        result.month = Number(part.value)
      } else if (part.type === "day") {
        result.day = Number(part.value)
      } else if (part.type === "hour") {
        result.hours = Number(part.value)
      } else if (part.type === "minute") {
        result.minutes = Number(part.value)
      } else if (part.type === "second") {
        result.seconds = Number(part.value)
      }

      return result
    },
    {
      day: 1,
      hours: 0,
      minutes: 0,
      month: 1,
      seconds: 0,
      year: 1970,
    }
  )
}

function getUtcTimestampFromParts(parts: TimeZoneDateParts) {
  return Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hours,
    parts.minutes,
    parts.seconds,
    0
  )
}

function createTimeZoneDate(parts: TimeZoneDateParts, timeZone: string) {
  let timestamp = getUtcTimestampFromParts(parts)

  for (let iteration = 0; iteration < 4; iteration += 1) {
    const resolvedParts = getTimeZoneDateParts(new Date(timestamp), timeZone)
    const diff =
      getUtcTimestampFromParts(parts) - getUtcTimestampFromParts(resolvedParts)

    if (diff === 0) {
      break
    }

    timestamp += diff
  }

  return new Date(timestamp)
}

export function setDateInTimeZone(
  baseDate: Date,
  timeZone: string,
  options: TimeZoneDateOptions = {}
) {
  const baseParts = getTimeZoneDateParts(baseDate, timeZone)
  const dateSeed = new Date(
    Date.UTC(
      options.year ?? baseParts.year,
      (options.month ?? baseParts.month) - 1,
      options.date ?? baseParts.day
    )
  )

  if (options.dayOffset) {
    dateSeed.setUTCDate(dateSeed.getUTCDate() + options.dayOffset)
  }

  return createTimeZoneDate(
    {
      day: dateSeed.getUTCDate(),
      hours: options.hours ?? baseParts.hours,
      minutes: options.minutes ?? baseParts.minutes,
      month: dateSeed.getUTCMonth() + 1,
      seconds: options.seconds ?? baseParts.seconds,
      year: dateSeed.getUTCFullYear(),
    },
    timeZone
  )
}
