"use client"

import * as React from "react"

import { CalendarBlankIcon, ClockIcon, NotePencilIcon } from "@phosphor-icons/react"
import { addDays, format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import type {
  CalendarCreateOperation,
  CalendarCreateSheetConfig,
  CalendarResource,
} from "../../types"

type CalendarEventCreateSheetProps = {
  config?: CalendarCreateSheetConfig
  initialOperation: CalendarCreateOperation | null
  onOpenChange: (open: boolean) => void
  onSubmit: (operation: CalendarCreateOperation) => string | void
  resources?: CalendarResource[]
  timeZone?: string
}

type CreateFormState = {
  allDay: boolean
  description: string
  endDate: string
  endTime: string
  location: string
  resourceId: string
  startDate: string
  startTime: string
  title: string
}

export function CalendarEventCreateSheet({
  config,
  initialOperation,
  onOpenChange,
  onSubmit,
  resources,
  timeZone,
}: CalendarEventCreateSheetProps) {
  const [formState, setFormState] = React.useState<CreateFormState | null>(null)
  const [error, setError] = React.useState<string>()

  React.useEffect(() => {
    if (!initialOperation) {
      setFormState(null)
      setError(undefined)
      return
    }

    const derivedAllDay = initialOperation.allDay ?? false
    const effectiveEndDate = derivedAllDay
      ? addDays(initialOperation.end, -1)
      : initialOperation.end

    setFormState({
      allDay: derivedAllDay,
      description: initialOperation.description ?? "",
      endDate: format(effectiveEndDate, "yyyy-MM-dd"),
      endTime: format(initialOperation.end, "HH:mm"),
      location: initialOperation.location ?? "",
      resourceId:
        initialOperation.resourceId ?? resources?.[0]?.id ?? "",
      startDate: format(initialOperation.start, "yyyy-MM-dd"),
      startTime: format(initialOperation.start, "HH:mm"),
      title: initialOperation.title ?? "",
    })
    setError(undefined)
  }, [initialOperation, resources])

  React.useEffect(() => {
    if (!initialOperation) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [initialOperation, onOpenChange])

  if (!initialOperation || !formState) {
    return null
  }

  const resolvedTitle =
    typeof config === "object"
      ? config.title ?? "Create appointment"
      : "Create appointment"
  const resolvedDescription =
    typeof config === "object"
      ? config.description ??
        "Add details before the appointment is inserted into the calendar."
      : "Add details before the appointment is inserted into the calendar."
  const resolvedSubmitLabel =
    typeof config === "object" ? config.submitLabel ?? "Save appointment" : "Save appointment"
  const resolvedCancelLabel =
    typeof config === "object" ? config.cancelLabel ?? "Cancel" : "Cancel"

  function updateFormState<Key extends keyof CreateFormState>(
    key: Key,
    value: CreateFormState[Key]
  ) {
    setFormState((currentState) =>
      currentState
        ? {
            ...currentState,
            [key]: value,
          }
        : currentState
    )
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!formState || !initialOperation) {
      return
    }

    const baseOperation = initialOperation

    const trimmedTitle = formState.title.trim()

    if (!trimmedTitle) {
      setError("Title is required.")
      return
    }

    const start = buildDateTime(formState.startDate, formState.startTime)
    const end = formState.allDay
      ? addDays(buildDateTime(formState.endDate, "00:00"), 1)
      : buildDateTime(formState.endDate, formState.endTime)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError("Pick a valid start and end.")
      return
    }

    if (end.getTime() <= start.getTime()) {
      setError("End must be after the start.")
      return
    }

    const selectedResource = resources?.find(
      (resource) => resource.id === formState.resourceId
    )

    const submissionError = onSubmit({
      allDay: formState.allDay,
      calendarId:
        selectedResource?.id ?? baseOperation.calendarId,
      calendarLabel:
        selectedResource?.label ?? baseOperation.calendarLabel,
      color: selectedResource?.color ?? baseOperation.color,
      description: normalizeOptionalText(formState.description),
      end,
      location: normalizeOptionalText(formState.location),
      resourceId:
        selectedResource?.id ??
        normalizeOptionalText(formState.resourceId) ??
        baseOperation.resourceId,
      start,
      timeZone: timeZone ?? baseOperation.timeZone,
      title: trimmedTitle,
    })

    if (submissionError) {
      setError(submissionError)
      return
    }

    onOpenChange(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-[2px]"
      data-testid="calendar-create-sheet"
    >
      <button
        aria-label="Close create appointment sheet"
        className="absolute inset-0"
        onClick={() => onOpenChange(false)}
        type="button"
      />
      <aside className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-border/80 bg-background shadow-[-24px_0_80px_-40px_rgba(15,23,42,0.65)] animate-in slide-in-from-right">
        <div className="border-b border-border/70 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-[calc(var(--radius)*0.9)] bg-primary/10 text-primary">
              <CalendarBlankIcon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold tracking-tight">
                {resolvedTitle}
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {resolvedDescription}
              </p>
            </div>
          </div>
        </div>
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
            <section className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="calendar-create-title">Title</Label>
                <Input
                  autoFocus
                  id="calendar-create-title"
                  onChange={(event) => updateFormState("title", event.target.value)}
                  placeholder="Weekly product sync"
                  value={formState.title}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calendar-create-resource">Calendar</Label>
                <select
                  className={selectClassName}
                  id="calendar-create-resource"
                  onChange={(event) =>
                    updateFormState("resourceId", event.target.value)
                  }
                  value={formState.resourceId}
                >
                  {resources?.length ? (
                    resources.map((resource) => (
                      <option key={resource.id} value={resource.id}>
                        {resource.label}
                      </option>
                    ))
                  ) : (
                    <option value="">Default calendar</option>
                  )}
                </select>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between rounded-[calc(var(--radius)*0.95)] border border-border/70 bg-muted/25 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">All-day appointment</p>
                  <p className="text-xs text-muted-foreground">
                    Turn off the time fields and span whole days.
                  </p>
                </div>
                <input
                  checked={formState.allDay}
                  className="size-4 rounded border-input bg-background text-primary focus-visible:ring-2 focus-visible:ring-ring/60"
                  onChange={(event) =>
                    updateFormState("allDay", event.target.checked)
                  }
                  type="checkbox"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="calendar-create-start-date">Start date</Label>
                  <Input
                    id="calendar-create-start-date"
                    onChange={(event) =>
                      updateFormState("startDate", event.target.value)
                    }
                    type="date"
                    value={formState.startDate}
                  />
                </div>
                {!formState.allDay ? (
                  <div className="space-y-2">
                    <Label htmlFor="calendar-create-start-time">Start time</Label>
                    <Input
                      id="calendar-create-start-time"
                      onChange={(event) =>
                        updateFormState("startTime", event.target.value)
                      }
                      type="time"
                      value={formState.startTime}
                    />
                  </div>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="calendar-create-end-date">
                    {formState.allDay ? "End date" : "End date"}
                  </Label>
                  <Input
                    id="calendar-create-end-date"
                    onChange={(event) =>
                      updateFormState("endDate", event.target.value)
                    }
                    type="date"
                    value={formState.endDate}
                  />
                </div>
                {!formState.allDay ? (
                  <div className="space-y-2">
                    <Label htmlFor="calendar-create-end-time">End time</Label>
                    <Input
                      id="calendar-create-end-time"
                      onChange={(event) =>
                        updateFormState("endTime", event.target.value)
                      }
                      type="time"
                      value={formState.endTime}
                    />
                  </div>
                ) : null}
              </div>
              <div className="rounded-[calc(var(--radius)*0.95)] border border-border/70 bg-muted/25 px-3 py-2.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <ClockIcon className="size-3.5" />
                  {timeZone ? `${timeZone} timezone` : "Local timezone"}
                </span>
              </div>
            </section>

            <section className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="calendar-create-location">Location</Label>
                <Input
                  id="calendar-create-location"
                  onChange={(event) =>
                    updateFormState("location", event.target.value)
                  }
                  placeholder="Conference room A"
                  value={formState.location}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calendar-create-description">Description</Label>
                <div className="relative">
                  <NotePencilIcon className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" />
                  <Textarea
                    className="pl-9"
                    id="calendar-create-description"
                    onChange={(event) =>
                      updateFormState("description", event.target.value)
                    }
                    placeholder="Agenda, notes, attendees, or follow-up context."
                    rows={5}
                    value={formState.description}
                  />
                </div>
              </div>
            </section>
          </div>
          <div className="border-t border-border/70 px-6 py-4">
            {error ? (
              <p className="mb-3 text-sm text-destructive">{error}</p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => onOpenChange(false)}
                type="button"
                variant="outline"
              >
                {resolvedCancelLabel}
              </Button>
              <Button type="submit">{resolvedSubmitLabel}</Button>
            </div>
          </div>
        </form>
      </aside>
    </div>
  )
}

const selectClassName = cn(
  "flex h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-[border-color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
)

function buildDateTime(dateValue: string, timeValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number)
  const [hours, minutes] = timeValue.split(":").map(Number)

  return new Date(year, month - 1, day, hours, minutes, 0, 0)
}

function normalizeOptionalText(value: string) {
  const trimmedValue = value.trim()

  return trimmedValue.length > 0 ? trimmedValue : undefined
}
