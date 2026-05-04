import { ImageResponse } from "next/og"
import { createElement } from "react"

import {
  CalendarCnSocialImage,
  twitterImageSize,
} from "@/components/marketing/seo/social-image"

export function GET() {
  return new ImageResponse(
    createElement(CalendarCnSocialImage, { compact: true }),
    twitterImageSize
  )
}
