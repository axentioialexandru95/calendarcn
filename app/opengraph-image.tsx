import { ImageResponse } from "next/og"

import {
  CalendarCnSocialImage,
  socialImageSize,
} from "@/components/marketing/seo/social-image"

export const alt = "CalendarCN social preview"
export const contentType = "image/png"
export const size = socialImageSize

export default function OpenGraphImage() {
  return new ImageResponse(<CalendarCnSocialImage />, size)
}
