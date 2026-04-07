import { describe, expect, it } from "vitest"

import { formatEventTimeLabel } from "@/components/calendar/utils"
import {
  buildDemoBlockedRanges,
  buildDemoDenseOverlapEvents,
  buildDemoEvents,
  CALENDAR_DEMO_TIME_ZONE,
} from "@/lib/calendar-demo-data"

describe("calendar demo data", () => {
  it("builds stable Bucharest wall-clock times regardless of host timezone", () => {
    const baseDate = new Date("2026-03-24T09:00:00.000Z")
    const events = buildDemoEvents(baseDate)
    const blockedRanges = buildDemoBlockedRanges(baseDate)

    const focusEvent = events.find((event) => event.id === "focus")
    const planningEvent = events.find((event) => event.id === "planning")
    const lunchBlock = blockedRanges.find((range) => range.id === "lunch-block")

    expect(focusEvent).toBeDefined()
    expect(planningEvent).toBeDefined()
    expect(lunchBlock).toBeDefined()

    expect(
      formatEventTimeLabel(focusEvent!.start, focusEvent!.end, {
        hourCycle: 24,
        timeZone: CALENDAR_DEMO_TIME_ZONE,
      })
    ).toBe("13:00 - 15:00")

    expect(
      formatEventTimeLabel(planningEvent!.start, planningEvent!.end, {
        hourCycle: 24,
        timeZone: CALENDAR_DEMO_TIME_ZONE,
      })
    ).toBe("14:00 - 15:30")

    expect(
      formatEventTimeLabel(lunchBlock!.start, lunchBlock!.end, {
        hourCycle: 24,
        timeZone: CALENDAR_DEMO_TIME_ZONE,
      })
    ).toBe("12:00 - 13:00")
  })

  it("keeps demo timed events aligned to 30-minute boundaries", () => {
    const baseDate = new Date("2026-03-24T09:00:00.000Z")
    const timedEvents = [
      ...buildDemoEvents(baseDate),
      ...buildDemoDenseOverlapEvents(baseDate),
    ].filter((event) => !event.allDay)

    for (const event of timedEvents) {
      const [startLabel, endLabel] = formatEventTimeLabel(event.start, event.end, {
        hourCycle: 24,
        timeZone: CALENDAR_DEMO_TIME_ZONE,
      }).split(" - ")

      expect(Number(startLabel.split(":")[1]) % 30).toBe(0)
      expect(Number(endLabel.split(":")[1]) % 30).toBe(0)
    }
  })
})
