import {
  expect,
  test,
  type Browser,
  type CDPSession,
  type Locator,
} from "@playwright/test"

const baseUrl = "http://127.0.0.1:3000"
const touchPointerId = 7

test.describe("calendar mobile touch interactions", () => {
  test.beforeEach(({ browserName }) => {
    test.skip(
      browserName !== "chromium",
      "Touch gesture regression coverage uses pointer event dispatch."
    )
  })

  test("selects an event from a touch tap without moving it", async ({
    browser,
  }) => {
    const { context, page } = await createMobilePage(browser)

    try {
      const focusEvent = page.getByTestId("calendar-event-focus-time-grid")
      const point = await getLocatorPoint(focusEvent)

      await dispatchTouchPointerDown(focusEvent, point)
      await dispatchTouchPointerEvent(focusEvent, "pointerup", point)

      await expect(focusEvent).toHaveAttribute("data-selected", "true")
      await expect(focusEvent).toHaveAttribute("aria-label", /13:00 - 15:00/i)
    } finally {
      await context.close()
    }
  })

  test("moves a timed event through the touch drag path", async ({
    browser,
  }) => {
    const { context, page } = await createMobilePage(browser)

    try {
      const standupEvent = page.getByTestId("calendar-event-standup-time-grid")
      const startPoint = await getLocatorPoint(standupEvent, {
        x: "center",
        y: "top",
      })
      const targetSlot = await getDayGrid(page, 1)
        .locator('[data-calendar-drop-target-minute="480"]')
        .first()

      await dispatchTouchPointerDown(standupEvent, startPoint)
      await page.waitForTimeout(50)
      const targetPoint = await getLocatorPoint(targetSlot)
      await dispatchTouchPointerEvent(targetSlot, "pointermove", targetPoint)
      await page.waitForTimeout(50)
      await dispatchWindowPointer(page, "pointerup", targetPoint)

      await expect(standupEvent).toHaveAttribute("aria-label", /08:00 - 08:30/i)
    } finally {
      await context.close()
    }
  })

  test("resizes a timed event through the touch handle path", async ({
    browser,
  }) => {
    const { context, page } = await createMobilePage(browser)

    try {
      const standupEvent = page.getByTestId("calendar-event-standup-time-grid")
      const eventPoint = await getLocatorPoint(standupEvent)

      await dispatchTouchPointerDown(standupEvent, eventPoint)
      await dispatchTouchPointerEvent(standupEvent, "pointerup", eventPoint)
      await expect(standupEvent).toHaveAttribute("data-selected", "true")

      const resizeHandle = page.getByTestId(
        "calendar-resize-handle-standup-end"
      )
      await expect(resizeHandle).toBeVisible()
      const startPoint = await getLocatorPoint(resizeHandle)
      const targetSlot = await getDayGrid(page, 1)
        .locator('[data-calendar-drop-target-minute="570"]')
        .first()

      await dispatchTouchPointerDown(resizeHandle, startPoint)
      await page.waitForTimeout(50)
      const targetPoint = await getLocatorPoint(targetSlot)
      await dispatchTouchPointerEvent(targetSlot, "pointermove", targetPoint)
      await page.waitForTimeout(50)
      await dispatchWindowPointer(page, "pointerup", targetPoint)

      await expect(standupEvent).toHaveAttribute("aria-label", /09:00 - 10:00/i)
    } finally {
      await context.close()
    }
  })

  test("requires a long press before touch creation activates", async ({
    browser,
  }) => {
    const { context, page } = await createMobilePage(browser)

    try {
      const mondayGrid = getDayGrid(page, 0)
      const startSlot = mondayGrid
        .locator('[data-calendar-drop-target-minute="540"]')
        .first()
      const startPoint = await getLocatorPoint(startSlot)
      const movePoint = {
        x: startPoint.x,
        y: startPoint.y + 28,
      }

      await dispatchTouchPointerDown(startSlot, startPoint)
      await page.waitForTimeout(120)
      await dispatchTouchPointerEvent(startSlot, "pointermove", movePoint)
      await page.waitForTimeout(50)
      await dispatchTouchPointerEvent(startSlot, "pointerup", movePoint)
      await page.waitForTimeout(260)

      await expect(page.getByTestId("calendar-create-sheet")).toHaveCount(0)
    } finally {
      await context.close()
    }
  })

  test("opens the create flow after a long-press touch drag on an empty slot", async ({
    browser,
  }) => {
    const { context, page } = await createMobilePage(browser)

    try {
      const mondayGrid = getDayGrid(page, 0)
      const startSlot = mondayGrid
        .locator('[data-calendar-drop-target-minute="540"]')
        .first()
      const endSlot = mondayGrid
        .locator('[data-calendar-drop-target-minute="600"]')
        .first()
      const startPoint = await getLocatorPoint(startSlot)

      await dispatchTouchPointerDown(startSlot, startPoint)
      await page.waitForTimeout(450)
      const endPoint = await getLocatorPoint(endSlot)
      await dispatchTouchPointerEvent(endSlot, "pointermove", endPoint)
      await page.waitForTimeout(50)
      await dispatchTouchPointerEvent(endSlot, "pointerup", endPoint)

      const sheet = page.getByTestId("calendar-create-sheet")
      await expect(sheet).toBeVisible()
      await expect(page.locator("#calendar-create-start-time")).toHaveValue(
        "09:00"
      )
      await expect(page.locator("#calendar-create-end-time")).toHaveValue(
        "10:30"
      )
    } finally {
      await context.close()
    }
  })

  test("opens the create flow after a real mobile touch drag on an empty slot", async ({
    browser,
  }) => {
    const { context, page } = await createRealTouchMobilePage(browser)

    try {
      const mondayGrid = getDayGrid(page, 0)
      const startSlot = mondayGrid
        .locator('[data-calendar-drop-target-minute="390"]')
        .first()
      const endSlot = mondayGrid
        .locator('[data-calendar-drop-target-minute="450"]')
        .first()
      const startPoint = await getLocatorPoint(startSlot)
      const endPoint = await getLocatorPoint(endSlot)
      const cdp = await context.newCDPSession(page)

      await dispatchRealTouchEvent(cdp, "touchStart", startPoint)
      await page.waitForTimeout(450)
      await dispatchRealTouchEvent(cdp, "touchMove", endPoint)
      await page.waitForTimeout(50)
      await dispatchRealTouchEvent(cdp, "touchEnd")

      const sheet = page.getByTestId("calendar-create-sheet")
      await expect(sheet).toBeVisible()
    } finally {
      await context.close()
    }
  })
})

