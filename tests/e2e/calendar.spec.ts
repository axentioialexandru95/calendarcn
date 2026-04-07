import { expect, test, type Locator, type Page } from "@playwright/test"

test.describe("calendar interactions", () => {
  test("homepage showcase can switch to the dense overlap preset", async ({
    page,
  }) => {
    await page.goto("/")

    const denseOverlapPreset = page.getByRole("button", {
      name: /Dense overlap/i,
    })
    await denseOverlapPreset.scrollIntoViewIfNeeded()
    await denseOverlapPreset.click()

    await expect(
      page.getByTestId("calendar-event-overlap-01-time-grid")
    ).toBeVisible()
  })

  test("returns docs search results from the site search endpoint", async ({
    page,
  }) => {
    const response = await page.request.get("/api/search?query=calendar")
    expect(response.ok()).toBe(true)

    const results = (await response.json()) as Array<{
      url: string
    }>

    expect(results.length).toBeGreaterThan(0)
    expect(results.some((result) => result.url.startsWith("/docs"))).toBe(true)
  })

  test("switches views and navigates on the dedicated lab fixture", async ({
    page,
  }) => {
    await gotoCalendarLab(page)

    const currentLabel = page.getByTestId("calendar-current-label")
    const initialLabel = await currentLabel.textContent()

    await page.getByTestId("calendar-nav-next").click()
    await expect(currentLabel).not.toHaveText(initialLabel ?? "")

    await page.getByTestId("calendar-nav-previous").click()
    await expect(currentLabel).toHaveText(initialLabel ?? "")

    await page.getByTestId("calendar-view-day").click()
    await expect(
      page.getByTestId("calendar-event-focus-time-grid")
    ).toBeVisible()

    await page.getByTestId("calendar-view-timeline").click()
    await expect(
      page.getByTestId("calendar-event-focus-timeline")
    ).toBeVisible()

    await page.getByTestId("calendar-view-agenda").click()
    await expect(
      page.getByTestId("calendar-event-planning-agenda")
    ).toBeVisible()

    await page.getByTestId("calendar-view-month").click()
    await expect(
      page.getByTestId("calendar-event-planning-month")
    ).toBeVisible()
  })

  test("zooms the week range into day view with Ctrl+wheel", async ({
    page,
  }) => {
    await gotoCalendarLab(page)

    const headerDays = page.locator('[data-calendar-zoom-surface="header"]')
    const focusHeader = headerDays.nth(2)

    await expect(headerDays).toHaveCount(7)

    await focusHeader.dispatchEvent("wheel", {
      ctrlKey: true,
      deltaY: -120,
    })
    await expect(headerDays).toHaveCount(5)
    await expect(page.locator('[data-calendar-zoom-days="5"]')).toHaveCount(1)

    await focusHeader.dispatchEvent("wheel", {
      ctrlKey: true,
      deltaY: -120,
    })
    await expect(headerDays).toHaveCount(3)
    await expect(page.locator('[data-calendar-zoom-days="3"]')).toHaveCount(1)

    await focusHeader.dispatchEvent("wheel", {
      ctrlKey: true,
      deltaY: -120,
    })
    await expect(headerDays).toHaveCount(1)
    await expect(page.locator('[data-calendar-zoom-days="1"]')).toHaveCount(1)

    const dayLabel = await page
      .getByTestId("calendar-current-label")
      .textContent()

    expect(dayLabel).not.toContain(" - ")

    await headerDays.first().dispatchEvent("wheel", {
      ctrlKey: true,
      deltaY: 120,
    })
    await expect(
      page.locator('[data-calendar-zoom-surface="header"]')
    ).toHaveCount(3)

    await page
      .locator('[data-calendar-zoom-surface="header"]')
      .first()
      .dispatchEvent("wheel", {
        ctrlKey: true,
        deltaY: 120,
      })
    await expect(
      page.locator('[data-calendar-zoom-surface="header"]')
    ).toHaveCount(5)

    await page
      .locator('[data-calendar-zoom-surface="header"]')
      .first()
      .dispatchEvent("wheel", {
        ctrlKey: true,
        deltaY: 120,
      })
    await expect(
      page.locator('[data-calendar-zoom-surface="header"]')
    ).toHaveCount(7)
  })

  test("opens the create sheet and creates an appointment", async ({
    page,
  }) => {
    await gotoCalendarLab(page)

    await page.getByTestId("calendar-toolbar-create").click()

    const sheet = page.getByTestId("calendar-create-sheet")
    await expect(sheet).toBeVisible()

    await sheet.getByLabel("Title").fill("Playwright planning")
    await sheet.getByLabel("Location").fill("Remote")
    await sheet.getByTestId("calendar-create-sheet-submit").click()

    await expect(sheet).toHaveCount(0)
    await expect(page.getByTestId("calendar-live-announcement")).toHaveText(
      /Created Playwright planning for 09:00 - 10:00\./i
    )
    await expect(
      page.locator('[data-calendar-variant="time-grid"]', {
        hasText: "Playwright planning",
      })
    ).toBeVisible()
  })

  test("duplicates an event from the context menu", async ({ page }) => {
    await gotoCalendarLab(page)

    const handoffEvent = page.getByTestId("calendar-event-handoff-time-grid")
    await expect(handoffEvent).toBeVisible()

    await openContextMenu(handoffEvent)
    await expect(page.getByTestId("calendar-event-context-menu")).toBeVisible()
    await page.keyboard.press("Enter")

    await expect(
      page.getByRole("button", { name: /Support handoff\./i })
    ).toHaveCount(2)
  })

  test("keeps the timed preview but hides keyboard slot focus while dragging", async ({
    page,
  }) => {
    await gotoCalendarLab(page)
    await expect(
      page.getByTestId("calendar-resize-handle-focus-end")
    ).toBeVisible()

    const focusEvent = page.getByTestId("calendar-event-focus-time-grid")
    await focusEvent.click()
    await expect(focusEvent).toHaveAttribute("data-selected", "true")

    const targetSlot = page
      .locator('[role="grid"]')
      .nth(2)
      .locator('[data-calendar-drop-target-minute="840"]')
      .first()
    await targetSlot.scrollIntoViewIfNeeded()
    const box = await focusEvent.boundingBox()

    if (!box) {
      throw new Error("Unable to determine drag preview coordinates.")
    }

    const startX = box.x + box.width / 2
    const startY = box.y + 20
    const targetBox = await targetSlot.boundingBox()

    if (!targetBox) {
      throw new Error("Unable to determine drag preview target coordinates.")
    }

    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(
      targetBox.x + targetBox.width / 2,
      targetBox.y + targetBox.height / 2,
      { steps: 12 }
    )
    await expect(
      page.locator('[data-calendar-drop-preview="time-grid"]')
    ).toHaveCount(1)
    await expect(
      page.getByTestId("calendar-resize-handle-focus-start")
    ).toHaveCount(0)
    await expect(
      page.getByTestId("calendar-resize-handle-focus-end")
    ).toHaveCount(0)

    const previewState = await page.evaluate(() => {
      const timedPreviewCount = document.querySelectorAll(
        '[data-calendar-drop-preview="time-grid"]'
      ).length
      const highlightedTimedSlots = Array.from(
        document.querySelectorAll('[data-calendar-drop-target-kind="slot"]')
      ).filter((element) => element.className.includes("bg-muted/70")).length
      const focusedTimedSlots = Array.from(
        document.querySelectorAll('[data-calendar-drop-target-kind="slot"]')
      ).filter((element) => {
        return (
          element.getAttribute("aria-selected") === "true" &&
          element.className.includes("ring-2")
        )
      }).length
      const sourceEventStates = Array.from(
        document.querySelectorAll('[data-calendar-event-id="focus"]')
      )
        .filter(
          (element) =>
            !element.closest('[data-calendar-drag-overlay="true"]') &&
            element instanceof HTMLButtonElement
        )
        .map((element) => ({
          className: element.className,
          selected: element.getAttribute("data-selected"),
        }))

      return {
        focusedTimedSlots,
        highlightedTimedSlots,
        sourceEventStates,
        timedPreviewCount,
      }
    })

    await page.mouse.up()

    expect(previewState.timedPreviewCount).toBe(1)
    expect(previewState.focusedTimedSlots).toBe(0)
    expect(previewState.highlightedTimedSlots).toBe(0)
    expect(previewState.sourceEventStates).toEqual([
      expect.objectContaining({
        className: expect.stringContaining("opacity-0"),
        selected: "true",
      }),
    ])
  })

  test("shows an inline month preview while dragging between day cells", async ({
    page,
  }) => {
    await gotoCalendarLab(page)

    await page.getByTestId("calendar-view-month").click()

    const planningEvent = page
      .getByTestId("calendar-event-planning-month")
      .first()
    const sourceCell = planningEvent.locator(
      'xpath=ancestor::*[@data-calendar-drop-target-kind="day"][1]'
    )
    const targetCell = sourceCell.locator(
      'xpath=following-sibling::*[@data-calendar-drop-target-kind="day"][1]'
    )

    const sourcePoint = await getLocatorPoint(planningEvent)
    const targetPoint = await getLocatorPoint(targetCell)

    await page.mouse.move(sourcePoint.x, sourcePoint.y)
    await page.mouse.down()
    await page.mouse.move(targetPoint.x, targetPoint.y, {
      steps: 20,
    })
    await page.waitForTimeout(150)

    const previewState = await page.evaluate(() => {
      const monthPreviewCount = Array.from(
        document.querySelectorAll(
          '[data-testid="calendar-event-planning-month"]'
        )
      ).filter((element) => {
        return (
          !element.closest('[data-calendar-drag-overlay="true"]') &&
          element.querySelector("span.absolute.inset-0") !== null
        )
      }).length
      const highlightedMonthDays = Array.from(
        document.querySelectorAll('[data-calendar-drop-target-kind="day"]')
      ).filter((element) => element.className.includes("bg-muted/50")).length
      const sourceEventStates = Array.from(
        document.querySelectorAll('[data-calendar-event-id="planning"]')
      )
        .filter(
          (element) =>
            !element.closest('[data-calendar-drag-overlay="true"]') &&
            element instanceof HTMLButtonElement
        )
        .map((element) => element.className)

      return {
        highlightedMonthDays,
        monthPreviewCount,
        sourceEventStates,
      }
    })

    await page.mouse.up()

    expect(previewState.monthPreviewCount).toBe(1)
    expect(previewState.highlightedMonthDays).toBe(1)
    expect(previewState.sourceEventStates).toContainEqual(
      expect.stringContaining("opacity-0")
    )
  })

  test("moves and resizes events inside the timeline view", async ({ page }) => {
    await gotoCalendarLab(page)

    await page.getByTestId("calendar-view-timeline").click()

    const focusEvent = page.getByTestId("calendar-event-focus-timeline")
    await expect(focusEvent).toBeVisible()
    await focusEvent.click()
    await expect(focusEvent).toHaveAttribute("data-selected", "true")

    const focusStartPoint = await getLocatorPoint(focusEvent)
    const opsTargetCell = page
      .getByTestId("calendar-timeline-row-ops")
      .locator('[data-calendar-drop-target-kind="day"]')
      .nth(2)
    const opsTargetPoint = await getLocatorPoint(opsTargetCell, {
      x: "center",
      y: "center",
    })

    await page.mouse.move(focusStartPoint.x, focusStartPoint.y)
    await page.mouse.down()
    await page.waitForTimeout(100)
    await page.mouse.move(opsTargetPoint.x, opsTargetPoint.y, {
      steps: 18,
    })
    await expect
      .poll(async () => await opsTargetCell.getAttribute("class"))
      .toContain("bg-muted/60")
    await page.mouse.up()

    await expect
      .poll(async () => {
        const productCount = await page
          .getByTestId("calendar-timeline-row-product")
          .locator('[data-testid="calendar-event-focus-timeline"]')
          .count()
        const opsCount = await page
          .getByTestId("calendar-timeline-row-ops")
          .locator('[data-testid="calendar-event-focus-timeline"]')
          .count()

        return {
          opsCount,
          productCount,
        }
      })
      .toEqual({
        opsCount: 1,
        productCount: 0,
      })
    await expect(
      page
        .getByTestId("calendar-timeline-row-ops")
        .locator('[data-testid="calendar-event-focus-timeline"]')
    ).toBeVisible()

    const travelEvent = page.getByTestId("calendar-event-travel-timeline")
    await expect(travelEvent).toBeVisible()

    const beforeResizeBox = await travelEvent.boundingBox()

    if (!beforeResizeBox) {
      throw new Error("Unable to determine the initial timeline event bounds.")
    }

    await travelEvent.click()

    const resizeHandle = page.getByTestId("calendar-resize-handle-travel-end")
    const resizeStartPoint = await getLocatorPoint(resizeHandle)
    const resizeTargetCell = page
      .getByTestId("calendar-timeline-row-design")
      .locator('[data-calendar-drop-target-kind="day"]')
      .last()
    const resizeTargetPoint = await getLocatorPoint(resizeTargetCell, {
      x: "right",
    })

    await page.mouse.move(resizeStartPoint.x, resizeStartPoint.y)
    await page.mouse.down()
    await page.mouse.move(resizeTargetPoint.x, resizeTargetPoint.y, {
      steps: 18,
    })
    await page.mouse.up()

    const afterResizeBox = await travelEvent.boundingBox()

    if (!afterResizeBox) {
      throw new Error("Unable to determine the resized timeline event bounds.")
    }

    expect(afterResizeBox.width).toBeGreaterThan(beforeResizeBox.width)
  })

  test("starter wrapper injects the default selected event styling", async ({
    page,
  }) => {
    await gotoCalendarLab(page)

    const planningEvent = page.getByTestId("calendar-event-planning-time-grid")
    await expect(planningEvent).toBeVisible()

    await planningEvent.click()

    await expect(planningEvent).toHaveAttribute("data-selected", "true")
    await expect(planningEvent).toHaveAttribute(
      "class",
      /data-\[selected=true\]:border-ring/
    )
    await expect(planningEvent).toHaveAttribute(
      "class",
      /data-\[selected=true\]:ring-2/
    )
  })

  test("archives an event from the context menu", async ({ page }) => {
    await gotoCalendarLab(page)

    const handoffEvent = page.getByTestId("calendar-event-handoff-time-grid")
    await expect(handoffEvent).toBeVisible()

    await openContextMenu(handoffEvent)
    await expect(page.getByTestId("calendar-event-context-menu")).toBeVisible()
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")

    await expect(
      page.getByTestId("calendar-event-handoff-time-grid")
    ).toHaveCount(0)
  })

  test("blocks timed keyboard moves that overlap unavailable ranges", async ({
    page,
  }) => {
    await gotoCalendarLab(page)

    const focusEvent = page.getByTestId("calendar-event-focus-time-grid")
    await expect(focusEvent).toBeVisible()

    await focusEvent.press("ArrowUp")

    await expect(focusEvent).toHaveAttribute("aria-label", /13:00 - 15:00/i)
    await expect(page.getByTestId("calendar-live-announcement")).toHaveText(
      /Blocked time is unavailable\./i
    )
  })

  test("snaps desktop drag moves to 30-minute increments", async ({ page }) => {
    await gotoCalendarLab(page)

    const standupEvent = page.getByTestId("calendar-event-standup-time-grid")
    await expect(standupEvent).toBeVisible()
    await standupEvent.click()
    await expect(standupEvent).toHaveAttribute("data-selected", "true")

    const startPoint = await getLocatorPoint(standupEvent)
    const targetSlot = getDayGrid(page, 1)
      .locator('[data-calendar-drop-target-minute="480"]')
      .first()
    const targetPoint = await getLocatorPoint(targetSlot)

    await page.mouse.move(startPoint.x, startPoint.y)
    await page.mouse.down()
    await page.mouse.move(targetPoint.x, targetPoint.y, {
      steps: 12,
    })
    await page.mouse.up()

    await expect(standupEvent).toHaveAttribute("aria-label", /08:00 - 08:30/i)
  })

  test("deletes an event from the context menu", async ({ page }) => {
    await gotoCalendarLab(page)

    const planningEvent = page.getByTestId("calendar-event-planning-time-grid")
    await expect(planningEvent).toBeVisible()

    await openContextMenu(planningEvent)
    await expect(page.getByTestId("calendar-event-context-menu")).toBeVisible()
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")

    await expect(
      page.getByTestId("calendar-event-planning-time-grid")
    ).toHaveCount(0)
  })

  test("resizes an event through the keyboard path without a stale intermediate state", async ({
    page,
  }) => {
    await gotoCalendarLab(page)

    const focusEvent = page.getByTestId("calendar-event-focus-time-grid")
    await expect(focusEvent).toBeVisible()

    await focusEvent.press("Shift+ArrowDown")

    await expect(focusEvent).toHaveAttribute("aria-label", /13:00 - 15:30/i)
  })

  test("resizes a timed event through the mouse handle path", async ({
    page,
  }) => {
    await gotoCalendarLab(page)

    const focusEvent = page.getByTestId("calendar-event-focus-time-grid")
    await expect(focusEvent).toBeVisible()
    await focusEvent.click()

    const resizeHandle = page.getByTestId("calendar-resize-handle-focus-end")
    await expect(resizeHandle).toBeVisible()

    const startPoint = await getLocatorPoint(resizeHandle)
    const targetPoint = await getTimeGridSlotPoint(page, focusEvent, 930)

    await page.mouse.move(startPoint.x, startPoint.y)
    await page.mouse.down()
    await page.mouse.move(targetPoint.x, targetPoint.y, {
      steps: 12,
    })
    await page.mouse.up()

    await expect(focusEvent).toHaveAttribute("aria-label", /13:00 - 16:00/i)
  })

  test("opens details for a short timed event without fighting the resize handles", async ({
    page,
  }) => {
    await gotoCalendarLab(page, "/calendar-lab/details")

    const standupEvent = page.getByTestId("calendar-event-standup-time-grid")
    await expect(standupEvent).toBeVisible()

    await standupEvent.click()

    const detailsSheet = page.getByTestId("calendar-event-details-sheet")
    await expect(detailsSheet).toBeVisible()
    await expect(detailsSheet).toContainText("Studio standup")
  })

  test("loads the dense overlap lab with ten overlapping timed events", async ({
    page,
  }) => {
    await gotoCalendarLab(page, "/calendar-lab/overlap")

    await expect(page.getByTestId("calendar-current-label")).toContainText(
      "Tuesday 24 March"
    )
    await expect(
      page.getByTestId("calendar-event-overlap-01-time-grid")
    ).toBeVisible()
    await expect(
      page.locator('[data-calendar-variant="time-grid"]')
    ).toHaveCount(10)
  })

  test("opens a dense month day in day view from the overflow control", async ({
    page,
  }) => {
    await gotoCalendarLab(page, "/calendar-lab/overlap")

    await page.getByTestId("calendar-view-month").click()
    await expect(page.getByTestId("calendar-current-label")).toContainText(
      "March 2026"
    )

    await page
      .getByRole("button", {
        name: /Show all 10 events on .*24 March 2026.*day view/i,
      })
      .click()

    await expect(page.getByTestId("calendar-current-label")).toContainText(
      "Tuesday 24 March"
    )
    await expect(
      page.getByTestId("calendar-event-overlap-01-time-grid")
    ).toBeVisible()
  })

  test("confirms keyboard-driven event moves when confirmation is enabled", async ({
    page,
  }) => {
    await gotoCalendarLab(page, "/calendar-lab/confirm")

    const planningEvent = page.getByTestId("calendar-event-planning-time-grid")
    await expect(planningEvent).toBeVisible()

    await planningEvent.press("ArrowUp")

    const dialog = page.getByTestId("calendar-event-change-confirmation-dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText("Planning review")

    await page.getByTestId("calendar-event-change-confirm").click()

    await expect(planningEvent).toHaveAttribute("aria-label", /13:30 - 15:00/i)
  })

  test("selects only the targeted recurring occurrence", async ({ page }) => {
    await gotoCalendarLab(page, "/calendar-lab/recurrence")

    const recurringOccurrences = page.locator(
      '[data-calendar-event-id="daily-sync"][data-calendar-variant="time-grid"]'
    )
    await expect(recurringOccurrences).toHaveCount(3)

    const targetedOccurrence = page.locator(
      '[data-calendar-occurrence-id="daily-sync:1"][data-calendar-variant="time-grid"]'
    )
    await targetedOccurrence.click()

    await expect(
      page.locator(
        '[data-calendar-event-id="daily-sync"][data-calendar-variant="time-grid"][data-selected="true"]'
      )
    ).toHaveCount(1)
    await expect(targetedOccurrence).toHaveAttribute("data-selected", "true")
  })

  test("hides the view switcher when only one view is available", async ({
    page,
  }) => {
    await gotoCalendarLab(page, "/calendar-lab/recurrence")

    await expect(page.getByTestId("calendar-view-week")).toHaveCount(0)
    await expect(page.getByTestId("calendar-view-day")).toHaveCount(0)
    await expect(page.getByTestId("calendar-view-timeline")).toHaveCount(0)
    await expect(page.getByTestId("calendar-view-month")).toHaveCount(0)
    await expect(page.getByTestId("calendar-view-agenda")).toHaveCount(0)
  })

  test("filters resources and updates an event from the details sheet", async ({
    page,
  }) => {
    await gotoCalendarLab(page, "/calendar-lab/details")

    await expect(page.getByTestId("calendar-event-crit-time-grid")).toHaveCount(
      0
    )

    await page.getByRole("button", { name: "Design" }).click()
    await expect(
      page.getByTestId("calendar-event-crit-time-grid")
    ).toBeVisible()

    await page.getByTestId("calendar-event-crit-time-grid").click()

    const detailsSheet = page.getByTestId("calendar-event-details-sheet")
    await expect(detailsSheet).toBeVisible()
    await detailsSheet
      .getByTestId("calendar-event-details-edit")
      .evaluate((element) => {
        ;(element as HTMLButtonElement).click()
      })
    await detailsSheet
      .locator("#calendar-details-title")
      .fill("Interface critique")
    await detailsSheet.locator("#calendar-details-location").fill("Design lab")
    await detailsSheet.getByTestId("calendar-event-details-submit").click()

    await expect(
      page.getByTestId("calendar-event-crit-time-grid")
    ).toContainText("Interface critique")
  })

  test("opens the keyboard shortcuts dialog from the toolbar", async ({
    page,
  }) => {
    await gotoCalendarLab(page, "/calendar-lab/details")

    await page.getByTestId("calendar-toolbar-shortcuts").click()

    const dialog = page.getByTestId("calendar-keyboard-shortcuts-dialog")
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText("Shift + Arrow keys")
  })
})

async function openContextMenu(locator: Locator) {
  await locator.scrollIntoViewIfNeeded()
  await locator.click({ button: "right", position: { x: 12, y: 12 } })
}

async function gotoCalendarLab(page: Page, path = "/calendar-lab") {
  await page.goto(path)
  await expect(page.getByTestId("calendar-root")).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.locator('[data-calendar-lab-ready="true"]')).toBeVisible({
    timeout: 15_000,
  })
}

