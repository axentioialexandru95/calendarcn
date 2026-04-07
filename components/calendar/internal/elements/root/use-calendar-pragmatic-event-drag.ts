import * as React from "react"

import {
  draggable,
  monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter"

import type {
  CalendarDragData,
  CalendarDropTarget,
  CalendarEventVariant,
  CalendarOccurrence,
} from "../../../types"
import {
  areDropTargetsEqual,
  getCalendarDropTargetFromPoint,
  getDragOffsetMinutes,
  getDragSurfaceRect,
} from "./root-utils"

type PragmaticEventMoveOptions = {
  enabled: boolean
  moveOccurrenceWithTarget: (
    occurrence: CalendarOccurrence,
    target: CalendarDropTarget,
    dragOffsetMinutes?: number
  ) => void
}

type DropTargetStore = {
  getSnapshot: () => CalendarDropTarget | null
  subscribe: (listener: () => void) => () => void
}

type CalendarPragmaticDragPayload = {
  occurrence: CalendarOccurrence
  type: "calendar-event"
  variant: CalendarEventVariant
}

function createDropTargetStore() {
  let snapshot: CalendarDropTarget | null = null
  const listeners = new Set<() => void>()

  function emit() {
    for (const listener of listeners) {
      listener()
    }
  }

  return {
    clear() {
      if (snapshot === null) {
        return
      }

      snapshot = null
      emit()
    },
    getSnapshot() {
      return snapshot
    },
    setSnapshot(nextSnapshot: CalendarDropTarget | null) {
      if (areDropTargetsEqual(snapshot, nextSnapshot)) {
        return
      }

      snapshot = nextSnapshot
      emit()
    },
    subscribe(listener: () => void) {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
  }
}

function isCalendarPragmaticDragPayload(
  value: Record<string, unknown>
): value is CalendarPragmaticDragPayload {
  return value.type === "calendar-event"
}

export function useCalendarPragmaticEventDrag({
  enabled,
  moveOccurrenceWithTarget,
}: PragmaticEventMoveOptions) {
  const [activeDrag, setActiveDrag] = React.useState<
    Extract<CalendarDragData, { kind: "event" }> | null
  >(null)
  const activeDragRef = React.useRef<Extract<
    CalendarDragData,
    { kind: "event" }
  > | null>(null)
  const [activeDragOffsetMinutes, setActiveDragOffsetMinutes] =
    React.useState(0)
  const activeDragOffsetMinutesRef = React.useRef(0)
  const activeDropTargetStore = React.useState(() => createDropTargetStore())[0]
  const activeDropTargetRef = React.useRef<CalendarDropTarget | null>(null)
  const lastDropTargetRef = React.useRef<CalendarDropTarget | null>(null)

  const clearActiveDrag = React.useCallback(() => {
    activeDragRef.current = null
    setActiveDrag(null)
    activeDragOffsetMinutesRef.current = 0
    setActiveDragOffsetMinutes(0)
    activeDropTargetRef.current = null
    lastDropTargetRef.current = null
    activeDropTargetStore.clear()
  }, [activeDropTargetStore])

  const updateDropTarget = React.useCallback(
    (target: CalendarDropTarget | null) => {
      if (areDropTargetsEqual(activeDropTargetRef.current, target)) {
        return
      }

      activeDropTargetRef.current = target
      activeDropTargetStore.setSnapshot(target)

      if (target) {
        lastDropTargetRef.current = target
      }
    },
    [activeDropTargetStore]
  )

  React.useEffect(() => {
    if (!enabled) {
      clearActiveDrag()
      return
    }

    return monitorForElements({
      canMonitor: ({ source }) => {
        return isCalendarPragmaticDragPayload(source.data)
      },
      onDrag: ({ location }) => {
        const nextTarget =
          getCalendarDropTargetFromPoint(
            location.current.input.clientX,
            location.current.input.clientY
          ) ?? lastDropTargetRef.current

        updateDropTarget(nextTarget)
      },
      onDragStart: ({ location, source }) => {
        if (!isCalendarPragmaticDragPayload(source.data)) {
          return
        }

        const nextActiveDrag: Extract<CalendarDragData, { kind: "event" }> = {
          kind: "event",
          occurrence: source.data.occurrence,
          variant: source.data.variant,
        }
        const dragOffsetMinutes = getDragOffsetMinutes(
          nextActiveDrag,
          getDragSurfaceRect(source.element),
          location.current.input.clientY
        )

        activeDragRef.current = nextActiveDrag
        setActiveDrag(nextActiveDrag)
        activeDragOffsetMinutesRef.current = dragOffsetMinutes
        setActiveDragOffsetMinutes(dragOffsetMinutes)
        updateDropTarget(
          getCalendarDropTargetFromPoint(
            location.current.input.clientX,
            location.current.input.clientY
          ) ?? lastDropTargetRef.current
        )
      },
      onDrop: ({ location }) => {
        const currentDrag = activeDragRef.current

        if (!currentDrag) {
          clearActiveDrag()
          return
        }

        const target =
          getCalendarDropTargetFromPoint(
            location.current.input.clientX,
            location.current.input.clientY
          ) ??
          activeDropTargetRef.current ??
          lastDropTargetRef.current

        if (target) {
          moveOccurrenceWithTarget(
            currentDrag.occurrence,
            target,
            activeDragOffsetMinutesRef.current
          )
        }

        clearActiveDrag()
      },
    })
  }, [clearActiveDrag, enabled, moveOccurrenceWithTarget, updateDropTarget])

  const getDraggableConfig = React.useCallback(
    (event: CalendarOccurrence, variant: CalendarEventVariant) => {
      if (!enabled) {
        return null
      }

      return {
        getInitialData() {
          return {
            occurrence: event,
            type: "calendar-event" as const,
            variant,
          }
        },
      }
    },
    [enabled]
  )

  return {
    activeDrag,
    activeDragOffsetMinutes,
    activeDropTargetStore: activeDropTargetStore as DropTargetStore,
    getDraggableConfig,
    isDragging: activeDrag !== null,
  }
}

export function usePragmaticDraggable(
  config:
    | ({
        getInitialData: () => CalendarPragmaticDragPayload
      } & {
        enabled?: boolean
      })
    | null,
  element: HTMLElement | null
) {
  React.useEffect(() => {
    if (!config?.enabled && config?.enabled !== undefined) {
      return
    }

    if (!config || !element) {
      return
    }

    return draggable({
      element,
      getInitialData: config.getInitialData,
    })
  }, [config, element])
}
