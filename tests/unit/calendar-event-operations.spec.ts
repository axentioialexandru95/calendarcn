import { describe, expect, it, vi } from "vitest"

import type {
  CalendarEvent,
  CalendarMoveOperation,
  CalendarOccurrence,
  CalendarResizeOperation,
} from "@/components/calendar/types"
import {
  commitOptimisticMove,
  createOccurrenceInteractionCallbacks,
  handleCalendarEventKeyCommand,
  withResolvedOccurrenceScope,
} from "@/components/calendar/internal/elements/root/event-operations"
import {
  getCalendarDropTargetFromElement,
  parseCalendarDropTargetDataset,
  registerCalendarDropTarget,
} from "@/components/calendar/internal/elements/root/drop-target-registry"
import { createCalendarDropTargetStore } from "@/components/calendar/internal/elements/root/root-utils"

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

  it("creates move operations from drop targets through shared callbacks", () => {
    const occurrence = occurrenceFromEvent({
      id: "planning",
      title: "Planning",
      start: at(0, 9, 0),
      end: at(0, 10, 0),
    })
    const onMoveOperation = vi.fn<(operation: CalendarMoveOperation) => void>()
    const callbacks = createOccurrenceInteractionCallbacks({
      canMove: true,
      canResize: true,
      onMoveOperation,
      onResizeOperation: vi.fn<(operation: CalendarResizeOperation) => void>(),
      runEventKeyCommand: vi.fn(),
      slotDuration: 30,
    })

    callbacks.moveOccurrenceWithTarget(
      occurrence,
      {
        day: at(0, 0, 0),
        kind: "slot",
        minuteOfDay: 600,
      },
      30
    )

    expect(onMoveOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        nextStart: at(0, 9, 30),
        nextEnd: at(0, 10, 30),
      })
    )
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

  it("prefers registered drop targets before dataset fallback", () => {
    const element = {
      dataset: {
        calendarDropTargetDay: at(1, 0, 0).toISOString(),
        calendarDropTargetKind: "slot",
        calendarDropTargetMinute: "630",
      },
    } as unknown as HTMLElement
    const registeredTarget = {
      day: at(0, 0, 0),
      kind: "day" as const,
      resourceId: "room-a",
    }

    const cleanup = registerCalendarDropTarget(element, registeredTarget)

    expect(getCalendarDropTargetFromElement(element)).toEqual(registeredTarget)

    cleanup()

    expect(getCalendarDropTargetFromElement(element)).toEqual({
      day: at(1, 0, 0),
      kind: "slot",
      minuteOfDay: 630,
      resourceId: undefined,
    })
  })

  it("deduplicates equal drop targets in the shared drop target store", () => {
    const store = createCalendarDropTargetStore()
    const listener = vi.fn()
    const day = at(0, 0, 0)

    const unsubscribe = store.subscribe(listener)

    store.setSnapshot({
      day,
      kind: "day",
      resourceId: "room-a",
    })
    store.setSnapshot({
      day: new Date(day),
      kind: "day",
      resourceId: "room-a",
    })
    store.setSnapshot({
      day,
      kind: "slot",
      minuteOfDay: 540,
      resourceId: "room-a",
    })

    unsubscribe()

    expect(listener).toHaveBeenCalledTimes(2)
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
  return new Date(2026, 0, 5 + dayOffset, hour, minute)
}
