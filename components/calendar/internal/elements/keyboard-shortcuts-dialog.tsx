"use client"

import * as React from "react"

import { KeyboardIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"

import type { CalendarKeyboardShortcutsConfig } from "../../types"
import { useModalFocus } from "./use-modal-focus"

type CalendarKeyboardShortcutsDialogProps = {
  config?: CalendarKeyboardShortcutsConfig
  onOpenChange: (open: boolean) => void
  open: boolean
}

const shortcutRows = [
  {
    description: "Move the active schedule slot through the week or day grid.",
    keys: "Arrow keys in grid",
  },
  {
    description: "Create from the active schedule slot.",
    keys: "Enter / Space",
  },
  {
    description: "Move the selected event in time or across days.",
    keys: "Arrow keys on event",
  },
  {
    description: "Resize the selected event from the end.",
    keys: "Shift + Arrow keys",
  },
  {
    description: "Resize the selected event from the start.",
    keys: "Alt + Arrow keys",
  },
  {
    description: "Open the event context menu.",
    keys: "Shift + F10",
  },
  {
    description: "Open this shortcut dialog when enabled.",
    keys: "?",
  },
]

export function CalendarKeyboardShortcutsDialog({
  config,
  onOpenChange,
  open,
}: CalendarKeyboardShortcutsDialogProps) {
  const dialogRef = React.useRef<HTMLDivElement | null>(null)
  const titleId = React.useId()
  const descriptionId = React.useId()

  useModalFocus({
    containerRef: dialogRef,
    onClose: () => onOpenChange(false),
    open,
  })

  if (!open) {
    return null
  }

  const title =
    typeof config === "object"
      ? config.title ?? "Keyboard shortcuts"
      : "Keyboard shortcuts"
  const description =
    typeof config === "object"
      ? config.description ??
        "Use the keyboard to nudge, resize, and inspect events without leaving the current view."
      : "Use the keyboard to nudge, resize, and inspect events without leaving the current view."

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">
      <button
        aria-label="Close keyboard shortcuts"
        className="absolute inset-0"
        onClick={() => onOpenChange(false)}
        type="button"
      />
      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative z-10 w-[min(100%-2rem,32rem)] rounded-[calc(var(--radius)*1.2)] border border-border/80 bg-background p-5 shadow-[0_32px_90px_-40px_rgba(15,23,42,0.65)] outline-none"
        data-testid="calendar-keyboard-shortcuts-dialog"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-start gap-3">
          <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-[calc(var(--radius)*0.85)] bg-primary/10 text-primary">
            <KeyboardIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold tracking-tight" id={titleId}>
              {title}
            </h2>
            <p
              className="mt-1 text-sm leading-6 text-muted-foreground"
              id={descriptionId}
            >
              {description}
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-2">
          {shortcutRows.map((row) => (
            <div
              key={row.keys}
              className="grid gap-2 rounded-[calc(var(--radius)*0.95)] border border-border/70 bg-muted/25 px-3 py-3 sm:grid-cols-[10rem_1fr] sm:items-center"
            >
              <p className="font-mono text-sm font-medium text-foreground">
                {row.keys}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                {row.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
