import path from "node:path"

import {
  calendarExamples,
  type CalendarExampleId,
} from "@/content/docs/calendar"
import { PreviewCodeTabs } from "@/components/docs/preview-code-tabs"
import { readSourceFile } from "@/lib/docs/source-files"

export async function CalendarExample({ id }: { id: CalendarExampleId }) {
  const example = calendarExamples[id]
  const ExampleComponent = example.component
  const source = await readSourceFile(example.filePath)

  return (
    <div className="not-prose my-8 space-y-4">
      <div className="space-y-1">
        <h3 className="text-xl font-semibold tracking-tight text-foreground">
          {example.title}
        </h3>
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
          {example.description}
        </p>
      </div>
      <PreviewCodeTabs
        code={source}
        fileName={path.basename(example.filePath)}
        preview={<ExampleComponent />}
      />
    </div>
  )
}
