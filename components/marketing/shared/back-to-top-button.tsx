"use client"

import { ArrowUpIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"

type CalendarCnBackToTopButtonProps = {
  href: string
  label: string
}

export function CalendarCnBackToTopButton({
  href,
  label,
}: CalendarCnBackToTopButtonProps) {
  return (
    <Button asChild variant="outline">
      <a aria-label={label} href={href}>
        <ArrowUpIcon className="size-4" weight="bold" />
      </a>
    </Button>
  )
}
