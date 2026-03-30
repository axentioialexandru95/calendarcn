"use client"

import * as React from "react"

import { cn } from "../../internal/lib/utils"

type ButtonProps = React.ComponentProps<"button"> & {
  size?: "default" | "sm" | "icon-sm"
  variant?: "default" | "outline" | "secondary" | "ghost"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      size = "default",
      type = "button",
      variant = "default",
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
          size === "default" ? "h-9 px-2.5" : "",
          size === "sm" ? "h-8 px-2.5" : "",
          size === "icon-sm" ? "size-8" : "",
          variant === "default"
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "",
          variant === "outline"
            ? "border-border bg-background text-foreground shadow-xs hover:bg-muted"
            : "",
          variant === "secondary"
            ? "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            : "",
          variant === "ghost" ? "hover:bg-muted hover:text-foreground" : "",
          className
        )}
        ref={ref}
        type={type}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"
