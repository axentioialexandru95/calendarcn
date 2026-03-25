import { expect, test, type Locator } from "@playwright/test"

test.describe("calendar interactions", () => {
  test("switches views and navigates on the dedicated lab fixture", async ({
    page,
  }) => {
    await page.goto("/calendar-lab")

    const currentLabel = page.getByTestId("calendar-current-label")
    const initialLabel = await currentLabel.textContent()

    await page.getByTestId("calendar-nav-next").click()
    await expect(currentLabel).not.toHaveText(initialLabel ?? "")

    await page.getByTestId("calendar-nav-previous").click()
    await expect(currentLabel).toHaveText(initialLabel ?? "")

    await page.getByTestId("calendar-view-day").click()
    await expect(page.getByTestId("calendar-event-focus-time-grid")).toBeVisible()

    await page.getByTestId("calendar-view-agenda").click()
    await expect(page.getByTestId("calendar-event-planning-agenda")).toBeVisible()

    await page.getByTestId("calendar-view-month").click()
    await expect(page.getByTestId("calendar-event-planning-month")).toBeVisible()
  })

  test("opens the create sheet and creates an appointment", async ({
    page,
  }) => {
    await page.goto("/calendar-lab")

    await page.getByTestId("calendar-toolbar-create").click()

    const sheet = page.getByTestId("calendar-create-sheet")
    await expect(sheet).toBeVisible()

    await sheet.getByLabel("Title").fill("Playwright planning")
    await sheet.getByLabel("Location").fill("Remote")
    await sheet.getByTestId("calendar-create-sheet-submit").click()

    await expect(
      page.getByRole("button", { name: /Playwright planning\./i })
    ).toBeVisible()
  })

  test("duplicates an event from the context menu", async ({ page }) => {
    await page.goto("/calendar-lab")

    const handoffEvent = page.getByTestId("calendar-event-handoff-time-grid")
    await expect(handoffEvent).toBeVisible()

    await openContextMenu(handoffEvent)
    await expect(page.getByTestId("calendar-event-context-menu")).toBeVisible()
    await page.keyboard.press("Enter")

    await expect(
      page.getByRole("button", { name: /Support handoff\./i })
    ).toHaveCount(2)
  })

  test("archives an event from the context menu", async ({ page }) => {
    await page.goto("/calendar-lab")

    const handoffEvent = page.getByTestId("calendar-event-handoff-time-grid")
    await expect(handoffEvent).toBeVisible()

    await openContextMenu(handoffEvent)
    await expect(page.getByTestId("calendar-event-context-menu")).toBeVisible()
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")

    await expect(page.getByTestId("calendar-event-handoff-time-grid")).toHaveCount(
      0
    )
  })

  test("blocks timed keyboard moves that overlap unavailable ranges", async ({
    page,
  }) => {
    await page.goto("/calendar-lab")

    const focusEvent = page.getByTestId("calendar-event-focus-time-grid")
    await expect(focusEvent).toBeVisible()

    await focusEvent.focus()
    await page.keyboard.press("ArrowUp")

    await expect(focusEvent).toHaveAttribute("aria-label", /13:00 - 15:00/i)
    await expect(page.getByTestId("calendar-live-announcement")).toHaveText(
      /Blocked time is unavailable\./i
    )
  })

  test("deletes an event from the context menu", async ({ page }) => {
    await page.goto("/calendar-lab")

    const planningEvent = page.getByTestId("calendar-event-planning-time-grid")
    await expect(planningEvent).toBeVisible()

    await openContextMenu(planningEvent)
    await expect(page.getByTestId("calendar-event-context-menu")).toBeVisible()
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")

    await expect(page.getByTestId("calendar-event-planning-time-grid")).toHaveCount(
      0
    )
  })

  test("resizes an event through the keyboard path without a stale intermediate state", async ({
    page,
  }) => {
    await page.goto("/calendar-lab")

    const focusEvent = page.getByTestId("calendar-event-focus-time-grid")
    await expect(focusEvent).toBeVisible()

    await focusEvent.focus()
    await page.keyboard.press("Shift+ArrowDown")

    await expect(focusEvent).toHaveAttribute("aria-label", /13:00 - 15:30/i)
  })

  test("confirms keyboard-driven event moves when confirmation is enabled", async ({
    page,
  }) => {
    await page.goto("/calendar-lab/confirm")

    const planningEvent = page.getByTestId("calendar-event-planning-time-grid")
    await expect(planningEvent).toBeVisible()

    await planningEvent.focus()
    await page.keyboard.press("ArrowUp")

    const dialog = page.getByTestId(
      "calendar-event-change-confirmation-dialog"
    )
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText("Planning review")

    await page.getByTestId("calendar-event-change-confirm").click()

    await expect(planningEvent).toHaveAttribute("aria-label", /14:30 - 16:00/i)
  })

  test("selects only the targeted recurring occurrence", async ({ page }) => {
    await page.goto("/calendar-lab/recurrence")

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
})

async function openContextMenu(locator: Locator) {
  const box = await locator.boundingBox()

  if (!box) {
    throw new Error("Unable to determine context menu coordinates.")
  }

  await locator.dispatchEvent("contextmenu", {
    bubbles: true,
    button: 2,
    cancelable: true,
    clientX: box.x + box.width / 2,
    clientY: box.y + box.height / 2,
  })
}
