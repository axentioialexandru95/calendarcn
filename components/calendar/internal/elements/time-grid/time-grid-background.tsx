import type { TimeGridViewProps } from "../../shared"
import {
  getBlockedSegmentsForDay,
  getBusinessHourSegmentsForDay,
  getOutsideBusinessHourSegmentsForDay,
} from "../../../utils"

type TimeGridBackgroundProps = {
  blockedRanges: TimeGridViewProps["blockedRanges"]
  businessHours: TimeGridViewProps["businessHours"]
  day: Date
  gridHeight: number
  maxMinute: number
  minMinute: number
  slotDuration: number
  slotHeight: number
}

export function TimeGridBackground({
  blockedRanges,
  businessHours,
  day,
  gridHeight,
  maxMinute,
  minMinute,
  slotDuration,
  slotHeight,
}: TimeGridBackgroundProps) {
  const outsideBusinessHourSegments = getOutsideBusinessHourSegmentsForDay(
    day,
    businessHours,
    minMinute,
    maxMinute
  )
  const businessHourSegments = getBusinessHourSegmentsForDay(
    day,
    businessHours,
    minMinute,
    maxMinute
  )
  const blockedSegments = getBlockedSegmentsForDay(
    day,
    blockedRanges,
    minMinute,
    maxMinute
  )

  return (
    <div className="pointer-events-none absolute inset-0">
      {outsideBusinessHourSegments.map((segment) => (
        <div
          key={`outside-${segment.startMinute}-${segment.endMinute}`}
          className="absolute inset-x-0 bg-muted/20"
          style={{
            height:
              ((segment.endMinute - segment.startMinute) / slotDuration) *
              slotHeight,
            top:
              ((segment.startMinute - minMinute) / slotDuration) * slotHeight,
          }}
        />
      ))}
      {businessHourSegments.map((segment) => (
        <div
          key={`business-${segment.startMinute}-${segment.endMinute}`}
          className="absolute inset-x-0 border-y border-primary/10 bg-primary/3"
          style={{
            height:
              ((segment.endMinute - segment.startMinute) / slotDuration) *
              slotHeight,
            top:
              ((segment.startMinute - minMinute) / slotDuration) * slotHeight,
          }}
        />
      ))}
      {blockedSegments.map((segment) => (
        <div
          key={segment.id}
          className="absolute inset-x-1 overflow-hidden rounded-[min(var(--radius-sm),4px)] border shadow-xs"
          style={{
            backgroundColor: `${segment.color ?? "#be185d"}14`,
            borderColor: `${segment.color ?? "#be185d"}33`,
            height:
              ((segment.endMinute - segment.startMinute) / slotDuration) *
              slotHeight,
            top:
              ((segment.startMinute - minMinute) / slotDuration) * slotHeight,
          }}
        >
          <span
            aria-hidden
            className="absolute top-1.5 bottom-1.5 left-1 w-0.5 rounded-full"
            style={{
              backgroundColor: `${segment.color ?? "#be185d"}80`,
            }}
          />
          {segment.label ? (
            <span
              className="absolute top-1.5 left-3 right-2 truncate text-[11px] font-medium"
              style={{
                color: segment.color ?? "#be185d",
              }}
            >
              {segment.label}
            </span>
          ) : null}
        </div>
      ))}
      <div className="absolute inset-0 shadow-[inset_0_1px_0_0_var(--color-border)]" />
      <div
        className="absolute inset-x-0 bottom-0 border-b border-border/50"
        style={{ top: gridHeight - 1 }}
      />
    </div>
  )
}
