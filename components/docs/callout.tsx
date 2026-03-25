import type { ComponentProps, ReactNode } from "react"

import { cn } from "@/lib/utils"

export type CalloutType =
  | "info"
  | "warn"
  | "error"
  | "success"
  | "warning"
  | "idea"

export interface CalloutContainerProps extends ComponentProps<"div"> {
  type?: CalloutType
  icon?: ReactNode
}

const CALLOUT_STYLES = {
  info: {
    accent: "bg-blue-500/70",
    iconWrapper: "border-blue-500/15 bg-blue-500/8 text-blue-600 dark:text-blue-400",
  },
  warning: {
    accent: "bg-amber-500/75",
    iconWrapper:
      "border-amber-500/20 bg-amber-500/8 text-amber-700 dark:text-amber-400",
  },
  error: {
    accent: "bg-destructive/75",
    iconWrapper:
      "border-destructive/20 bg-destructive/8 text-destructive dark:text-destructive",
  },
  success: {
    accent: "bg-emerald-500/75",
    iconWrapper:
      "border-emerald-500/20 bg-emerald-500/8 text-emerald-700 dark:text-emerald-400",
  },
  idea: {
    accent: "bg-violet-500/75",
    iconWrapper:
      "border-violet-500/20 bg-violet-500/8 text-violet-700 dark:text-violet-400",
  },
} as const

function resolveAlias(type: CalloutType): keyof typeof CALLOUT_STYLES {
  if (type === "warn") return "warning"

  return type
}

function getIcon(type: keyof typeof CALLOUT_STYLES) {
  switch (type) {
    case "warning":
      return <WarningIcon className="size-4.5" />
    case "error":
      return <ErrorIcon className="size-4.5" />
    case "success":
      return <SuccessIcon className="size-4.5" />
    case "idea":
      return <IdeaIcon className="size-4.5" />
    default:
      return <InfoIcon className="size-4.5" />
  }
}

export function Callout({
  children,
  title,
  ...props
}: { title?: ReactNode } & Omit<CalloutContainerProps, "title">) {
  return (
    <CalloutContainer {...props}>
      {title ? <CalloutTitle>{title}</CalloutTitle> : null}
      <CalloutDescription>{children}</CalloutDescription>
    </CalloutContainer>
  )
}

export function CalloutContainer({
  type: inputType = "info",
  icon,
  children,
  className,
  ...props
}: CalloutContainerProps) {
  const type = resolveAlias(inputType)
  const tone = CALLOUT_STYLES[type]

  return (
    <div
      className={cn(
        "my-4 flex gap-3 rounded-lg border border-border/70 bg-card/65 px-4 py-3 text-sm text-card-foreground",
        className,
      )}
      {...props}
    >
      <div className={cn("mt-0.5 w-1 shrink-0 rounded-sm", tone.accent)} />
      <div
        className={cn(
          "mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md border",
          tone.iconWrapper,
        )}
      >
        {icon ?? getIcon(type)}
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">{children}</div>
    </div>
  )
}

export function CalloutTitle({
  children,
  className,
  ...props
}: ComponentProps<"p">) {
  return (
    <p className={cn("m-0 font-medium text-foreground", className)} {...props}>
      {children}
    </p>
  )
}

export function CalloutDescription({
  children,
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "text-muted-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function IconBase({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  )
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" />
      <circle cx="12" cy="7" fill="currentColor" r="1" stroke="none" />
    </IconBase>
  )
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M12 3 21 19H3L12 3Z" />
      <path d="M12 9v4" />
      <circle cx="12" cy="17" fill="currentColor" r="1" stroke="none" />
    </IconBase>
  )
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6" />
      <path d="m15 9-6 6" />
    </IconBase>
  )
}

function SuccessIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </IconBase>
  )
}

function IdeaIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M9.5 17h5" />
      <path d="M10.5 20h3" />
      <path d="M8.8 14.8c-.9-.8-1.8-2-1.8-3.8a5 5 0 1 1 10 0c0 1.8-.9 3-1.8 3.8-.6.5-1 1.2-1.2 2.2h-2c-.2-1-.6-1.7-1.2-2.2Z" />
    </IconBase>
  )
}
