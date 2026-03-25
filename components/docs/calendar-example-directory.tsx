import Link from "next/link"

import { calendarExamples } from "@/content/docs/calendar"

export function CalendarExampleDirectory() {
  const groups = [
    {
      id: "pattern",
      title: "Implementation Patterns",
    },
    {
      id: "view",
      title: "Calendar Views",
    },
  ] as const

  return (
    <div className="not-prose my-6 space-y-8">
      {groups.map((group) => (
        <section className="space-y-4" key={group.id}>
          <div className="space-y-1">
            <h3 className="text-xl font-semibold tracking-tight text-foreground">
              {group.title}
            </h3>
            <p className="text-sm leading-7 text-muted-foreground">
              {group.id === "pattern"
                ? "Preset configurations that show how the same calendar surface adapts to different product constraints."
                : "Focused docs for each supported view so users can land directly on the surface they need to implement."}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(calendarExamples)
              .filter(([, example]) => example.group === group.id)
              .map(([id, example]) => (
                <Link
                  className="rounded-[1.5rem] border border-border/70 bg-card/70 p-5 shadow-[0_20px_60px_-45px_rgba(15,23,42,0.45)] transition-[border-color,transform,box-shadow] hover:border-border hover:-translate-y-0.5 hover:shadow-[0_28px_80px_-50px_rgba(15,23,42,0.5)]"
                  href={example.href}
                  key={id}
                >
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[0.72rem] font-semibold tracking-[0.18em] uppercase text-muted-foreground">
                        {example.tabLabel}
                      </p>
                      <h4 className="text-lg font-semibold tracking-tight text-foreground">
                        {example.title}
                      </h4>
                      <p className="text-sm leading-7 text-muted-foreground">
                        {example.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {example.highlights.map((highlight) => (
                        <span
                          className="rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs text-muted-foreground"
                          key={highlight}
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}
