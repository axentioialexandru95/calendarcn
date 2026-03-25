import * as React from "react"

import {
  CalendarBlankIcon,
  ClockIcon,
  MapPinIcon,
  NotePencilIcon,
  PencilSimpleIcon,
  StackIcon,
} from "@phosphor-icons/react"
import { addDays, format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import type {
  CalendarEvent,
  CalendarEventDetailsConfig,
  CalendarEventDetailsRenderProps,
  CalendarOccurrence,
  CalendarResource,
} from "../../types"
import {
  canUpdateOccurrence,
  formatDurationLabel,
  formatEventTimeLabel,
  getEventResourceId,
} from "../../utils"
import { useModalFocus } from "./use-modal-focus"

type CalendarEventDetailsSheetProps = {
  config?: CalendarEventDetailsConfig
  hourCycle?: 12 | 24
  locale?: string
  occurrence: CalendarOccurrence | null
  onOpenChange: (open: boolean) => void
  onSubmit?: (nextEvent: CalendarEvent) => string | void
  renderContent?: (props: CalendarEventDetailsRenderProps) => React.ReactNode
  resources?: CalendarResource[]
  secondaryTimeZone?: string
  timeZone?: string
}

type DetailsFormState = {
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

export function CalendarEventDetailsSheet({
  config,
  hourCycle,
  locale,
  occurrence,
  onOpenChange,
  onSubmit,
  renderContent,
  resources,
  secondaryTimeZone,
  timeZone,
}: CalendarEventDetailsSheetProps) {
  const [formState, setFormState] = React.useState<DetailsFormState | null>(null)
  const [error, setError] = React.useState<string>()
  const [isEditing, setIsEditing] = React.useState(false)
  const sheetRef = React.useRef<HTMLDivElement | null>(null)
  const titleId = React.useId()
  const descriptionId = React.useId()

  React.useEffect(() => {
    if (!occurrence) {
      setFormState(null)
      setError(undefined)
      setIsEditing(false)
      return
    }

    const effectiveEndDate = occurrence.allDay
      ? addDays(occurrence.end, -1)
      : occurrence.end

    setFormState({
      allDay: occurrence.allDay ?? false,
      description: occurrence.description ?? "",
      endDate: format(effectiveEndDate, "yyyy-MM-dd"),
      endTime: format(occurrence.end, "HH:mm"),
      location: occurrence.location ?? "",
      resourceId: getEventResourceId(occurrence) ?? resources?.[0]?.id ?? "",
      startDate: format(occurrence.start, "yyyy-MM-dd"),
      startTime: format(occurrence.start, "HH:mm"),
      title: occurrence.title,
    })
    setError(undefined)
    setIsEditing(false)
  }, [occurrence, resources])

  useModalFocus({
    containerRef: sheetRef,
    onClose: () => onOpenChange(false),
    open: Boolean(occurrence),
  })

  if (!occurrence || !formState) {
    return null
  }

  const canEdit = Boolean(onSubmit) && canUpdateOccurrence(occurrence)
  const primaryTimeZone = timeZone ?? occurrence.timeZone
  const resource = resources?.find(
    (item) => item.id === (getEventResourceId(occurrence) ?? "")
  )
  const detailsTitle =
    typeof config === "object" ? config.title ?? "Event details" : "Event details"
  const detailsDescription =
    typeof config === "object"
      ? config.description ??
        "Inspect the current appointment or switch into edit mode to update the source event."
      : "Inspect the current appointment or switch into edit mode to update the source event."
  const editLabel =
    typeof config === "object" ? config.editLabel ?? "Edit event" : "Edit event"
  const submitLabel =
    typeof config === "object" ? config.submitLabel ?? "Save changes" : "Save changes"
  const cancelLabel =
    typeof config === "object" ? config.cancelLabel ?? "Cancel" : "Cancel"
  const closeLabel =
    typeof config === "object" ? config.closeLabel ?? "Close" : "Close"

  function updateFormState<Key extends keyof DetailsFormState>(
    key: Key,
    value: DetailsFormState[Key]
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

  function submitUpdate(nextEvent: CalendarEvent) {
    if (!onSubmit) {
      return
    }

    return onSubmit(nextEvent)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!onSubmit || !occurrence || !formState) {
      return
    }

    const currentOccurrence = occurrence
    const currentFormState = formState
    const trimmedTitle = currentFormState.title.trim()

    if (!trimmedTitle) {
      setError("Title is required.")
      return
    }

    const start = buildDateTime(
      currentFormState.startDate,
      currentFormState.startTime
    )
    const end = currentFormState.allDay
      ? addDays(buildDateTime(currentFormState.endDate, "00:00"), 1)
      : buildDateTime(currentFormState.endDate, currentFormState.endTime)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError("Pick a valid start and end.")
      return
    }

    if (end.getTime() <= start.getTime()) {
      setError("End must be after the start.")
      return
    }

    const selectedResource = resources?.find(
      (item) => item.id === currentFormState.resourceId
    )
    const submissionError = submitUpdate({
      ...currentOccurrence,
      id: currentOccurrence.sourceEventId,
      allDay: currentFormState.allDay,
      calendarId: selectedResource?.id ?? currentOccurrence.calendarId,
      calendarLabel: selectedResource?.label ?? currentOccurrence.calendarLabel,
      color: selectedResource?.color ?? currentOccurrence.color,
      description: normalizeOptionalText(currentFormState.description),
      end,
      location: normalizeOptionalText(currentFormState.location),
      resourceId:
        selectedResource?.id ??
        normalizeOptionalText(currentFormState.resourceId) ??
        currentOccurrence.resourceId,
      start,
      title: trimmedTitle,
    })

    if (submissionError) {
      setError(submissionError)
      return
    }

    setError(undefined)
    setIsEditing(false)
  }

  const customContent = renderContent?.({
    canEdit,
    close: () => onOpenChange(false),
    isEditing,
    occurrence,
    resource,
    resources: resources ?? [],
    startEditing: () => setIsEditing(true),
    submitUpdate,
  })

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/35 backdrop-blur-[2px]"
      data-testid="calendar-event-details-sheet"
    >
      <button
        aria-label="Close event details"
        className="absolute inset-0"
        onClick={() => onOpenChange(false)}
        type="button"
      />
      <aside
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-border/80 bg-background shadow-[-24px_0_80px_-40px_rgba(15,23,42,0.65)] outline-none animate-in slide-in-from-right"
        ref={sheetRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="border-b border-border/70 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-[calc(var(--radius)*0.9)] bg-primary/10 text-primary">
              <CalendarBlankIcon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold tracking-tight" id={titleId}>
                {detailsTitle}
              </h2>
              <p
                className="mt-1 text-sm leading-6 text-muted-foreground"
                id={descriptionId}
              >
                {detailsDescription}
              </p>
            </div>
          </div>
        </div>

        {customContent ? (
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {customContent}
          </div>
        ) : (
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
              <div className="space-y-2">
                <p className="text-xl font-semibold tracking-tight">
                  {occurrence.title}
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <InfoPill icon={ClockIcon}>
                    {formatEventTimeLabel(occurrence.start, occurrence.end, {
                      allDay: occurrence.allDay,
                      hourCycle,
                      locale,
                      timeZone: primaryTimeZone,
                    })}
                  </InfoPill>
                  <InfoPill icon={StackIcon}>
                    {formatDurationLabel(
                      occurrence.start,
                      occurrence.end,
                      occurrence.allDay
                    )}
                  </InfoPill>
                  {primaryTimeZone ? (
                    <InfoPill icon={ClockIcon}>{primaryTimeZone}</InfoPill>
                  ) : null}
                  {secondaryTimeZone ? (
                    <InfoPill icon={ClockIcon}>
                      {formatEventTimeLabel(occurrence.start, occurrence.end, {
                        allDay: occurrence.allDay,
                        hourCycle,
                        locale,
                        timeZone: secondaryTimeZone,
                      })}
                    </InfoPill>
                  ) : null}
                  {resource ? <InfoPill>{resource.label}</InfoPill> : null}
                  {occurrence.isRecurringInstance ? (
                    <InfoPill>Recurring series</InfoPill>
                  ) : null}
                </div>
              </div>

              {isEditing ? (
                <section className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="calendar-details-title">Title</Label>
                    <Input
                      autoFocus
                      id="calendar-details-title"
                      onChange={(event) =>
                        updateFormState("title", event.target.value)
                      }
                      value={formState.title}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="calendar-details-start-date">Start date</Label>
                      <Input
                        id="calendar-details-start-date"
                        onChange={(event) =>
                          updateFormState("startDate", event.target.value)
                        }
                        type="date"
                        value={formState.startDate}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="calendar-details-end-date">End date</Label>
                      <Input
                        id="calendar-details-end-date"
                        onChange={(event) =>
                          updateFormState("endDate", event.target.value)
                        }
                        type="date"
                        value={formState.endDate}
                      />
                    </div>
                  </div>
                  {!formState.allDay ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="calendar-details-start-time">
                          Start time
                        </Label>
                        <Input
                          id="calendar-details-start-time"
                          onChange={(event) =>
                            updateFormState("startTime", event.target.value)
                          }
                          type="time"
                          value={formState.startTime}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="calendar-details-end-time">End time</Label>
                        <Input
                          id="calendar-details-end-time"
                          onChange={(event) =>
                            updateFormState("endTime", event.target.value)
                          }
                          type="time"
                          value={formState.endTime}
                        />
                      </div>
                    </div>
                  ) : null}
                  <label className="flex items-center gap-3 rounded-[calc(var(--radius)*0.95)] border border-border/70 bg-muted/25 px-3 py-2.5">
                    <input
                      checked={formState.allDay}
                      className="size-4 accent-primary"
                      onChange={(event) =>
                        updateFormState("allDay", event.target.checked)
                      }
                      type="checkbox"
                    />
                    <span>
                      <span className="block text-sm font-medium">All-day event</span>
                      <span className="block text-xs text-muted-foreground">
                        Hide time inputs and keep the event pinned to full days.
                      </span>
                    </span>
                  </label>
                  <div className="space-y-2">
                    <Label htmlFor="calendar-details-resource">Calendar</Label>
                    <select
                      className={selectClassName}
                      id="calendar-details-resource"
                      onChange={(event) =>
                        updateFormState("resourceId", event.target.value)
                      }
                      value={formState.resourceId}
                    >
                      {resources?.length ? (
                        resources.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))
                      ) : (
                        <option value="">Default calendar</option>
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="calendar-details-location">Location</Label>
                    <Input
                      id="calendar-details-location"
                      onChange={(event) =>
                        updateFormState("location", event.target.value)
                      }
                      placeholder="Remote"
                      value={formState.location}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="calendar-details-description">
                      Description
                    </Label>
                    <Textarea
                      id="calendar-details-description"
                      onChange={(event) =>
                        updateFormState("description", event.target.value)
                      }
                      placeholder="Agenda, notes, or attendee details."
                      value={formState.description}
                    />
                  </div>
                </section>
              ) : (
                <section className="space-y-4">
                  {occurrence.location ? (
                    <SummaryBlock icon={MapPinIcon} label="Location">
                      {occurrence.location}
                    </SummaryBlock>
                  ) : null}
                  {occurrence.description ? (
                    <SummaryBlock icon={NotePencilIcon} label="Notes">
                      {occurrence.description}
                    </SummaryBlock>
                  ) : null}
                  <SummaryBlock icon={ClockIcon} label="Schedule">
                    {formatEventTimeLabel(occurrence.start, occurrence.end, {
                      allDay: occurrence.allDay,
                      hourCycle,
                      locale,
                      timeZone: primaryTimeZone,
                    })}
                  </SummaryBlock>
                  {secondaryTimeZone ? (
                    <SummaryBlock icon={ClockIcon} label="Secondary timezone">
                      {formatEventTimeLabel(occurrence.start, occurrence.end, {
                        allDay: occurrence.allDay,
                        hourCycle,
                        locale,
                        timeZone: secondaryTimeZone,
                      })}
                    </SummaryBlock>
                  ) : null}
                  {resource ? (
                    <SummaryBlock icon={StackIcon} label="Calendar">
                      {resource.label}
                    </SummaryBlock>
                  ) : null}
                  {occurrence.isRecurringInstance ? (
                    <p className="rounded-[calc(var(--radius)*0.9)] border border-border/70 bg-muted/25 px-3 py-2 text-sm text-muted-foreground">
                      This occurrence belongs to a recurring series. Built-in
                      editing updates the source series event.
                    </p>
                  ) : null}
                  {!occurrence.location && !occurrence.description ? (
                    <p className="rounded-[calc(var(--radius)*0.9)] border border-dashed border-border/70 px-3 py-4 text-sm text-muted-foreground">
                      No description or location has been added yet.
                    </p>
                  ) : null}
                </section>
              )}

              {error ? (
                <p className="rounded-[calc(var(--radius)*0.9)] border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="sticky bottom-0 border-t border-border/70 bg-background px-6 py-4">
              <div className="flex flex-wrap justify-end gap-2">
                {isEditing ? (
                  <>
                    <Button
                      onClick={() => {
                        setError(undefined)
                        setIsEditing(false)
                      }}
                      type="button"
                      variant="outline"
                    >
                      {cancelLabel}
                    </Button>
                    <Button
                      data-testid="calendar-event-details-submit"
                      type="submit"
                    >
                      {submitLabel}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => onOpenChange(false)}
                      type="button"
                      variant="outline"
                    >
                      {closeLabel}
                    </Button>
                    {canEdit ? (
                      <Button
                        data-testid="calendar-event-details-edit"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          setError(undefined)
                          setIsEditing(true)
                        }}
                        type="button"
                      >
                        <PencilSimpleIcon className="size-4" />
                        {editLabel}
                      </Button>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </form>
        )}
      </aside>
    </div>
  )
}

function SummaryBlock({
  children,
  icon: Icon,
  label,
}: {
  children: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <div className="rounded-[calc(var(--radius)*0.95)] border border-border/70 bg-muted/25 px-3 py-3">
      <p className="inline-flex items-center gap-2 text-xs tracking-[0.18em] text-muted-foreground uppercase">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-foreground whitespace-pre-wrap">
        {children}
      </p>
    </div>
  )
}

function InfoPill({
  children,
  icon: Icon,
}: {
  children: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/35 px-2.5 py-1">
      {Icon ? <Icon className="size-3.5" /> : null}
      {children}
    </span>
  )
}

function buildDateTime(dateValue: string, timeValue: string) {
  const normalizedTime = timeValue || "00:00"

  return new Date(`${dateValue}T${normalizedTime}:00`)
}

function normalizeOptionalText(value: string) {
  const trimmedValue = value.trim()

  return trimmedValue.length > 0 ? trimmedValue : undefined
}

const selectClassName = cn(
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none",
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
)