function getDayGrid(
  page: Awaited<ReturnType<typeof createMobilePage>>["page"],
  index: number
) {
  return page.locator('[role="grid"]').nth(index)
}

async function createMobilePage(browser: Browser) {
  const context = await browser.newContext({
    viewport: {
      height: 844,
      width: 390,
    },
  })
  const page = await context.newPage()

  await page.goto(`${baseUrl}/calendar-lab`)
  await expect(page.getByTestId("calendar-root")).toBeVisible()
  await waitForCalendarLabReady(page)

  return {
    context,
    page,
  }
}

async function createRealTouchMobilePage(browser: Browser) {
  const context = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: {
      height: 844,
      width: 390,
    },
  })
  const page = await context.newPage()

  await page.goto(`${baseUrl}/calendar-lab`)
  await expect(page.getByTestId("calendar-root")).toBeVisible()
  await waitForCalendarLabReady(page)

  return {
    context,
    page,
  }
}

async function waitForCalendarLabReady(
  page: Awaited<ReturnType<typeof createMobilePage>>["page"]
) {
  await expect(
    page.locator('[data-calendar-lab-ready="true"]')
  ).toBeVisible()
}

async function getLocatorPoint(
  locator: Locator,
  options: {
    x?: "center" | "left"
    y?: "center" | "top"
  } = {}
) {
  const box = await locator.boundingBox()

  if (!box) {
    throw new Error("Unable to determine touch coordinates.")
  }

  return {
    x: options.x === "left" ? box.x + 1 : box.x + box.width / 2,
    y: options.y === "top" ? box.y : box.y + box.height / 2,
  }
}

async function dispatchTouchPointerDown(
  locator: Locator,
  point: { x: number; y: number }
) {
  await locator.dispatchEvent("pointerdown", {
    bubbles: true,
    button: 0,
    buttons: 1,
    cancelable: true,
    clientX: point.x,
    clientY: point.y,
    isPrimary: true,
    pointerId: touchPointerId,
    pointerType: "touch",
  })
}

async function dispatchTouchPointerEvent(
  locator: Locator,
  type: "pointercancel" | "pointermove" | "pointerup",
  point: { x: number; y: number }
) {
  await locator.dispatchEvent(type, {
    bubbles: true,
    button: 0,
    buttons: type === "pointermove" ? 1 : 0,
    cancelable: true,
    clientX: point.x,
    clientY: point.y,
    composed: true,
    isPrimary: true,
    pointerId: touchPointerId,
    pointerType: "touch",
  })
}

async function dispatchWindowPointer(
  page: Awaited<ReturnType<typeof createMobilePage>>["page"],
  type: "pointercancel" | "pointermove" | "pointerup",
  point: { x: number; y: number }
) {
  await page.evaluate(
    ({ point, pointerId, type }) => {
      window.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          button: 0,
          buttons: type === "pointermove" ? 1 : 0,
          cancelable: true,
          clientX: point.x,
          clientY: point.y,
          composed: true,
          isPrimary: true,
          pointerId,
          pointerType: "touch",
        })
      )
    },
    {
      point,
      pointerId: touchPointerId,
      type,
    }
  )
}

async function dispatchRealTouchEvent(
  cdp: CDPSession,
  type: "touchEnd" | "touchMove" | "touchStart",
  point?: { x: number; y: number }
) {
  await cdp.send("Input.dispatchTouchEvent", {
    type,
    touchPoints: point
      ? [{ x: point.x, y: point.y, radiusX: 2, radiusY: 2 }]
      : [],
  })
}
