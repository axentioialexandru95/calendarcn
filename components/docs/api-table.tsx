import { TypeTable } from "fumadocs-ui/components/type-table"

import {
  calendarApiSections,
  type CalendarApiSectionId,
} from "@/content/docs/calendar"

export function ApiTable({ section }: { section: CalendarApiSectionId }) {
  return (
    <div className="not-prose my-6">
      <TypeTable type={calendarApiSections[section]} />
    </div>
  )
}
