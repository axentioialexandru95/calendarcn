import type { Metadata } from "next"
import Script from "next/script"
import { RootProvider } from "fumadocs-ui/provider/next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { defaultMetadataTitle, siteKeywords } from "@/lib/seo"
import { absoluteUrl, siteConfig, socialPreview } from "@/lib/site-config"

export const metadata: Metadata = {
  applicationName: siteConfig.name,
  authors: [
    {
      name: "Axentioi Alexandru",
      url: "https://phantomtechind.com",
    },
  ],
  category: "developer tools",
  creator: "Axentioi Alexandru",
  description: siteConfig.description,
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  keywords: siteKeywords,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    description: siteConfig.description,
    images: [
      {
        alt: socialPreview.alt,
        height: socialPreview.height,
        secureUrl: absoluteUrl(socialPreview.path),
        type: socialPreview.type,
        url: absoluteUrl(socialPreview.path),
        width: socialPreview.width,
      },
    ],
    locale: "en_US",
    siteName: siteConfig.name,
    title: defaultMetadataTitle,
    type: "website",
    url: siteConfig.url,
  },
  publisher: "Phantom Tech",
  robots: {
    follow: true,
    googleBot: {
      follow: true,
      index: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
    index: true,
  },
  title: {
    default: defaultMetadataTitle,
    template: "%s | CalendarCN",
  },
  twitter: {
    card: "summary_large_image",
    description: siteConfig.description,
    images: [
      {
        alt: socialPreview.alt,
        height: socialPreview.twitterHeight,
        secureUrl: absoluteUrl(socialPreview.twitterPath),
        type: socialPreview.type,
        url: absoluteUrl(socialPreview.twitterPath),
        width: socialPreview.width,
      },
    ],
    title: defaultMetadataTitle,
  },
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
