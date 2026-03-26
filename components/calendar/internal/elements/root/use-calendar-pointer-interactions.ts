import * as React from "react"

import type {
  CalendarDragData,
  CalendarDropTarget,
  CalendarOccurrence,
} from "../../../types"
import { canMoveOccurrence, canResizeOccurrence } from "../../../utils"

import {
  areDropTargetsEqual,
  dragActivationDistance,
  getCalendarDropTargetFromPoint,
  getDragOffsetMinutes,
  getDragSurfaceRect,
  getPointerDistance,
  getTimeGridDropTargetFromPoint,
  isTouchPointer,
  lockDocumentTouchScroll,
  type ActiveDragInteraction,
  type ActiveResizeState,
} from "./root-utils"

type UseCalendarPointerInteractionsOptions = {
  announce: (message: string) => void
  closeContextMenu: () => void
  closeEventDetails: () => void
  enableEventMove: boolean
  enableEventResize: boolean
  moveOccurrenceWithTarget: (
    occurrence: CalendarOccurrence,
    target: CalendarDropTarget,
    dragOffsetMinutes?: number
  ) => void
  resizeOccurrenceWithTarget: (
    occurrence: CalendarOccurrence,
    edge: "start" | "end",
    target: CalendarDropTarget
  ) => void
  selectOccurrence: (occurrence: CalendarOccurrence) => void
}

