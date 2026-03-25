"use client"

import * as React from "react"

import { ArrowsOutCardinalIcon, ClockClockwiseIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"

import type {
  CalendarEventChangeConfirmation,
  CalendarEventChangeConfirmationContext,
} from "../../types"

type CalendarEventChangeConfirmationDialogProps = {
  config?: CalendarEventChangeConfirmation
  context: CalendarEventChangeConfirmationContext | null
  hourCycle?: 12 | 24
  locale?: string
  onCancel: () => void
  onConfirm: () => void
  timeZone?: string
}

export function CalendarEventChangeConfirmationDialog({
  config,
  context,
  hourCycle,
  locale,
  onCancel,
  onConfirm,
  timeZone,
}: CalendarEventChangeConfirmationDialogProps) {
  React.useEffect(() => {
    if (!context) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [context, onCancel])

  if (!context) {
    return null
  }

  const resolvedTitle = resolveConfiguredText(
    config,
    "title",
    context,
    getDefaultTitle(context)
  )
  const resolvedDescription = resolveConfiguredText(
    config,
    "description",
    context,
    getDefaultDescription(context, {
      hourCycle,
      locale,
      timeZone,
    })
  )
  const resolvedConfirmLabel = resolveConfiguredText(
    config,
    "confirmLabel",
    context,
    context.action === "move" ? "Apply change" : "Apply resize"
  )
  const resolvedCancelLabel =
    typeof config === "object" ? config.cancelLabel ?? "Cancel" : "Cancel"
  const Icon =
    context.action === "move" ? ArrowsOutCardinalIcon : ClockClockwiseIcon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6 backdrop-blur-sm">
      <button
        aria-label="Close confirmation dialog"
        className="absolute inset-0"
        onClick={onCancel}
        type="button"
      />
      <div
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-[calc(var(--radius)*1.2)] border border-border/80 bg-background p-5 shadow-[0_32px_90px_-40px_rgba(15,23,42,0.65)]"
        role="dialog"
      >
        <div className="flex items-start gap-3">
          <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-[calc(var(--radius)*0.85)] bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold tracking-tight">
              {resolvedTitle}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {resolvedDescription}
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-[calc(var(--radius)*0.95)] border border-border/70 bg-muted/30 px-3 py-3 text-sm">
          <p className="font-medium text-foreground">{context.occurrence.title}</p>
          <div className="mt-2 grid gap-2 text-muted-foreground sm:grid-cols-2">
            <div>
              <p className="text-[11px] tracking-[0.2em] uppercase">From</p>
              <p className="mt-1 text-sm text-foreground">
                {formatEventRange(
                  context.previousStart,
                  context.previousEnd,
                  {
                    hourCycle,
                    locale,
                    timeZone,
                  },
                  context.occurrence.allDay
                )}
              </p>
            </div>
            <div>
              <p className="text-[11px] tracking-[0.2em] uppercase">To</p>
              <p className="mt-1 text-sm text-foreground">
                {formatEventRange(
                  context.nextStart,
                  context.nextEnd,
                  {
                    hourCycle,
                    locale,
                    timeZone,
                  },
                  context.action === "move"
                    ? context.allDay ?? context.occurrence.allDay
                    : context.occurrence.allDay
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={onCancel} variant="outline">
            {resolvedCancelLabel}
          </Button>
          <Button autoFocus onClick={onConfirm}>
            {resolvedConfirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

function getDefaultTitle(context: CalendarEventChangeConfirmationContext) {
  return context.action === "move"
    ? "Confirm appointment change"
    : "Confirm appointment resize"
}

function getDefaultDescription(
  context: CalendarEventChangeConfirmationContext,
  options: {
    hourCycle?: 12 | 24
    locale?: string
    timeZone?: string
  } = {}
) {
  const actionLabel =
    context.action === "move"
      ? "apply the new time and date"
      : "apply the new duration"

  return `Review the updated schedule for "${context.occurrence.title}" before you ${actionLabel}. ${formatEventRange(context.nextStart, context.nextEnd, options, context.action === "move" ? context.allDay ?? context.occurrence.allDay : context.occurrence.allDay)}`
}

function formatEventRange(
  start: Date,
  end: Date,
  options: {
    hourCycle?: 12 | 24
    locale?: string
    timeZone?: string
  },
  allDay: boolean | undefined
) {
  if (allDay) {
    const inclusiveEnd = new Date(end.getTime() - 60_000)
    const dateFormatter = new Intl.DateTimeFormat(options.locale, {
      day: "numeric",
      month: "short",
      ...(options.timeZone ? { timeZone: options.timeZone } : {}),
      weekday: "short",
    })

    return `${dateFormatter.format(start)} - ${dateFormatter.format(inclusiveEnd)}`
  }

  const formatter = new Intl.DateTimeFormat(options.locale, {
    day: "numeric",
    hour: options.hourCycle === 24 ? "2-digit" : "numeric",
    minute: "2-digit",
    month: "short",
    ...(options.timeZone ? { timeZone: options.timeZone } : {}),
    ...(options.hourCycle ? { hour12: options.hourCycle === 12 } : {}),
    weekday: "short",
  })
  const timeFormatter = new Intl.DateTimeFormat(options.locale, {
    hour: options.hourCycle === 24 ? "2-digit" : "numeric",
    minute: "2-digit",
    ...(options.timeZone ? { timeZone: options.timeZone } : {}),
    ...(options.hourCycle ? { hour12: options.hourCycle === 12 } : {}),
  })

  return `${formatter.format(start)} - ${timeFormatter.format(end)}`
}

function resolveConfiguredText(
  config: CalendarEventChangeConfirmation | undefined,
  key: "confirmLabel" | "description" | "title",
  context: CalendarEventChangeConfirmationContext,
  fallback: string
) {
  if (typeof config !== "object" || !config[key]) {
    return fallback
  }

  const value = config[key]

  return typeof value === "function" ? value(context) : value
}
