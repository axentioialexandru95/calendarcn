import type { Metadata } from "next"
import Script from "next/script"
import { RootProvider } from "fumadocs-ui/provider/next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "CalendarCN | Open-Source Calendar Components for shadcn/ui",
  description:
    "CalendarCN is an open-source calendar component set for shadcn/ui apps with month, week, day, and agenda views plus direct event editing.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="antialiased">
      <head>
        <Script
          src="https://mcp.figma.com/mcp/html-to-design/capture.js"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-svh bg-background text-foreground">
        <ThemeProvider>
          <RootProvider
            search={{
              options: {
                api: "/api/search",
              },
            }}
            theme={{
              enabled: false,
            }}
          >
            {children}
          </RootProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
