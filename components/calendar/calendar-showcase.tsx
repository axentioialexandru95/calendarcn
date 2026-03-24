"use client"

import * as React from "react"
import {
  ArrowsOutCardinalIcon,
  CalendarDotsIcon,
  CursorClickIcon,
  SwatchesIcon,
} from "@phosphor-icons/react"

import { CalendarRoot } from "@/components/calendar"
import { Button } from "@/components/ui/button"
import { useCalendarController } from "@/hooks/use-calendar-controller"
import { buildDemoEvents, buildDemoResources } from "@/lib/calendar-demo-data"

export function CalendarShowcase({
  initialDateIso,
}: {
  initialDateIso: string
}) {
  const [initialDate] = React.useState(() => new Date(initialDateIso))
  const resources = React.useState(() => buildDemoResources())[0]
  const controller = useCalendarController({
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

  return (
    <main className="min-h-svh bg-background px-3 py-3 text-foreground md:px-4 md:py-4">
      <div className="grid min-h-[calc(100svh-1.5rem)] gap-3 lg:grid-cols-[18rem_1fr]">
        <aside className="flex flex-col justify-between rounded-[calc(var(--radius)*1.6)] border border-border/70 bg-muted/25 p-5">
          <div className="space-y-8">
            <div className="space-y-3">
              <p className="text-[11px] tracking-[0.32em] text-muted-foreground uppercase">
                CalendarCN
              </p>
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
                body="The page is a demo shell. The calendar itself lives in reusable exported components."
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
              onClick={() => controller.setView("month")}
              size="sm"
              variant="ghost"
            >
              Open month view
            </Button>
          </div>
        </aside>
        <CalendarRoot
          date={controller.date}
          events={controller.events}
          onDateChange={controller.setDate}
          onEventCreate={controller.handleEventCreate}
          onEventMove={controller.handleEventMove}
          onEventResize={controller.handleEventResize}
          onNavigate={controller.step}
          onSelectedEventChange={controller.setSelectedEventId}
          onToday={controller.goToToday}
          onViewChange={controller.setView}
          resources={resources}
          selectedEventId={controller.selectedEventId}
          timeZone="Europe/Bucharest"
          view={controller.view}
        />
      </div>
    </main>
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