function getDayGrid(page: Page, index: number) {
  return page.locator('[role="grid"]').nth(index)
}

async function getLocatorPoint(
  locator: Locator,
  position: {
    x?: "center" | "left" | "right"
    y?: "center" | "top" | "bottom"
  } = {}
) {
  await locator.scrollIntoViewIfNeeded()
  const box = await locator.boundingBox()

  if (!box) {
    throw new Error("Unable to determine locator coordinates.")
  }

  return {
    x:
      position.x === "left"
        ? box.x + 2
        : position.x === "right"
          ? box.x + box.width - 2
          : box.x + box.width / 2,
    y:
      position.y === "top"
        ? box.y + 2
        : position.y === "bottom"
          ? box.y + box.height - 2
          : box.y + box.height / 2,
  }
}

async function getTimeGridSlotPoint(
  page: Page,
  eventLocator: Locator,
  minuteOfDay: number
) {
  const eventBox = await eventLocator.boundingBox()

  if (!eventBox) {
    throw new Error("Unable to determine event coordinates.")
  }

  const point = await page
    .locator(
      `[data-calendar-drop-target-kind="slot"][data-calendar-drop-target-minute="${minuteOfDay}"]`
    )
    .evaluateAll(
      (elements, eventCenterX) => {
        for (const element of elements) {
          if (!(element instanceof HTMLElement)) {
            continue
          }

          const rect = element.getBoundingClientRect()

          if (eventCenterX >= rect.left && eventCenterX <= rect.right) {
            return {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
            }
          }
        }

        return null
      },
      eventBox.x + eventBox.width / 2
    )

  if (!point) {
    throw new Error(`Unable to determine slot coordinates for ${minuteOfDay}.`)
  }

  return point
}
