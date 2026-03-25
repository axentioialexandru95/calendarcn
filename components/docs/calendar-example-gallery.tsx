import path from "node:path"

import type { CalendarExampleId } from "@/content/docs/calendar"
import { CalendarExampleGalleryClient } from "@/components/docs/calendar-example-gallery-client"
import { calendarExamples } from "@/content/docs/calendar"
import { readSourceFile } from "@/lib/docs/source-files"

export async function CalendarExampleGallery({
  defaultId,
  ids,
}: {
  defaultId?: CalendarExampleId
  ids: CalendarExampleId[]
}) {
  const sources = Object.fromEntries(
    await Promise.all(
      ids.map(async (id) => {
        const example = calendarExamples[id]
        const code = await readSourceFile(example.filePath)

        return [
          id,
          {
            code,
            fileName: path.basename(example.filePath),
          },
        ] as const
      })
    )
  )

  return (
    <CalendarExampleGalleryClient
      defaultId={defaultId}
      ids={ids}
      sources={sources}
    />
  )
}
