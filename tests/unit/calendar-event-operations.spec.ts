import { describe, expect, it, vi } from "vitest"

import type {
  CalendarEvent,
  CalendarMoveOperation,
  CalendarOccurrence,
  CalendarResizeOperation,
} from "@/components/calendar/types"
import {
  commitOptimisticMove,
  handleCalendarEventKeyCommand,
  withResolvedOccurrenceScope,
} from "@/components/calendar/internal/elements/root/event-operations"
import { parseCalendarDropTargetDataset } from "@/components/calendar/internal/elements/root/drop-target-registry"

describe("calendar event operations", () => {
  it("resolves recurring scope consistently", () => {
    expect(
      withResolvedOccurrenceScope({
        occurrence: occurrenceFromEvent({
          id: "focus",
          title: "Focus",
          start: at(0, 9, 0),
          end: at(0, 10, 0),
        }),
      }).scope
    ).toBe("occurrence")

    expect(
      withResolvedOccurrenceScope({
        occurrence: occurrenceFromEvent({
          id: "series",
          title: "Series",
          start: at(0, 9, 0),
          end: at(0, 10, 0),
          recurrence: {
            frequency: "weekly",
          },
        }),
      }).scope
    ).toBe("series")
  })

  it("commits optimistic move operations through the shared helper", () => {
    const baseEvent: CalendarEvent = {
      id: "focus",
      title: "Focus",
      start: at(0, 9, 0),
      end: at(0, 10, 0),
    }
    const movedOccurrence = occurrenceFromEvent(baseEvent)
    let optimisticEvents = [baseEvent]
    const onEventMove = vi.fn<(operation: CalendarMoveOperation) => void>()
    const announce = vi.fn<(message: string) => void>()

    commitOptimisticMove(
      {
        occurrence: movedOccurrence,
        nextStart: at(0, 10, 0),
        nextEnd: at(0, 11, 0),
        previousStart: baseEvent.start,
        previousEnd: baseEvent.end,
      },
      {
        announce,
        formatAnnouncementRange: () => "10:00 - 11:00",
        onEventMove,
        setOptimisticEvents(updater) {
          optimisticEvents =
            typeof updater === "function" ? updater(optimisticEvents) : updater
        },
      }
    )

    expect(onEventMove).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: "occurrence",
      })
    )
    expect(optimisticEvents[0]).toMatchObject({
      start: at(0, 10, 0),
      end: at(0, 11, 0),
    })
    expect(announce).toHaveBeenCalledWith("Moved Focus to 10:00 - 11:00.")
  })

  it("builds move operations from keyboard input without browser-only tests", () => {
    const occurrence = occurrenceFromEvent({
      id: "standup",
      title: "Standup",
      start: at(0, 9, 0),
      end: at(0, 9, 30),
    })
    const onMoveOperation = vi.fn<(operation: CalendarMoveOperation) => void>()
    const onResizeOperation = vi.fn<(operation: CalendarResizeOperation) => void>()
    const preventDefault = vi.fn()

    handleCalendarEventKeyCommand({
      announce: vi.fn(),
      canMove: true,
      canResize: true,
      event: {
        altKey: false,
        key: "ArrowRight",
        preventDefault,
        shiftKey: false,
      } as unknown as React.KeyboardEvent<HTMLButtonElement>,
      occurrence,
      onMoveOperation,
      onResizeOperation,
      slotDuration: 30,
    })

    expect(preventDefault).toHaveBeenCalled()
    expect(onResizeOperation).not.toHaveBeenCalled()
    expect(onMoveOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        nextStart: at(1, 9, 0),
        nextEnd: at(1, 9, 30),
      })
    )
  })

  it("parses typed drop target metadata without DOM event plumbing", () => {
    expect(
      parseCalendarDropTargetDataset({
        dataset: {
          calendarDropTargetDay: at(0, 0, 0).toISOString(),
          calendarDropTargetKind: "slot",
          calendarDropTargetMinute: "540",
          calendarDropTargetResourceId: "room-a",
        },
      })
    ).toEqual({
      day: at(0, 0, 0),
      kind: "slot",
      minuteOfDay: 540,
      resourceId: "room-a",
    })
  })
})

function occurrenceFromEvent(event: CalendarEvent): CalendarOccurrence {
  return {
    ...event,
    occurrenceId: `${event.id}:0`,
    sourceEventId: event.id,
    isRecurringInstance: !!event.recurrence,
    seriesIndex: 0,
  }
}

function at(dayOffset: number, hour: number, minute: number) {
  return new Date(Date.UTC(2026, 0, 5 + dayOffset, hour, minute))
}
