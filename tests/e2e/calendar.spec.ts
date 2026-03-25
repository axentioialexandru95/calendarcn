import { expect, test } from "@playwright/test"

test.describe("calendar interactions", () => {
  test("opens the create sheet and creates an appointment", async ({
    page,
  }) => {
    await page.goto("/calendar-lab")

    await page.getByTestId("calendar-toolbar-create").click()

    const sheet = page.getByTestId("calendar-create-sheet")
    await expect(sheet).toBeVisible()

    await sheet.getByLabel("Title").fill("Playwright planning")
    await sheet.getByLabel("Location").fill("Remote")
    await sheet
      .getByRole("button", { exact: true, name: "Create appointment" })
      .click()

    await expect(
      page.getByRole("button", { name: /Playwright planning\./i })
    ).toBeVisible()
  })

  test("archives an event from the context menu", async ({ page }) => {
    await page.goto("/calendar-lab")

    const handoffEvent = page.getByTestId("calendar-event-handoff-time-grid")

    await expect(handoffEvent).toBeVisible()
    await handoffEvent.dispatchEvent("contextmenu", {
      bubbles: true,
      button: 2,
      cancelable: true,
      clientX: 200,
      clientY: 200,
    })

    const menu = page.getByTestId("calendar-event-context-menu")
    await expect(menu).toBeVisible()

    await page.keyboard.press("ArrowDown")
    await page.keyboard.press("Enter")

    await expect(page.getByTestId("calendar-event-handoff-time-grid")).toHaveCount(
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

    await dialog.getByRole("button", { name: "Apply change" }).click()

    await expect(planningEvent).toHaveAttribute("aria-label", /14:30 - 16:00/i)
  })
})
