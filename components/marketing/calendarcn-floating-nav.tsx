"use client"

import * as React from "react"
import { MoonIcon, SunIcon } from "@phosphor-icons/react"
import { useTheme } from "next-themes"

import {
  DEFAULT_CALENDARCN_THEME,
  toggleCalendarCnTheme,
} from "@/components/marketing/calendarcn-theme-config"
import { cn } from "@/lib/utils"

type CalendarCnFloatingNavProps = {
  brand: string
  items: Array<{
    href: string
    label: string
  }>
}

export function CalendarCnFloatingNav({
  brand,
  items,
}: CalendarCnFloatingNavProps) {
  const { setTheme, theme } = useTheme()
  const sectionIds = React.useMemo(
    () => ["top", ...items.map((item) => item.href.replace(/^#/, ""))],
    [items]
  )
  const [activeHref, setActiveHref] = React.useState("")
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    let frame = 0

    const updateActiveSection = () => {
      const offset = window.innerHeight * 0.24
      let nextActiveHref = ""

      for (const sectionId of sectionIds) {
        const section = document.getElementById(sectionId)
        if (!section) {
          continue
        }

        if (section.getBoundingClientRect().top <= offset) {
          nextActiveHref = `#${sectionId}`
        } else {
          break
        }
      }

      setActiveHref((currentHref) =>
        currentHref === nextActiveHref ? currentHref : nextActiveHref
      )
    }

    const queueUpdate = () => {
      cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(updateActiveSection)
    }

    queueUpdate()
    window.addEventListener("scroll", queueUpdate, { passive: true })
    window.addEventListener("resize", queueUpdate)
    window.addEventListener("hashchange", queueUpdate)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", queueUpdate)
      window.removeEventListener("resize", queueUpdate)
      window.removeEventListener("hashchange", queueUpdate)
    }
  }, [sectionIds])

  const selectedTheme = mounted
    ? (theme ?? DEFAULT_CALENDARCN_THEME)
    : DEFAULT_CALENDARCN_THEME
  const isDark = selectedTheme === "theme-dark"

  return (
    <header className="pointer-events-none fixed inset-x-0 top-4 z-40 px-4 sm:px-6 lg:px-8">
      <div className="pointer-events-auto mx-auto flex max-w-5xl items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/72 px-4 py-3 shadow-[0_18px_48px_-28px_rgba(15,23,42,0.5)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/58">
        <a
          href="#top"
          className="text-sm font-semibold tracking-tight text-foreground/92 transition-colors hover:text-foreground"
        >
          {brand}
        </a>

        <nav className="hidden items-center gap-1.5 md:flex">
          {items.map((item) => {
            const isActive = activeHref === item.href

            return (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-[10px] border px-3 py-1.5 text-sm transition-[background-color,border-color,color,box-shadow]",
                  isActive
                    ? "border-foreground/12 bg-foreground/8 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                    : "border-transparent text-muted-foreground hover:border-border/70 hover:bg-foreground/5 hover:text-foreground"
                )}
              >
                {item.label}
              </a>
            )
          })}
        </nav>

        <button
          aria-label={isDark ? "Switch to white theme" : "Switch to dark theme"}
          className="inline-flex size-10 items-center justify-center text-foreground transition-colors hover:text-foreground/80"
          onClick={() => setTheme(toggleCalendarCnTheme(selectedTheme))}
          type="button"
        >
          {isDark ? (
            <MoonIcon className="size-4" weight="fill" />
          ) : (
            <SunIcon className="size-4" weight="fill" />
          )}
        </button>
      </div>
    </header>
  )
}
