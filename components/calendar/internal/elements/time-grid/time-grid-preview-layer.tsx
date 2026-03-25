type TimeGridPreviewLayerProps = {
  columns: number
  column: number
  height: number
  slotDuration: number
  slotHeight: number
  top: number
  minMinute: number
}

export function TimeGridPreviewLayer({
  column,
  columns,
  height,
  minMinute,
  slotDuration,
  slotHeight,
  top,
}: TimeGridPreviewLayerProps) {
  return (
    <div
      data-calendar-drop-preview="time-grid"
      className="pointer-events-none absolute z-10 px-1"
      style={{
        top: ((top - minMinute) / slotDuration) * slotHeight,
        height: Math.max(
          slotHeight - 4,
          (height / slotDuration) * slotHeight
        ),
        left: `calc(${(column * 100) / columns}% + 0px)`,
        width: `calc(${100 / columns}% - 0px)`,
      }}
    >
      <div className="h-full rounded-[min(var(--radius-sm),4px)] border border-dashed border-foreground/18 bg-foreground/8 shadow-sm dark:border-white/12 dark:bg-white/8" />
    </div>
  )
}
