import { createPortal } from "react-dom"

import type {
  CalendarCreateOperation,
  CalendarDragData,
  CalendarEvent,
  CalendarEventChangeConfirmationContext,
  CalendarOccurrence,
  CalendarResource,
} from "../../../../types"
import {
  canArchiveOccurrence,
  canDeleteOccurrence,
  canDuplicateOccurrence,
  canOpenEventDetails,
  formatDurationLabel,
  getCalendarSlotClassName,
  getEventMetaLabel,
} from "../../../../utils"
import type {
  CalendarEventMenuPosition,
  CalendarRootProps,
} from "../../../shared"
import { EventSurface, getResolvedAccentColor } from "../../event-card"
import { CalendarEventChangeConfirmationDialog } from "../../event-change-confirmation-dialog"
import { CalendarEventContextMenu } from "../../event-context-menu"
import { CalendarEventCreateSheet } from "../../event-create-sheet"
import { CalendarEventDetailsSheet } from "../../event-details-sheet"
import { CalendarKeyboardShortcutsDialog } from "../../keyboard-shortcuts-dialog"

import {
  getDragOverlayStyle,
  type ActiveDragInteraction,
} from "../root-utils"

type CalendarRootPortalsProps = {
  activeDrag: CalendarDragData | null
  activeDragInteraction: ActiveDragInteraction | null
  activeDragRect: DOMRect | null
  classNames: CalendarRootProps["classNames"]
  closeContextMenu: () => void
  closeCreateSheet: () => void
  closeEventDetails: () => void
  closePendingEventChange: () => void
  commitCreateEvent: (operation: CalendarCreateOperation) => string | void
  commitEventUpdate: (nextEvent: CalendarEvent) => void
  contextMenu: {
    occurrence: CalendarOccurrence
    position: CalendarEventMenuPosition
  } | null
  createEventSheet: CalendarRootProps["createEventSheet"]
  createSheetOperation: CalendarCreateOperation | null
  density: CalendarRootProps["density"]
  detailsOccurrence: CalendarOccurrence | null
  eventChangeConfirmation: CalendarRootProps["eventChangeConfirmation"]
  eventDetails: CalendarRootProps["eventDetails"]
  eventDetailsEnabled: boolean
  getEventColor?: CalendarRootProps["getEventColor"]
  handleArchiveEvent: (occurrence: CalendarOccurrence) => void
  handleConfirmPendingEventChange: () => void
  handleDeleteEvent: (occurrence: CalendarOccurrence) => void
  handleDuplicateEvent: (occurrence: CalendarOccurrence) => void
  hourCycle?: 12 | 24
  isHydrated: boolean
  isKeyboardShortcutsOpen: boolean
  isPointerDragging: boolean
  keyboardShortcuts: CalendarRootProps["keyboardShortcuts"]
  locale?: string
  onEventArchive?: CalendarRootProps["onEventArchive"]
  onEventDelete?: CalendarRootProps["onEventDelete"]
  onEventDuplicate?: CalendarRootProps["onEventDuplicate"]
  onEventUpdate?: CalendarRootProps["onEventUpdate"]
  openEventDetails: (occurrence: CalendarOccurrence) => void
  pendingEventChange: CalendarEventChangeConfirmationContext | null
  renderEvent: CalendarRootProps["renderEvent"]
  renderEventDetails: CalendarRootProps["renderEventDetails"]
  resources?: CalendarResource[]
  secondaryTimeZone?: string
  setIsKeyboardShortcutsOpen: (open: boolean) => void
  shouldSuppressEventClick?: (occurrenceId: string) => boolean
  showDragPreviewMeta: boolean
  showSecondaryTimeZone: boolean
  timeZone?: string
}

