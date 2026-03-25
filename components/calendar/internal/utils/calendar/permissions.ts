import type { CalendarOccurrence } from "../../../types"

export function canMoveOccurrence(occurrence: CalendarOccurrence) {
  return !occurrence.readOnly && occurrence.canMove !== false
}

export function canResizeOccurrence(occurrence: CalendarOccurrence) {
  return !occurrence.readOnly && occurrence.canResize !== false
}

export function canArchiveOccurrence(occurrence: CalendarOccurrence) {
  return !occurrence.readOnly && occurrence.canArchive !== false
}

export function canDeleteOccurrence(occurrence: CalendarOccurrence) {
  return !occurrence.readOnly && occurrence.canDelete !== false
}

export function canDuplicateOccurrence(occurrence: CalendarOccurrence) {
  return !occurrence.readOnly && occurrence.canDuplicate !== false
}

export function canUpdateOccurrence(occurrence: CalendarOccurrence) {
  return !occurrence.readOnly && occurrence.canUpdate !== false
}

export function canOpenEventDetails(occurrence: CalendarOccurrence) {
  return occurrence.canOpenDetails !== false
}
