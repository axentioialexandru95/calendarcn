"use client"

import * as React from "react"
import {
  ArrowsOutCardinalIcon,
  CalendarDotsIcon,
  CheckIcon,
  CursorClickIcon,
  SwatchesIcon,
} from "@phosphor-icons/react"

import { CalendarRoot } from "@/components/calendar"
import { CalendarCnLogo } from "@/components/marketing/branding/logo"
import { Button } from "@/components/ui/button"
import { useCalendarController } from "@/hooks/use-calendar-controller"
import { cn } from "@/lib/utils"
import {
  buildDemoBlockedRanges,
  buildDemoBusinessHours,
  buildDemoEvents,
  buildDemoResources,
  CALENDAR_DEMO_SEED_VERSION,
} from "@/lib/calendar-demo-data"
import type {
  CalendarDensity,
  CalendarEventChangeConfirmation,
  CalendarView,
} from "@/components/calendar"

type CalendarShowcaseVariant = "embed" | "standalone"

type DemoConfigState = {
  compact: boolean
  focusedViews: boolean
  hideWeekends: boolean
  showBlockedRanges: boolean
  showBusinessHours: boolean
  twentyFourHour: boolean
}

type DemoPresetId = "starter" | "workweek" | "operations"

const demoPresets: Record<
  DemoPresetId,
  {
    description: string
    label: string
    state: DemoConfigState
  }
> = {
  starter: {
    description: "All views, relaxed spacing, no scheduling constraints.",
    label: "Starter",
    state: {
      compact: false,
      focusedViews: false,
      hideWeekends: false,
      showBlockedRanges: false,
      showBusinessHours: false,
      twentyFourHour: false,
    },
  },
  workweek: {
    description: "A focused product team setup with work hours and blocked lunch.",
    label: "Workweek",
    state: {
      compact: true,
      focusedViews: true,
      hideWeekends: true,
      showBlockedRanges: true,
      showBusinessHours: true,
      twentyFourHour: true,
    },
  },
  operations: {
    description: "Seven-day scheduling with 24-hour time and release freezes.",
    label: "Operations",
    state: {
      compact: false,
      focusedViews: true,
      hideWeekends: false,
      showBlockedRanges: true,
      showBusinessHours: false,
      twentyFourHour: true,
    },
  },
}

const demoToggleDefinitions: Array<{
  description: string
  key: keyof DemoConfigState
  label: string
}> = [
  {
    description: "Tighten slot height, event padding, and toolbar spacing.",
    key: "compact",
    label: "Compact density",
  },
  {
    description: "Focus the planner on weekdays instead of a full seven-day span.",
    key: "hideWeekends",
    label: "Hide weekends",
  },
  {
    description: "Highlight the working window so real scheduling hours stand out.",
    key: "showBusinessHours",
    label: "Business hours",
  },
  {
    description: "Show unavailable time ranges and block edits that overlap them.",
    key: "showBlockedRanges",
    label: "Blocked ranges",
  },
  {
    description: "Switch the demo labels to a 24-hour scheduling format.",
    key: "twentyFourHour",
    label: "24h clock",
  },
  {
    description: "Limit the surface to week, day, and agenda instead of all views.",
    key: "focusedViews",
    label: "Work views only",
  },
]

export function CalendarShowcase({
  eventChangeConfirmation,
  initialDateIso,
  variant = "standalone",
}: {
  eventChangeConfirmation?: CalendarEventChangeConfirmation
  initialDateIso: string
  variant?: CalendarShowcaseVariant
}) {
  return (
    <CalendarShowcaseSurface
      eventChangeConfirmation={eventChangeConfirmation}
      key={`${initialDateIso}:${CALENDAR_DEMO_SEED_VERSION}`}
      initialDateIso={initialDateIso}
      variant={variant}
    />
  )
}