export function CalendarRootPortals({
  activeDrag,
  activeDragInteraction,
  activeDragRect,
  classNames,
  closeContextMenu,
  closeCreateSheet,
  closeEventDetails,
  closePendingEventChange,
  commitCreateEvent,
  commitEventUpdate,
  contextMenu,
  createEventSheet,
  createSheetOperation,
  density,
  detailsOccurrence,
  eventChangeConfirmation,
  eventDetails,
  eventDetailsEnabled,
  getEventColor,
  handleArchiveEvent,
  handleConfirmPendingEventChange,
  handleDeleteEvent,
  handleDuplicateEvent,
  hourCycle,
  isHydrated,
  isKeyboardShortcutsOpen,
  isPointerDragging,
  keyboardShortcuts,
  locale,
  onEventArchive,
  onEventDelete,
  onEventDuplicate,
  onEventUpdate,
  openEventDetails,
  pendingEventChange,
  renderEvent,
  renderEventDetails,
  resources,
  secondaryTimeZone,
  setIsKeyboardShortcutsOpen,
  shouldSuppressEventClick,
  showDragPreviewMeta,
  showSecondaryTimeZone,
  timeZone,
}: CalendarRootPortalsProps) {
  if (!isHydrated) {
    return null
  }

  return createPortal(
    <>
      {isPointerDragging && activeDrag?.kind === "event" && activeDragRect ? (
        <div className="pointer-events-none fixed inset-0 z-50">
          <EventSurface
            accentColor={getResolvedAccentColor(
              activeDrag.occurrence,
              getEventColor
            )}
            className={getCalendarSlotClassName(
              classNames,
              "dragOverlay",
              activeDragRect ? undefined : "w-64 max-w-[80vw]"
            )}
            density={density}
            dragging
            event={activeDrag.occurrence}
            overlay
            renderEvent={renderEvent}
            shouldSuppressClick={shouldSuppressEventClick}
            style={getDragOverlayStyle(activeDragRect, activeDragInteraction)}
            previewMetaLabel={
              showDragPreviewMeta
                ? formatDurationLabel(
                    activeDrag.occurrence.start,
                    activeDrag.occurrence.end,
                    activeDrag.occurrence.allDay
                  )
                : undefined
            }
            timeLabel={getEventMetaLabel(activeDrag.occurrence, {
              hourCycle,
              locale,
              timeZone,
            })}
            variant={activeDrag.variant}
          />
        </div>
      ) : null}
      {contextMenu ? (
        <CalendarEventContextMenu
          hourCycle={hourCycle}
          locale={locale}
          occurrence={contextMenu.occurrence}
          onArchive={
            canArchiveOccurrence(contextMenu.occurrence) && onEventArchive
              ? () => handleArchiveEvent(contextMenu.occurrence)
              : undefined
          }
          onClose={closeContextMenu}
          onDelete={
            canDeleteOccurrence(contextMenu.occurrence) && onEventDelete
              ? () => handleDeleteEvent(contextMenu.occurrence)
              : undefined
          }
          onDuplicate={
            canDuplicateOccurrence(contextMenu.occurrence) && onEventDuplicate
              ? () => handleDuplicateEvent(contextMenu.occurrence)
              : undefined
          }
          onOpenDetails={
            eventDetailsEnabled && canOpenEventDetails(contextMenu.occurrence)
              ? () => openEventDetails(contextMenu.occurrence)
              : undefined
          }
          timeZone={timeZone}
          x={contextMenu.position.x}
          y={contextMenu.position.y}
        />
      ) : null}
      <CalendarEventChangeConfirmationDialog
        config={eventChangeConfirmation}
        context={pendingEventChange}
        hourCycle={hourCycle}
        locale={locale}
        onCancel={closePendingEventChange}
        onConfirm={handleConfirmPendingEventChange}
        timeZone={timeZone}
      />
      <CalendarEventCreateSheet
        config={createEventSheet}
        initialOperation={createSheetOperation}
        onOpenChange={(open) => {
          if (!open) {
            closeCreateSheet()
          }
        }}
        onSubmit={commitCreateEvent}
        resources={resources}
        timeZone={timeZone}
      />
      <CalendarEventDetailsSheet
        config={eventDetails}
        hourCycle={hourCycle}
        locale={locale}
        occurrence={detailsOccurrence}
        onOpenChange={(open) => {
          if (!open) {
            closeEventDetails()
          }
        }}
        onSubmit={onEventUpdate ? commitEventUpdate : undefined}
        renderContent={renderEventDetails}
        resources={resources}
        secondaryTimeZone={showSecondaryTimeZone ? secondaryTimeZone : undefined}
        timeZone={timeZone}
      />
      <CalendarKeyboardShortcutsDialog
        config={keyboardShortcuts}
        onOpenChange={setIsKeyboardShortcutsOpen}
        open={isKeyboardShortcutsOpen}
      />
    </>,
    document.body
  )
}
