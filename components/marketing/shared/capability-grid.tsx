"use client"

import {
  ArrowsOutCardinalIcon,
  CalendarDotsIcon,
  CursorClickIcon,
  SwatchesIcon,
} from "@phosphor-icons/react"

type CapabilityItem = {
  body: string
  icon: string
  title: string
}

const capabilityIcons = {
  calendar: CalendarDotsIcon,
  drag: ArrowsOutCardinalIcon,
  interaction: CursorClickIcon,
  theme: SwatchesIcon,
} as const

export function CalendarCnCapabilityGrid({
  items,
}: {
  items: CapabilityItem[]
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((capability) => {
        const Icon =
          capabilityIcons[capability.icon as keyof typeof capabilityIcons] ??
          CalendarDotsIcon

        return (
          <article
            key={capability.title}
            className="rounded-3xl border border-border/70 bg-background p-6 shadow-xs"
          >
            <div className="flex items-start gap-4">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-card">
                <Icon className="size-5" />
              </span>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold tracking-tight">
                  {capability.title}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {capability.body}
                </p>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
