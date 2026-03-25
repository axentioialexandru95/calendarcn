import {
  CalendarCnSectionFrame,
  CalendarCnSectionHeading,
} from "@/components/marketing/sections/primitives"

type CalendarCnComponentsSectionProps = {
  content: {
    body: string
    eyebrow: string
    items: Array<{
      body: string
      detail: string
      name: string
      title: string
    }>
    title: string
  }
}

export function CalendarCnComponentsSection({
  content,
}: CalendarCnComponentsSectionProps) {
  return (
    <CalendarCnSectionFrame id="components">
      <CalendarCnSectionHeading
        body={content.body}
        className="mb-10"
        eyebrow={content.eyebrow}
        title={content.title}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {content.items.map((primitive) => (
          <article
            key={primitive.name}
            className="rounded-3xl border border-border/70 bg-card p-6 shadow-xs"
          >
            <div className="space-y-4">
              <div className="inline-flex rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
                {primitive.name}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold tracking-tight">
                  {primitive.title}
                </h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {primitive.body}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {primitive.detail}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </CalendarCnSectionFrame>
  )
}
