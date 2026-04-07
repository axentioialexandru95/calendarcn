import * as React from "react"

import { startOfDay } from "date-fns"

import type { TimeGridViewProps } from "../../shared"
import { setMinuteOfDay } from "../../../utils"

import {
  clampGridMinute,
  getDefaultFocusedTimeSlot,
  type FocusedTimeSlot,
  normalizeFocusedTimeSlot,
} from "./time-grid-utils"

type UseTimeGridNavigationOptions = {
  days: Date[]
  maxMinute: number
  minMinute: number
  onEventCreate?: TimeGridViewProps["onEventCreate"]
  slotDuration: number
}

export function useTimeGridNavigation({
  days,
  maxMinute,
  minMinute,
  onEventCreate,
  slotDuration,
}: UseTimeGridNavigationOptions) {
  const dayGridRefs = React.useRef<Array<HTMLDivElement | null>>([])
  const [focusedSlot, setFocusedSlot] = React.useState<FocusedTimeSlot>(() =>
    getDefaultFocusedTimeSlot(days, minMinute, maxMinute, slotDuration)
  )
  const [focusedGridDayIndex, setFocusedGridDayIndex] = React.useState<
    number | null
  >(null)
  const gridInstructionsId = React.useId()

  React.useEffect(() => {
    setFocusedSlot((currentSlot) =>
      normalizeFocusedTimeSlot(
        currentSlot,
        days.length,
        minMinute,
        maxMinute,
        slotDuration
      )
    )
  }, [days.length, maxMinute, minMinute, slotDuration])

  const focusDayGrid = React.useCallback((dayIndex: number) => {
    requestAnimationFrame(() => {
      dayGridRefs.current[dayIndex]?.focus()
    })
  }, [])

  const setDayGridRef = React.useCallback(
    (dayIndex: number, element: HTMLDivElement | null) => {
      dayGridRefs.current[dayIndex] = element
    },
    []
  )

  const handleGridKeyDown = React.useCallback(
    (
      dayIndex: number,
      day: Date,
      event: React.KeyboardEvent<HTMLDivElement>
    ) => {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return
      }

      const currentMinuteOfDay = clampGridMinute(
        focusedSlot.minuteOfDay,
        minMinute,
        maxMinute,
        slotDuration
      )
      const maxDayIndex = Math.max(0, days.length - 1)
      let nextDayIndex = dayIndex
      let nextMinuteOfDay = currentMinuteOfDay
      let handled = true

      switch (event.key) {
        case "ArrowUp":
          nextMinuteOfDay = clampGridMinute(
            currentMinuteOfDay - slotDuration,
            minMinute,
            maxMinute,
            slotDuration
          )
          break
        case "ArrowDown":
          nextMinuteOfDay = clampGridMinute(
            currentMinuteOfDay + slotDuration,
            minMinute,
            maxMinute,
            slotDuration
          )
          break
        case "ArrowLeft":
          nextDayIndex = Math.max(0, dayIndex - 1)
          break
        case "ArrowRight":
          nextDayIndex = Math.min(maxDayIndex, dayIndex + 1)
          break
        case "Home":
          nextMinuteOfDay = minMinute
          break
        case "End":
          nextMinuteOfDay = clampGridMinute(
            maxMinute - slotDuration,
            minMinute,
            maxMinute,
            slotDuration
          )
          break
        case "Enter":
        case " ": {
          if (!onEventCreate) {
            return
          }

          event.preventDefault()
          const start = setMinuteOfDay(startOfDay(day), currentMinuteOfDay)
          const end = setMinuteOfDay(
            startOfDay(day),
            Math.min(currentMinuteOfDay + slotDuration, 1_440)
          )

          onEventCreate({
            end,
            start,
          })
          return
        }
        default:
          handled = false
          break
      }

      if (!handled) {
        return
      }

      event.preventDefault()
      setFocusedSlot({
        dayIndex: nextDayIndex,
        minuteOfDay: nextMinuteOfDay,
      })

      if (nextDayIndex !== dayIndex) {
        focusDayGrid(nextDayIndex)
      }
    },
    [
      days.length,
      focusDayGrid,
      focusedSlot.minuteOfDay,
      maxMinute,
      minMinute,
      onEventCreate,
      slotDuration,
    ]
  )

  return {
    focusDayGrid,
    focusedGridDayIndex,
    focusedSlot,
    gridInstructionsId,
    handleGridKeyDown,
    setDayGridRef,
    setFocusedGridDayIndex,
    setFocusedSlot,
  }
}
