import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  description:
    "Interactive CalendarCN demo routes and focused behavior fixtures.",
  robots: {
    follow: false,
    googleBot: {
      follow: false,
      index: false,
    },
    index: false,
  },
  title: "Calendar Lab",
}

export default function CalendarLabLayout({
  children,
}: {
  children: ReactNode
}) {
  return children
}
