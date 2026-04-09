import * as React from "react"

import type {
  CalendarDragData,
  CalendarDropTarget,
  CalendarOccurrence,
} from "../../../types"
import { canMoveOccurrence, canResizeOccurrence } from "../../../utils"

import {
  areDropTargetsEqual,
  createCalendarDropTargetStore,
  dragActivationDistance,
  type DragOverlayPosition,
  getDragOffsetMinutes,
  getDragSurfaceRect,
  getResizeDropTargetFromPoint,
  isTouchPointer,
  lockDocumentTouchScroll,
  resolveCalendarDropTargetAtPoint,
  type ActiveDragInteraction,
  type ActiveResizeState,
} from "./root-utils"
import type { ExternalStore as ImportedExternalStore } from "./external-store"

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
  preferPragmaticEventMove?: boolean
  selectOccurrence: (occurrence: CalendarOccurrence) => void
}

type ExternalStore<T> = ImportedExternalStore<T>

type DragInteractionResolution = {
  dragOffsetMinutes: number
  target: CalendarDropTarget | null
}

function resolvePointerDragTarget(
  event: PointerEvent,
  fallbackTarget: CalendarDropTarget | null
): CalendarDropTarget | null {
  return resolveCalendarDropTargetAtPoint(event.clientX, event.clientY, {
    fallbackTarget,
  })
}

function createFrameThrottledDragOverlayStore() {
  return createExternalStore<DragOverlayPosition | null>(null, {
    frameThrottle: true,
  })
}

function resolvePointerDragMove(
  drag: Extract<CalendarDragData, { kind: "event" }>,
  event: PointerEvent,
  dragRect: DOMRect | null,
  fallbackTarget: CalendarDropTarget | null
): DragInteractionResolution {
  return {
    dragOffsetMinutes: getDragOffsetMinutes(drag, dragRect, event.clientY),
    target: resolvePointerDragTarget(event, fallbackTarget),
  }
}