function CalendarShowcaseSurface({
  eventChangeConfirmation,
  initialDateIso,
  variant = "standalone",
}: {
  eventChangeConfirmation?: CalendarEventChangeConfirmation
  initialDateIso: string
  variant?: CalendarShowcaseVariant
}) {
  const [initialDate] = React.useState(() => new Date(initialDateIso))
  const [demoConfig, setDemoConfig] = React.useState<DemoConfigState>(
    demoPresets.workweek.state
  )
  const resources = React.useState(() => buildDemoResources())[0]
  const blockedRanges = React.useMemo(
    () => buildDemoBlockedRanges(initialDate),
    [initialDate]
  )
  const businessHours = React.useMemo(() => buildDemoBusinessHours(), [])
  const selectedPresetId = React.useMemo<DemoPresetId | null>(() => {
    const matchedEntry = Object.entries(demoPresets).find(([, preset]) =>
      isSameDemoConfigState(preset.state, demoConfig)
    )

    return (matchedEntry?.[0] as DemoPresetId | undefined) ?? null
  }, [demoConfig])
  const calendarConfig = React.useMemo<{
    availableViews: CalendarView[]
    blockedRanges: CalendarRootComponentProps["blockedRanges"]
    businessHours: CalendarRootComponentProps["businessHours"]
    density: CalendarDensity
    hiddenDays: NonNullable<CalendarRootComponentProps["hiddenDays"]>
    hourCycle: NonNullable<CalendarRootComponentProps["hourCycle"]>
    locale: NonNullable<CalendarRootComponentProps["locale"]>
    scrollToTime: NonNullable<CalendarRootComponentProps["scrollToTime"]>
  }>(() => {
    const availableViews = demoConfig.focusedViews
      ? (["week", "day", "agenda"] as CalendarView[])
      : (["month", "week", "day", "agenda"] as CalendarView[])

    return {
      availableViews,
      blockedRanges: demoConfig.showBlockedRanges ? blockedRanges : undefined,
      businessHours: demoConfig.showBusinessHours ? businessHours : undefined,
      density: demoConfig.compact ? "compact" : "comfortable",
      hiddenDays: demoConfig.hideWeekends ? ([0, 6] as const) : [],
      hourCycle: demoConfig.twentyFourHour ? (24 as const) : (12 as const),
      locale: demoConfig.twentyFourHour ? "en-GB" : "en-US",
      scrollToTime: demoConfig.showBusinessHours ? "08:30" : "09:00",
    }
  }, [blockedRanges, businessHours, demoConfig])
  const activeConfigTokens = React.useMemo(() => {
    const tokens = [
      `density="${calendarConfig.density}"`,
      `hourCycle={${calendarConfig.hourCycle}}`,
      `locale="${calendarConfig.locale}"`,
      `scrollToTime="${calendarConfig.scrollToTime}"`,
    ]

    if (calendarConfig.availableViews.length < 4) {
      tokens.push('availableViews={["week", "day", "agenda"]}')
    }

    if (calendarConfig.hiddenDays.length > 0) {
      tokens.push("hiddenDays={[0, 6]}")
    }

    if (calendarConfig.businessHours) {
      tokens.push("businessHours={demoBusinessHours}")
    }

    if (calendarConfig.blockedRanges) {
      tokens.push("blockedRanges={demoBlockedRanges}")
    }

    return tokens
  }, [calendarConfig])
  const controller = useCalendarController({
    availableViews: calendarConfig.availableViews,
    initialDate,
    initialEvents: buildDemoEvents(initialDate),
    initialView: "week",
    createDefaults: {
      calendarId: "product",
      calendarLabel: "Product",
      color: "#2563eb",
      resourceId: "product",
    },
  })

  const calendar = (
    <CalendarRoot
      createEventSheet={{
        description:
          "Capture the details before the appointment lands on the schedule.",
        submitLabel: "Create appointment",
        title: "New appointment",
      }}
      date={controller.date}
      eventChangeConfirmation={eventChangeConfirmation}
      eventDetails
      events={controller.events}
      onDateChange={controller.setDate}
      onEventArchive={controller.handleEventArchive}
      onEventCreate={controller.handleEventCreate}
      onEventDelete={controller.handleEventDelete}
      onEventDuplicate={controller.handleEventDuplicate}
      onEventMove={controller.handleEventMove}
      onEventResize={controller.handleEventResize}
      onEventUpdate={controller.handleEventUpdate}
      onNavigate={controller.step}
      onSelectedEventChange={controller.setSelectedEventId}
      onToday={controller.goToToday}
      onViewChange={controller.setView}
      availableViews={calendarConfig.availableViews}
      blockedRanges={calendarConfig.blockedRanges}
      businessHours={calendarConfig.businessHours}
      density={calendarConfig.density}
      hiddenDays={calendarConfig.hiddenDays}
      hourCycle={calendarConfig.hourCycle}
      keyboardShortcuts
      locale={calendarConfig.locale}
      renderToolbarExtras={({ activeResourceIds, resources }) => (
        <span className="rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs text-muted-foreground">
          {activeResourceIds.length === resources.length
            ? "All calendars active"
            : `${activeResourceIds.length} calendars active`}
        </span>
      )}
      resources={resources}
      scrollToTime={calendarConfig.scrollToTime}
      secondaryTimeZone="America/New_York"
      selectedEventId={controller.selectedEventId}
      showSecondaryTimeZone
      surfaceShadow="md"
      timeZone="Europe/Bucharest"
      view={controller.view}
    />
  )

  if (variant === "embed") {
    return (
      <div className="min-w-0 space-y-4">
        <CalendarShowcaseConfigPanel
          activeConfigTokens={activeConfigTokens}
          config={demoConfig}
          onPresetSelect={(presetId) => {
            setDemoConfig(demoPresets[presetId].state)
          }}
          onToggle={(key) => {
            setDemoConfig((currentConfig) => ({
              ...currentConfig,
              [key]: !currentConfig[key],
            }))
          }}
          selectedPresetId={selectedPresetId}
        />
        {calendar}
      </div>
    )
  }

  return (
    <main className="min-h-svh bg-background px-2 py-2 text-foreground sm:px-3 sm:py-3 md:px-4 md:py-4">
      <div className="grid gap-3 lg:min-h-[calc(100svh-1.5rem)] lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="order-2 flex min-w-0 flex-col justify-between rounded-[calc(var(--radius)*1.6)] border border-border/70 bg-muted/25 p-4 sm:p-5 lg:order-1">
          <div className="space-y-8">
            <div className="space-y-3">
              <CalendarCnLogo
                iconClassName="size-7.5 rounded-[0.9rem]"
                labelClassName="text-[0.92rem]"
              />
              <div className="space-y-2">
                <h1 className="font-heading text-3xl leading-none tracking-tight">
                  Reusable calendar primitives for shadcn surfaces.
                </h1>
                <p className="max-w-xs text-sm leading-6 text-muted-foreground">
                  Month, week, day, and agenda views share one event model, one
                  drag engine, keyboard nudges, and slot-based class overrides.
                </p>
              </div>
            </div>
            <div className="space-y-5 text-sm">
              <FeatureRow
                icon={CalendarDotsIcon}
                title="Library-first"
                body="The calendar is built from reusable exported components that can be dropped into your own product surfaces."
              />
              <FeatureRow
                icon={ArrowsOutCardinalIcon}
                title="DnD + resize"
                body="Drag events across views, resize in time-grid mode, and create blocks by dragging on empty time slots."
              />
              <FeatureRow
                icon={CursorClickIcon}
                title="Accessible controls"
                body="Focused events support arrow-key moves, Shift+Arrow to extend the end, and Alt+Arrow to adjust the start."
              />
              <FeatureRow
                icon={SwatchesIcon}
                title="Theme slots"
                body="Theming stays token-driven by default, with className slots for library consumers who need local overrides."
              />
            </div>
            <div className="space-y-3">
              <p className="text-[11px] tracking-[0.24em] text-muted-foreground uppercase">
                Active calendars
              </p>
              <div className="space-y-2">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex items-start gap-3 rounded-[calc(var(--radius)*1.1)] border border-border/70 bg-background/70 px-3 py-3"
                  >
                    <span
                      className="mt-1 size-2.5 rounded-full"
                      style={{ backgroundColor: resource.color }}
                    />
                    <div>
                      <p className="font-medium">{resource.label}</p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {resource.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={controller.goToToday} size="sm" variant="outline">
              Jump to today
            </Button>
            <Button
              onClick={() => controller.setView("agenda")}
              size="sm"
              variant="ghost"
            >
              Open agenda view
            </Button>
          </div>
        </aside>
        <div className="order-1 min-w-0 space-y-3 lg:order-2">
          <CalendarShowcaseConfigPanel
            activeConfigTokens={activeConfigTokens}
            compact
            config={demoConfig}
            onPresetSelect={(presetId) => {
              setDemoConfig(demoPresets[presetId].state)
            }}
            onToggle={(key) => {
              setDemoConfig((currentConfig) => ({
                ...currentConfig,
                [key]: !currentConfig[key],
              }))
            }}
            selectedPresetId={selectedPresetId}
          />
          {calendar}
        </div>
      </div>
    </main>
  )
}

function CalendarShowcaseConfigPanel({
  activeConfigTokens,
  compact = false,
  config,
  onPresetSelect,
  onToggle,
  selectedPresetId,
}: {
  activeConfigTokens: string[]
  compact?: boolean
  config: DemoConfigState
  onPresetSelect: (presetId: DemoPresetId) => void
  onToggle: (key: keyof DemoConfigState) => void
  selectedPresetId: DemoPresetId | null
}) {
  return (
    <section
      className={cn(
        "rounded-[calc(var(--radius)*1.45)] border border-border/70 bg-card/90 shadow-xs",
        compact ? "p-4" : "p-4 sm:p-5"
      )}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-[11px] tracking-[0.24em] text-muted-foreground uppercase">
            Demo configuration
          </p>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Switch presets or toggle the props live.
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            The demo is no longer pinned to one hardcoded setup. Choose a preset
            or flip individual options to see how the same `CalendarRoot`
            surface behaves under different configuration shapes.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(
            Object.entries(demoPresets) as Array<
              [
                DemoPresetId,
                {
                  description: string
                  label: string
                },
              ]
            >
          ).map(([presetId, preset]) => {
            const active = selectedPresetId === presetId

            return (
              <button
                key={presetId}
                aria-pressed={active}
                className={cn(
                  "rounded-[calc(var(--radius)*1.1)] border px-4 py-3 text-left transition-colors",
                  active
                    ? "border-primary/40 bg-primary/[0.07]"
                    : "border-border/70 bg-background hover:bg-muted/50"
                )}
                onClick={() => onPresetSelect(presetId)}
                type="button"
              >
                <p className="text-sm font-semibold text-foreground">
                  {preset.label}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {preset.description}
                </p>
              </button>
            )
          })}
        </div>

        <div className="space-y-3">
          <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
            Options
          </p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {demoToggleDefinitions.map((toggle) => (
            <button
              key={toggle.key}
              aria-checked={config[toggle.key]}
              className={cn(
                "group flex items-start gap-3 rounded-[calc(var(--radius)*1.05)] border px-3 py-3 text-left transition-colors",
                config[toggle.key]
                  ? "border-primary/40 bg-primary/[0.07]"
                  : "border-border/70 bg-background hover:bg-muted/40"
              )}
              onClick={() => onToggle(toggle.key)}
              role="checkbox"
              type="button"
            >
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                  config[toggle.key]
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-transparent group-hover:border-foreground/20"
                )}
              >
                <CheckIcon className="size-3.5" weight="bold" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">
                  {toggle.label}
                </span>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                  {toggle.description}
                </span>
              </span>
            </button>
          ))}
          </div>
        </div>

        <div className="rounded-[calc(var(--radius)*1.05)] border border-border/70 bg-background/80 px-4 py-3">
          <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
            Active props
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {activeConfigTokens.map((token) => (
              <span
                key={token}
                className="max-w-full break-all rounded-full border border-border/70 bg-muted/35 px-2.5 py-1 font-mono text-[11px] leading-5 whitespace-normal text-foreground"
              >
                {token}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function FeatureRow({
  body,
  icon: Icon,
  title,
}: {
  body: string
  icon: React.ComponentType<{ className?: string }>
  title: string
}) {
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/70">
        <Icon className="size-4" />
      </span>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm leading-6 text-muted-foreground">{body}</p>
      </div>
    </div>
  )
}

function isSameDemoConfigState(
  left: DemoConfigState,
  right: DemoConfigState
) {
  return (
    left.compact === right.compact &&
    left.focusedViews === right.focusedViews &&
    left.hideWeekends === right.hideWeekends &&
    left.showBlockedRanges === right.showBlockedRanges &&
    left.showBusinessHours === right.showBusinessHours &&
    left.twentyFourHour === right.twentyFourHour
  )
}
type CalendarRootComponentProps = React.ComponentProps<typeof CalendarRoot>
