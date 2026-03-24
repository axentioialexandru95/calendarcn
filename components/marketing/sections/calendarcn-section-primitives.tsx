import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type CalendarCnSectionFrameProps = {
  children: ReactNode
  className?: string
  containerClassName?: string
  id?: string
}

type CalendarCnSectionHeadingProps = {
  body: string
  className?: string
  eyebrow: string
  title: string
}

export function CalendarCnSectionFrame({
  children,
  className,
  containerClassName,
  id,
}: CalendarCnSectionFrameProps) {
  return (
    <section id={id} className={cn("border-b border-border/70", className)}>
      <div
        className={cn(
          "mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20",
          containerClassName
        )}
      >
        {children}
      </div>
    </section>
  )
}

export function CalendarCnSectionHeading({
  body,
  className,
  eyebrow,
  title,
}: CalendarCnSectionHeadingProps) {
  return (
    <div className={cn("max-w-3xl space-y-3", className)}>
      <p className="text-sm font-medium text-primary">{eyebrow}</p>
      <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      <p className="text-base leading-7 text-muted-foreground">{body}</p>
    </div>
  )
}