export function useCalendarPointerInteractions({
  announce,
  closeContextMenu,
  closeEventDetails,
  enableEventMove,
  enableEventResize,
  moveOccurrenceWithTarget,
  preferPragmaticEventMove = false,
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
  const dragOverlayStore = React.useState(createFrameThrottledDragOverlayStore)[0]
  const activeDropTargetStore = React.useState(createCalendarDropTargetStore)[0]
  const suppressedPointerClickOccurrenceIdRef = React.useRef<string | null>(
    null
  )
  const dragTouchScrollReleaseRef = React.useRef<(() => void) | null>(null)
  const resizeTouchScrollReleaseRef = React.useRef<(() => void) | null>(null)

  const updateActiveDrag = React.useCallback(
    (nextDrag: CalendarDragData | null) => {
      activeDragRef.current = nextDrag
      setActiveDrag(nextDrag)
    },
    []
  )

  const updateActiveDragInteraction = React.useCallback(
    (nextInteraction: ActiveDragInteraction | null) => {
      activeDragInteractionRef.current = nextInteraction
      setActiveDragInteraction(nextInteraction)
    },
    []
  )

  const updateActiveResize = React.useCallback(
    (nextResize: ActiveResizeState | null) => {
      activeResizeRef.current = nextResize
      setActiveResize(nextResize)
    },
    []
  )

  const updateActiveDragOffsetMinutes = React.useCallback(
    (nextOffsetMinutes: number) => {
      activeDragOffsetMinutesRef.current = nextOffsetMinutes
      setActiveDragOffsetMinutes(nextOffsetMinutes)
    },
    []
  )

  const updateActiveDragRect = React.useCallback((nextRect: DOMRect | null) => {
    activeDragRectRef.current = nextRect
    setActiveDragRect(nextRect)
  }, [])

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

  const updateActiveDropTarget = React.useCallback(
    (target: CalendarDropTarget | null) => {
      if (areDropTargetsEqual(activeDropTargetRef.current, target)) {
        return
      }

      activeDropTargetRef.current = target
      activeDropTargetStore.setSnapshot(target)

      setActiveDropTarget(target)

      if (target) {
        lastDropTargetRef.current = target
      }
    },
    [activeDropTargetStore]
  )

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
    updateActiveDrag(null)
    updateActiveDragInteraction(null)
    updateActiveDropTarget(null)
    updateActiveDragOffsetMinutes(0)
    updateActiveDragRect(null)
    dragOverlayStore.clear()
    lastDropTargetRef.current = null
  }

  function clearActiveResize() {
    releaseCapturedPointer(
      activeResizeRef.current?.captureElement ?? null,
      activeResizeRef.current?.pointerId
    )
    releaseTouchScrollLock(resizeTouchScrollReleaseRef)
    updateActiveResize(null)
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
      variant: CalendarDragData["variant"],
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

      updateActiveResize({
        captureElement: event.currentTarget,
        edge,
        hasPointerCapture: event.currentTarget.hasPointerCapture(
          event.pointerId
        ),
        occurrence,
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        variant,
      })
      updateActiveResizeTarget(
        getResizeDropTargetFromPoint(variant, event.clientX, event.clientY)
      )
    },
    [
      announce,
      closeContextMenu,
      closeEventDetails,
      enableEventResize,
      updateActiveResize,
    ]
  )

  const handleEventDragPointerDown = React.useCallback(
    (
      occurrence: CalendarOccurrence,
      variant: CalendarDragData["variant"],
      event: React.PointerEvent<HTMLButtonElement>
    ) => {
      const selectedDesktopEvent =
        event.pointerType !== "touch" &&
        event.currentTarget.dataset.selected === "true"

      if (
        preferPragmaticEventMove &&
        event.pointerType !== "touch" &&
        !selectedDesktopEvent
      ) {
        return
      }

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

      updateActiveDrag({
        kind: "event",
        occurrence,
        variant,
      })
      updateActiveDragInteraction({
        captureElement: event.currentTarget,
        currentClientX: event.clientX,
        currentClientY: event.clientY,
        hasPointerCapture: event.currentTarget.hasPointerCapture(
          event.pointerId
        ),
        initialClientX: event.clientX,
        initialClientY: event.clientY,
        isDragging: false,
        pointerId: event.pointerId,
        pointerType: event.pointerType,
      })
      updateActiveDropTarget(null)
      lastDropTargetRef.current = null
      updateActiveDragRect(getDragSurfaceRect(event.currentTarget))
      updateActiveDragOffsetMinutes(0)
    },
    [
      closeContextMenu,
      closeEventDetails,
      enableEventMove,
      preferPragmaticEventMove,
      updateActiveDrag,
      updateActiveDropTarget,
      updateActiveDragInteraction,
      updateActiveDragOffsetMinutes,
      updateActiveDragRect,
    ]
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

  React.useLayoutEffect(() => {
    if (!activeResize) {
      return
    }

    const resize = activeResize
    // Resize handles unmount as soon as the preview state replaces the source
    // event, so window-level listeners keep the interaction alive after that.
    const pointerEventTarget = window

    function handlePointerMove(event: Event) {
      if (!(event instanceof PointerEvent)) {
        return
      }

      if (event.pointerId !== resize.pointerId) {
        return
      }

      if (isTouchPointer(resize.pointerType)) {
        event.preventDefault()
      }

      updateActiveResizeTarget(
        getResizeDropTargetFromPoint(
          resize.variant,
          event.clientX,
          event.clientY,
          activeResizeTargetRef.current ?? lastResizeTargetRef.current
        )
      )
    }

    function handlePointerUp(event: Event) {
      if (!(event instanceof PointerEvent)) {
        return
      }

      if (event.pointerId !== resize.pointerId) {
        return
      }

      const target =
        getResizeDropTargetFromPoint(
          resize.variant,
          event.clientX,
          event.clientY,
          activeResizeTargetRef.current ?? lastResizeTargetRef.current
        ) ??
        activeResizeTargetRef.current ??
        lastResizeTargetRef.current

      if (!target) {
        clearPointerResize()
        return
      }

      commitPointerResize(resize, target)
      clearPointerResize()
    }

    function handlePointerCancel(event: Event) {
      if (!(event instanceof PointerEvent)) {
        return
      }

      if (event.pointerId !== resize.pointerId) {
        return
      }

      clearPointerResize()
    }

    pointerEventTarget.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    })
    pointerEventTarget.addEventListener("pointerup", handlePointerUp)
    pointerEventTarget.addEventListener("pointercancel", handlePointerCancel)

    return () => {
      pointerEventTarget.removeEventListener("pointermove", handlePointerMove)
      pointerEventTarget.removeEventListener("pointerup", handlePointerUp)
      pointerEventTarget.removeEventListener(
        "pointercancel",
        handlePointerCancel
      )
    }
  }, [activeResize])

  const activeDragPointerId = activeDragInteraction?.pointerId

  React.useLayoutEffect(() => {
    if (activeDragPointerId == null) {
      return
    }

    const initialInteraction = activeDragInteractionRef.current

    if (
      !initialInteraction ||
      initialInteraction.pointerId !== activeDragPointerId
    ) {
      return
    }

    const pointerId = activeDragPointerId
    const pointerEventTarget =
      initialInteraction.hasPointerCapture && initialInteraction.captureElement
        ? initialInteraction.captureElement
        : window

    function handlePointerMove(event: Event) {
      if (!(event instanceof PointerEvent)) {
        return
      }

      if (event.pointerId !== pointerId) {
        return
      }

      const drag = activeDragRef.current
      const interaction = activeDragInteractionRef.current

      if (!drag || !interaction || drag.kind !== "event") {
        return
      }

      const nextResolution = resolvePointerDragMove(
        drag,
        event,
        activeDragRectRef.current,
        lastDropTargetRef.current
      )

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

        updateActiveDragInteraction({
          ...interaction,
          isDragging: true,
        })
        dragOverlayStore.setSnapshot({
          clientX: event.clientX,
          clientY: event.clientY,
        })
        updateActiveDragOffsetMinutes(nextResolution.dragOffsetMinutes)
        updateActiveDropTarget(nextResolution.target)
        return
      }

      if (isTouchPointer(interaction.pointerType)) {
        event.preventDefault()
      }

      dragOverlayStore.setSnapshot({
        clientX: event.clientX,
        clientY: event.clientY,
      })
      updateActiveDropTarget(nextResolution.target)
    }

    function handlePointerUp(event: Event) {
      if (!(event instanceof PointerEvent)) {
        return
      }

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
        resolvePointerDragTarget(
          event,
          activeDropTargetRef.current ?? lastDropTargetRef.current
        ) ??
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

    function handlePointerCancel(event: Event) {
      if (!(event instanceof PointerEvent)) {
        return
      }

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

    pointerEventTarget.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    })
    pointerEventTarget.addEventListener("pointerup", handlePointerUp)
    pointerEventTarget.addEventListener("pointercancel", handlePointerCancel)

    return () => {
      pointerEventTarget.removeEventListener("pointermove", handlePointerMove)
      pointerEventTarget.removeEventListener("pointerup", handlePointerUp)
      pointerEventTarget.removeEventListener(
        "pointercancel",
        handlePointerCancel
      )
    }
  }, [
    activeDragPointerId,
    dragOverlayStore,
    updateActiveDropTarget,
    updateActiveDragInteraction,
    updateActiveDragOffsetMinutes,
  ])

  return {
    activeDrag,
    activeDragInteraction,
    activeDragOffsetMinutes,
    activeDragRect,
    activeDropTarget,
    activeDropTargetStore,
    activeResize,
    activeResizeTarget,
    dragOverlayStore,
    handleEventDragPointerDown,
    handleResizeHandlePointerDown,
    isPointerDragging:
      activeDrag?.kind === "event" && !!activeDragInteraction?.isDragging,
    shouldSuppressEventClick,
  }
}
