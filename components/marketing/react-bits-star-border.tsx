import * as React from "react"

import { cn } from "@/lib/utils"

type ReactBitsStarBorderProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode
  color?: string
  innerClassName?: string
  speed?: React.CSSProperties["animationDuration"]
  thickness?: number
}

export function ReactBitsStarBorder({
  children,
  className,
  color = "color-mix(in oklab, var(--primary) 65%, white)",
  innerClassName,
  speed = "7s",
  style,
  thickness = 1,
  ...props
}: ReactBitsStarBorderProps) {
  return (
    <div
      className={cn(
        "relative inline-block overflow-hidden rounded-[calc(var(--radius)*1.8)]",
        className
      )}
      style={{ padding: thickness, ...style }}
      {...props}
    >
      <div
        aria-hidden="true"
        className="rb-star-movement-bottom pointer-events-none absolute right-[-250%] bottom-[-14px] z-0 h-[48%] w-[300%] rounded-full opacity-70"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 12%)`,
          animationDuration: speed,
        }}
      />
      <div
        aria-hidden="true"
        className="rb-star-movement-top pointer-events-none absolute top-[-14px] left-[-250%] z-0 h-[48%] w-[300%] rounded-full opacity-70"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 12%)`,
          animationDuration: speed,
        }}
      />
      <div
        className={cn(
          "relative z-10 rounded-[calc(var(--radius)*1.65)] border border-border/70 bg-card",
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  )
}
