import { CalendarCnLanding } from "@/components/marketing/landing"
import { createPageMetadata } from "@/lib/seo"
import { absoluteUrl, siteConfig } from "@/lib/site-config"
import { setDateInTimeZone } from "@/lib/timezone-date"

export const dynamic = "force-dynamic"
export const metadata = createPageMetadata({
  keywords: [
    "calendar component for shadcn ui",
    "react scheduler component",
    "drag and drop calendar react",
  ],
  path: "/",
  title: "Open-source scheduling primitives for shadcn/ui apps",
})

const DEMO_TIME_ZONE = "Europe/Bucharest"
const softwareApplicationStructuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  applicationCategory: "DeveloperApplication",
  codeRepository: siteConfig.repoUrl,
  creator: {
    "@type": "Person",
    name: "Axentioi Alexandru",
    url: "https://phantomtechind.com",
  },
  description: siteConfig.description,
  featureList: [
    "Month, week, day, and agenda views",
    "Drag and drop editing",
    "Resizable events",
    "Recurring event expansion",
    "Resource lanes",
    "Typed scheduling callbacks",
  ],
  isAccessibleForFree: true,
  name: siteConfig.name,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  operatingSystem: "Web",
  softwareHelp: absoluteUrl("/docs"),
  softwareVersion: "0.0.1",
  url: siteConfig.url,
}

function getHomepageDemoInitialDateIso() {
  return setDateInTimeZone(new Date(), DEMO_TIME_ZONE, {
    hours: 9,
    minutes: 0,
    seconds: 0,
  }).toISOString()
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplicationStructuredData),
        }}
      />
      <CalendarCnLanding initialDateIso={getHomepageDemoInitialDateIso()} />
    </>
  )
}
