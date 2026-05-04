import { ImageResponse } from "next/og"
import { createElement } from "react"

import {
  CalendarCnSocialImage,
  socialImageSize,
} from "@/components/marketing/seo/social-image"

export function GET() {
  return new ImageResponse(
    createElement(CalendarCnSocialImage),
    socialImageSize
  )
}