export function useCalendarPointerInteractions({
  announce,
  closeContextMenu,
  closeEventDetails,
  enableEventMove,
  enableEventResize,
  moveOccurrenceWithTarget,
  resizeOccurrenceWithTarget,
  selectOccurrence,
}: UseCalendarPointerInteractionsOptions) {
  const [activeDrag, setActiveDrag] = React.useState<CalendarDragData | null>(
    null
  )
  const [activeDropTarget, setActiveDropTarget] =
    React.useState<CalendarDropTarget | null>(null)
  const activeDropTargetRef = React.useRef<CalendarDropTarget | null>(null)
  const lastDropTargetRef = React.useRef<CalendarDropTarget | null>(null)
  const [activeDragOffsetMinutes, setActiveDragOffsetMinutes] =
    React.useState(0)
  const activeDragOffsetMinutesRef = React.useRef(0)
  const [activeDragInteraction, setActiveDragInteraction] =
    React.useState<ActiveDragInteraction | null>(null)
  const activeDragRef = React.useRef<CalendarDragData | null>(null)
  const activeDragInteractionRef = React.useRef<ActiveDragInteraction | null>(
    null
  )
  const [activeResize, setActiveResize] =
    React.useState<ActiveResizeState | null>(null)
  const activeResizeRef = React.useRef<ActiveResizeState | null>(null)
  const [activeResizeTarget, setActiveResizeTarget] =
    React.useState<CalendarDropTarget | null>(null)
  const activeResizeTargetRef = React.useRef<CalendarDropTarget | null>(null)
  const lastResizeTargetRef = React.useRef<CalendarDropTarget | null>(null)
  const [activeDragRect, setActiveDragRect] = React.useState<DOMRect | null>(
    null
  )
  const activeDragRectRef = React.useRef<DOMRect | null>(null)
  const suppressedPointerClickOccurrenceIdRef = React.useRef<string | null>(
    null
  )
  const dragTouchScrollReleaseRef = React.useRef<(() => void) | null>(null)
  const resizeTouchScrollReleaseRef = React.useRef<(() => void) | null>(null)

  React.useEffect(() => {
    activeDragRef.current = activeDrag
  }, [activeDrag])

  React.useEffect(() => {
    activeDragInteractionRef.current = activeDragInteraction
  }, [activeDragInteraction])

  React.useEffect(() => {
    activeResizeRef.current = activeResize
  }, [activeResize])

  React.useEffect(() => {
    activeDragOffsetMinutesRef.current = activeDragOffsetMinutes
  }, [activeDragOffsetMinutes])

  React.useEffect(() => {
    activeDragRectRef.current = activeDragRect
  }, [activeDragRect])

  function releaseCapturedPointer(
    captureElement: HTMLElement | null,
    pointerId: number | null | undefined
  ) {
    if (!captureElement || pointerId == null) {
      return
    }

    try {
      if (captureElement.hasPointerCapture(pointerId)) {
        captureElement.releasePointerCapture(pointerId)
      }
    } catch {
      // Ignore capture errors during teardown.
    }
  }

  function releaseTouchScrollLock(
    releaseRef: React.MutableRefObject<(() => void) | null>
  ) {
    releaseRef.current?.()
    releaseRef.current = null
  }

  function updateActiveDropTarget(target: CalendarDropTarget | null) {
    if (areDropTargetsEqual(activeDropTargetRef.current, target)) {
      return
    }

    activeDropTargetRef.current = target
    setActiveDropTarget(target)

    if (target) {
      lastDropTargetRef.current = target
    }
  }

  function updateActiveResizeTarget(target: CalendarDropTarget | null) {
    if (areDropTargetsEqual(activeResizeTargetRef.current, target)) {
      return
    }

    activeResizeTargetRef.current = target
    setActiveResizeTarget(target)

    if (target) {
      lastResizeTargetRef.current = target
    }
  }

  function clearActiveDragState() {
    releaseCapturedPointer(
      activeDragInteractionRef.current?.captureElement ?? null,
      activeDragInteractionRef.current?.pointerId
    )
    releaseTouchScrollLock(dragTouchScrollReleaseRef)
    setActiveDrag(null)
    setActiveDragInteraction(null)
    updateActiveDropTarget(null)
    setActiveDragOffsetMinutes(0)
    setActiveDragRect(null)
    lastDropTargetRef.current = null
  }

  function clearActiveResize() {
    releaseCapturedPointer(
      activeResizeRef.current?.captureElement ?? null,
      activeResizeRef.current?.pointerId
    )
    releaseTouchScrollLock(resizeTouchScrollReleaseRef)
    setActiveResize(null)
    updateActiveResizeTarget(null)
    lastResizeTargetRef.current = null
  }

  const shouldSuppressEventClick = React.useCallback((occurrenceId: string) => {
    if (suppressedPointerClickOccurrenceIdRef.current !== occurrenceId) {
      return false
    }

    suppressedPointerClickOccurrenceIdRef.current = null
    return true
  }, [])

  const handleResizeHandlePointerDown = React.useCallback(
    (
      occurrence: CalendarOccurrence,
      edge: "start" | "end",
      event: React.PointerEvent<HTMLSpanElement>
    ) => {
      if (!enableEventResize || !canResizeOccurrence(occurrence)) {
        announce("This event cannot be resized.")
        return
      }

      closeContextMenu()
      closeEventDetails()
      if (isTouchPointer(event.pointerType)) {
        resizeTouchScrollReleaseRef.current = lockDocumentTouchScroll()
      }

      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // Pointer capture is not guaranteed on every platform.
      }

      setActiveResize({
        captureElement: event.currentTarget,
        edge,
        occurrence,
        pointerId: event.pointerId,
        pointerType: event.pointerType,
      })
      updateActiveResizeTarget(
        getTimeGridDropTargetFromPoint(event.clientX, event.clientY)
      )
    },
    [announce, closeContextMenu, closeEventDetails, enableEventResize]
  )

  const handleEventDragPointerDown = React.useCallback(
    (
      occurrence: CalendarOccurrence,
      variant: CalendarDragData["variant"],
      event: React.PointerEvent<HTMLButtonElement>
    ) => {
      if (!enableEventMove || !canMoveOccurrence(occurrence)) {
        return
      }

      closeContextMenu()
      closeEventDetails()
      suppressedPointerClickOccurrenceIdRef.current = null
      if (isTouchPointer(event.pointerType)) {
        event.preventDefault()
        dragTouchScrollReleaseRef.current = lockDocumentTouchScroll()
      }

      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // Pointer capture is not guaranteed on every platform.
      }

      setActiveDrag({
        kind: "event",
        occurrence,
        variant,
      })
      setActiveDragInteraction({
        captureElement: event.currentTarget,
        currentClientX: event.clientX,
        currentClientY: event.clientY,
        initialClientX: event.clientX,
        initialClientY: event.clientY,
        isDragging: false,
        pointerId: event.pointerId,
        pointerType: event.pointerType,
      })
      updateActiveDropTarget(null)
      lastDropTargetRef.current = null
      setActiveDragRect(getDragSurfaceRect(event.currentTarget))
      setActiveDragOffsetMinutes(0)
    },
    [closeContextMenu, closeEventDetails, enableEventMove]
  )

  const commitPointerResize = React.useEffectEvent(
    (resize: ActiveResizeState, target: CalendarDropTarget) => {
      resizeOccurrenceWithTarget(resize.occurrence, resize.edge, target)
    }
  )
  const clearPointerResize = React.useEffectEvent(() => {
    clearActiveResize()
  })
  const commitPointerDrag = React.useEffectEvent(
    (
      drag: Extract<CalendarDragData, { kind: "event" }>,
      target: CalendarDropTarget,
      dragOffsetMinutes: number
    ) => {
      moveOccurrenceWithTarget(drag.occurrence, target, dragOffsetMinutes)
    }
  )
  const selectPointerDragOccurrence = React.useEffectEvent(
    (drag: Extract<CalendarDragData, { kind: "event" }>) => {
      selectOccurrence(drag.occurrence)
    }
  )
  const clearPointerDrag = React.useEffectEvent(() => {
    clearActiveDragState()
  })

  React.useEffect(() => {
    if (!activeResize) {
      return
    }

    const resize = activeResize

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerId !== resize.pointerId) {
        return
      }

      if (isTouchPointer(resize.pointerType)) {
        event.preventDefault()
      }

      updateActiveResizeTarget(
        getTimeGridDropTargetFromPoint(event.clientX, event.clientY)
      )
    }

    function handlePointerUp(event: PointerEvent) {
      if (event.pointerId !== resize.pointerId) {
        return
      }

      const target =
        getTimeGridDropTargetFromPoint(event.clientX, event.clientY) ??
        activeResizeTargetRef.current ??
        lastResizeTargetRef.current

      if (!target) {
        clearPointerResize()
        return
      }

      commitPointerResize(resize, target)
      clearPointerResize()
    }

    function handlePointerCancel(event: PointerEvent) {
      if (event.pointerId !== resize.pointerId) {
        return
      }

      clearPointerResize()
    }

    window.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    })
    window.addEventListener("pointerup", handlePointerUp)
    window.addEventListener("pointercancel", handlePointerCancel)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("pointercancel", handlePointerCancel)
    }
  }, [activeResize])

  const activeDragPointerId = activeDragInteraction?.pointerId

  React.useEffect(() => {
    if (activeDragPointerId == null) {
      return
    }

    const pointerId = activeDragPointerId

    function handlePointerMove(event: PointerEvent) {
      if (event.pointerId !== pointerId) {
        return
      }

      const drag = activeDragRef.current
      const interaction = activeDragInteractionRef.current

      if (!drag || !interaction || drag.kind !== "event") {
        return
      }

      const nextTarget =
        getCalendarDropTargetFromPoint(event.clientX, event.clientY) ??
        lastDropTargetRef.current

      if (!interaction.isDragging) {
        if (
          getPointerDistance(
            interaction.initialClientX,
            interaction.initialClientY,
            event.clientX,
            event.clientY
          ) < dragActivationDistance
        ) {
          return
        }

        if (isTouchPointer(interaction.pointerType)) {
          event.preventDefault()
        }

        setActiveDragInteraction({
          ...interaction,
          currentClientX: event.clientX,
          currentClientY: event.clientY,
          isDragging: true,
        })
        setActiveDragOffsetMinutes(
          getDragOffsetMinutes(drag, activeDragRectRef.current, event.clientY)
        )
        updateActiveDropTarget(nextTarget)
        return
      }

      if (isTouchPointer(interaction.pointerType)) {
        event.preventDefault()
      }

      setActiveDragInteraction((currentInteraction) => {
        if (
          !currentInteraction ||
          currentInteraction.pointerId !== pointerId ||
          (currentInteraction.currentClientX === event.clientX &&
            currentInteraction.currentClientY === event.clientY)
        ) {
          return currentInteraction
        }

        return {
          ...currentInteraction,
          currentClientX: event.clientX,
          currentClientY: event.clientY,
        }
      })
      updateActiveDropTarget(nextTarget)
    }

    function handlePointerUp(event: PointerEvent) {
      if (event.pointerId !== pointerId) {
        return
      }

      const drag = activeDragRef.current
      const interaction = activeDragInteractionRef.current

      if (!drag || !interaction || drag.kind !== "event") {
        clearPointerDrag()
        return
      }

      const target =
        getCalendarDropTargetFromPoint(event.clientX, event.clientY) ??
        activeDropTargetRef.current ??
        lastDropTargetRef.current
      const dragOffsetMinutes = activeDragOffsetMinutesRef.current
      const wasDragging = interaction.isDragging

      suppressedPointerClickOccurrenceIdRef.current =
        drag.occurrence.occurrenceId
      clearPointerDrag()

      if (!wasDragging) {
        selectPointerDragOccurrence(drag)
        return
      }

      if (target) {
        commitPointerDrag(drag, target, dragOffsetMinutes)
      }
    }

    function handlePointerCancel(event: PointerEvent) {
      if (event.pointerId !== pointerId) {
        return
      }

      const drag = activeDragRef.current

      if (drag?.kind === "event") {
        suppressedPointerClickOccurrenceIdRef.current =
          drag.occurrence.occurrenceId
      }

      clearPointerDrag()
    }

    window.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    })
    window.addEventListener("pointerup", handlePointerUp)
    window.addEventListener("pointercancel", handlePointerCancel)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("pointercancel", handlePointerCancel)
    }
  }, [activeDragPointerId])

  return {
    activeDrag,
    activeDragInteraction,
    activeDragOffsetMinutes,
    activeDragRect,
    activeDropTarget,
    activeResize,
    activeResizeTarget,
    handleEventDragPointerDown,
    handleResizeHandlePointerDown,
    isPointerDragging:
      activeDrag?.kind === "event" && !!activeDragInteraction?.isDragging,
    shouldSuppressEventClick,
  }
}
