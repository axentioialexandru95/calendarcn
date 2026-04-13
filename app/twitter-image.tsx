import { ImageResponse } from "next/og"

import {
  CalendarCnSocialImage,
  twitterImageSize,
} from "@/components/marketing/seo/social-image"

export const alt = "CalendarCN social preview"
export const contentType = "image/png"
export const size = twitterImageSize

export default function TwitterImage() {
  return new ImageResponse(<CalendarCnSocialImage compact />, size)
}
