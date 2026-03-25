"use client"

import * as React from "react"

const focusableSelector = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",")

type UseModalFocusOptions = {
  containerRef: React.RefObject<HTMLElement | null>
  initialFocusRef?: React.RefObject<HTMLElement | null>
  onClose: () => void
  open: boolean
}

export function useModalFocus({
  containerRef,
  initialFocusRef,
  onClose,
  open,
}: UseModalFocusOptions) {
  React.useEffect(() => {
    if (!open) {
      return
    }

    const focusTrapContainer = containerRef.current

    if (!(focusTrapContainer instanceof HTMLElement)) {
      return
    }

    const container = focusTrapContainer

    const previousFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const previousBodyOverflow = document.body.style.overflow

    document.body.style.overflow = "hidden"

    const frameId = requestAnimationFrame(() => {
      const nextFocusTarget =
        initialFocusRef?.current ?? getFocusableElements(container)[0] ?? container

      nextFocusTarget.focus()
    })

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== "Tab") {
        return
      }

      const focusableElements = getFocusableElements(container)

      if (focusableElements.length === 0) {
        event.preventDefault()
        container.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement =
        document.activeElement instanceof Node ? document.activeElement : null

      if (event.shiftKey) {
        if (activeElement === firstElement || !container.contains(activeElement)) {
          event.preventDefault()
          lastElement.focus()
        }

        return
      }

      if (activeElement === lastElement || !container.contains(activeElement)) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      cancelAnimationFrame(frameId)
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousBodyOverflow
      previousFocusedElement?.focus()
    }
  }, [containerRef, initialFocusRef, onClose, open])
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelector)
  ).filter((element) => {
    const computedStyle = window.getComputedStyle(element)

    return (
      !element.hasAttribute("disabled") &&
      computedStyle.display !== "none" &&
      computedStyle.visibility !== "hidden"
    )
  })
}
