import { describe, expect, it } from "vitest"

import type {
  CalendarBlockedRange,
  CalendarEvent,
  CalendarOccurrence,
} from "@/components/calendar/types"
import {
  applyMoveOperation,
  applyResizeOperation,
  createEventFromOperation,
  duplicateOccurrenceAsEvent,
  expandOccurrences,
  getBlockedSegmentsForDay,
  getDayLayout,
  intervalOverlapsBlockedRanges,
} from "@/components/calendar/utils"

describe("calendar utilities", () => {
  it("expands recurring events into stable occurrence ids", () => {
    const occurrences = expandOccurrences(
      [
        {
          id: "daily-sync",
          title: "Daily sync",
          start: at(0, 8, 0),
          end: at(0, 8, 30),
          recurrence: {
            count: 3,
            frequency: "daily",
          },
        },
      ],
      {
        start: at(-1, 0, 0),
        end: at(2, 23, 59),
      }
    )

    expect(occurrences).toHaveLength(3)
    expect(
      occurrences.map((occurrence) => ({
        isRecurringInstance: occurrence.isRecurringInstance,
        occurrenceId: occurrence.occurrenceId,
        sourceEventId: occurrence.sourceEventId,
      }))
    ).toEqual([
      {
        isRecurringInstance: true,
        occurrenceId: "daily-sync:0",
        sourceEventId: "daily-sync",
      },
      {
        isRecurringInstance: true,
        occurrenceId: "daily-sync:1",
        sourceEventId: "daily-sync",
      },
      {
        isRecurringInstance: true,
        occurrenceId: "daily-sync:2",
        sourceEventId: "daily-sync",
      },
    ])
  })

  it("computes overlapping timed layouts into separate columns", () => {
    const day = at(0, 0, 0)
    const firstEvent = occurrenceFromEvent({
      id: "standup",
      title: "Standup",
      start: at(0, 9, 0),
      end: at(0, 10, 0),
    })
    const secondEvent = occurrenceFromEvent({
      id: "review",
      title: "Review",
      start: at(0, 9, 30),
      end: at(0, 10, 30),
    })

    const layout = getDayLayout([firstEvent, secondEvent], day)

    expect(layout).toHaveLength(2)
    expect(
      layout.map((item) => ({
        column: item.column,
        columns: item.columns,
        height: item.height,
        id: item.occurrence.id,
        top: item.top,
      }))
    ).toEqual([
      {
        column: 0,
        columns: 2,
        height: 60,
        id: "standup",
        top: 540,
      },
      {
        column: 1,
        columns: 2,
        height: 60,
        id: "review",
        top: 570,
      },
    ])
  })

  it("clips blocked ranges to the current day window and detects overlaps", () => {
    const blockedRanges: CalendarBlockedRange[] = [
      {
        id: "lunch",
        label: "Lunch",
        start: at(0, 12, 0),
        end: at(0, 13, 0),
      },
    ]

    expect(
      getBlockedSegmentsForDay(at(0, 0, 0), blockedRanges, 8 * 60, 18 * 60)
    ).toEqual([
      expect.objectContaining({
        endMinute: 780,
        id: "lunch",
        label: "Lunch",
        startMinute: 720,
      }),
    ])

    expect(
      intervalOverlapsBlockedRanges(at(0, 12, 30), at(0, 13, 30), blockedRanges)
    ).toBe(true)
    expect(
      intervalOverlapsBlockedRanges(at(0, 13, 0), at(0, 14, 0), blockedRanges)
    ).toBe(false)
  })

  it("applies move and resize operations to the matching source event", () => {
    const focusEvent: CalendarEvent = {
      id: "focus",
      title: "Focus block",
      start: at(0, 13, 0),
      end: at(0, 15, 0),
    }
    const focusOccurrence = occurrenceFromEvent(focusEvent)

    const movedEvents = applyMoveOperation([focusEvent], {
      allDay: false,
      nextEnd: at(0, 15, 30),
      nextStart: at(0, 13, 30),
      occurrence: focusOccurrence,
      previousEnd: focusEvent.end,
      previousStart: focusEvent.start,
    })

    expect(movedEvents[0]).toMatchObject({
      allDay: false,
      end: at(0, 15, 30),
      start: at(0, 13, 30),
    })

    const resizedEvents = applyResizeOperation([focusEvent], {
      edge: "end",
      nextEnd: at(0, 15, 30),
      nextStart: focusEvent.start,
      occurrence: focusOccurrence,
      previousEnd: focusEvent.end,
      previousStart: focusEvent.start,
    })

    expect(resizedEvents[0]).toMatchObject({
      end: at(0, 15, 30),
      start: at(0, 13, 0),
    })
  })

  it("creates and duplicates events with the expected default shaping", () => {
    const createdEvent = createEventFromOperation(
      {
        end: at(0, 10, 0),
        start: at(0, 9, 0),
        title: "Planning review",
      },
      {
        calendarLabel: "Product",
        color: "#2563eb",
        resourceId: "product",
      }
    )

    expect(createdEvent).toMatchObject({
      calendarLabel: "Product",
      color: "#2563eb",
      resourceId: "product",
      title: "Planning review",
    })
    expect(createdEvent.id).toEqual(expect.any(String))

    const duplicate = duplicateOccurrenceAsEvent(
      occurrenceFromEvent({
        id: "standup",
        title: "Studio standup",
        start: at(0, 9, 0),
        end: at(0, 9, 30),
        calendarId: "product",
        calendarLabel: "Product",
        color: "#2563eb",
      })
    )

    expect(duplicate).toMatchObject({
      calendarId: "product",
      recurrence: undefined,
      title: "Studio standup",
    })
    expect(duplicate.allDay).toBeUndefined()
    expect(duplicate.start).toEqual(at(0, 10, 0))
    expect(duplicate.end).toEqual(at(0, 10, 30))
  })
})

function at(dayOffset: number, hour: number, minute: number) {
  return new Date(2026, 2, 24 + dayOffset, hour, minute, 0, 0)
}

function occurrenceFromEvent(event: CalendarEvent): CalendarOccurrence {
  return {
    ...event,
    occurrenceId: event.id,
    sourceEventId: event.id,
    isRecurringInstance: false,
    seriesIndex: 0,
  }
}
