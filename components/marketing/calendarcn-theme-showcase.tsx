"use client"

import * as React from "react"
import { MoonIcon, PaletteIcon, SparkleIcon, SunIcon } from "@phosphor-icons/react"
import { useTheme } from "next-themes"

import {
  DEFAULT_CALENDARCN_THEME,
  getCalendarCnThemeDefinition,
} from "@/components/marketing/calendarcn-theme-config"
import { CalendarShowcase } from "@/components/calendar/calendar-showcase"

const previewSwatches = [
  "--background",
  "--card",
  "--primary",
  "--muted",
] as const

type PreviewSwatchName = (typeof previewSwatches)[number]

export function CalendarCnThemeShowcase({
  initialDateIso,
}: {
  initialDateIso: string
}) {
  const { theme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [tokenSwatches, setTokenSwatches] = React.useState<
    Record<PreviewSwatchName, string>
  >(() => createTokenSwatches("transparent"))

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted) {
      return
    }

    const rootStyles = window.getComputedStyle(document.documentElement)

    setTokenSwatches(
      Object.fromEntries(
        previewSwatches.map((tokenName) => [
          tokenName,
          rootStyles.getPropertyValue(tokenName).trim() || "transparent",
        ])
      ) as Record<PreviewSwatchName, string>
    )
  }, [mounted, theme])

  const activeTheme = getCalendarCnThemeDefinition(
    mounted ? theme : DEFAULT_CALENDARCN_THEME
  )

  return (
    <div className="space-y-5">
      <div className="rounded-[calc(var(--radius)*1.4)] border border-border/70 bg-card/80 p-5 shadow-xs backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] tracking-[0.28em] text-muted-foreground uppercase">
              Theme preview
            </p>
            <h3 className="text-2xl font-semibold tracking-tight">
              One navbar toggle, one calendar, two clean page modes.
            </h3>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Switch the page from the navbar and the live scheduler follows
              with it. The point is to show that the calendar behaves like a
              real shadcn surface in both white and dark layouts.
            </p>
          </div>

          <ThemeModeBadge isDark={activeTheme.mode === "dark"} />
        </div>
      </div>

      <div className="overflow-hidden rounded-[calc(var(--radius)*1.8)] border border-border/70 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.58)]">
        <div className="border-b border-border/70 bg-background/90 px-4 py-4 backdrop-blur sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <PaletteIcon className="size-3.5" />
                  Active mode
                </span>
                <span>{activeTheme.mode}</span>
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight text-foreground">
                  {activeTheme.label}
                </p>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  {activeTheme.caption}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <ThemeMetaPill label="Mode" value={activeTheme.mode} />
              <ThemeMetaPill label="Surface" value="Page synced" />
              <ThemeMetaPill label="Control" value="Navbar toggle" />
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="mb-4 grid gap-3 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[calc(var(--radius)*1.2)] border border-border/70 bg-card/80 p-4 shadow-xs">
              <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                <SparkleIcon className="size-4 text-primary" />
                Global theme sync
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                White and dark are the only two modes now. The navbar toggle
                changes the entire landing page and this scheduler preview at
                the same time.
              </p>
            </div>

            <div className="rounded-[calc(var(--radius)*1.2)] border border-border/70 bg-card/80 p-4 shadow-xs">
              <p className="text-sm font-medium text-card-foreground">
                Token snapshot
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {previewSwatches.map((tokenName) => (
                  <span
                    key={tokenName}
                    className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs text-foreground"
                  >
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: tokenSwatches[tokenName] }}
                    />
                    {tokenName.replace("--", "")}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <CalendarShowcase initialDateIso={initialDateIso} variant="embed" />
        </div>
      </div>
    </div>
  )
}

function ThemeModeBadge({ isDark }: { isDark: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/72 px-3 py-2 text-sm text-foreground shadow-xs">
      {isDark ? (
        <MoonIcon className="size-4" weight="fill" />
      ) : (
        <SunIcon className="size-4" weight="fill" />
      )}
      {isDark ? "Dark mode" : "White mode"}
    </span>
  )
}

function ThemeMetaPill({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1.5 text-xs text-card-foreground">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </span>
  )
}

function createTokenSwatches(value: string): Record<PreviewSwatchName, string> {
  return Object.fromEntries(
    previewSwatches.map((tokenName) => [tokenName, value])
  ) as Record<PreviewSwatchName, string>
}
