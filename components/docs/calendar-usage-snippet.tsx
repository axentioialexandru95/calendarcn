import { calendarUsageSnippet } from "@/content/docs/calendar"
import { CodePanel } from "@/components/docs/code-panel"

export function CalendarUsageSnippet() {
  return (
    <div className="not-prose my-6">
      <CodePanel
        code={calendarUsageSnippet}
        fileName="app/schedule/page.tsx"
      />
    </div>
  )
}
