import { cn } from "@/lib/utils"

type CalendarCnLogoProps = {
  className?: string
  iconClassName?: string
  labelClassName?: string
  withLabel?: boolean
}

export function CalendarCnLogo({
  className,
  iconClassName,
  labelClassName,
  withLabel = true,
}: CalendarCnLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative inline-flex size-8 items-center justify-center rounded-xl border border-border/70 bg-gradient-to-b from-card to-background text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_28px_-18px_rgba(15,23,42,0.55)]",
          iconClassName
        )}
      >
        <svg
          aria-hidden
          className="size-[18px]"
          fill="none"
          viewBox="0 0 24 24"
        >
          <rect
            height="14"
            rx="3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            width="15"
            x="4.5"
            y="5.5"
          />
          <path
            d="M4.5 10.25h15M8.25 3.75v3.5M15.75 3.75v3.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
          />
          <rect
            fill="currentColor"
            height="2.75"
            opacity="0.95"
            rx="0.9"
            width="2.75"
            x="8"
            y="12.25"
          />
          <rect
            fill="currentColor"
            height="2.75"
            opacity="0.45"
            rx="0.9"
            width="2.75"
            x="12.8"
            y="12.25"
          />
        </svg>
      </span>
      {withLabel ? (
        <span
          className={cn(
            "font-sans text-[0.98rem] font-medium lowercase tracking-[0.08em] text-foreground antialiased",
            labelClassName
          )}
        >
          calendarcn
        </span>
      ) : null}
    </span>
  )
}
