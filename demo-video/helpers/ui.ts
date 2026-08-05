import type { Locator, Page } from "@playwright/test"

/**
 * Scroll a target to the middle of the viewport before touching it.
 *
 * scrollIntoViewIfNeeded won't move anything that is technically visible, which
 * includes elements sitting underneath the fixed caption strip at the bottom of
 * the screen — the booking form's Continue button being the obvious case.
 * Forcing centre keeps every interaction clear of the caption and puts the
 * action where the eye already is.
 */
async function centre(locator: Locator): Promise<void> {
  await locator.evaluate((el) =>
    el.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" as ScrollBehavior })
  )
  await locator.page().waitForTimeout(250)
}

/**
 * Click wrapper that moves the drawn cursor to the target first.
 *
 * Calling locator.click() directly teleports the real pointer, so the overlay
 * cursor jumps and the viewer never sees what was aimed at. Moving in steps
 * makes the intent legible.
 */
export async function click(page: Page, locator: Locator, settleMs = 350): Promise<void> {
  await centre(locator)
  const box = await locator.boundingBox()

  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 24 })
    await page.waitForTimeout(settleMs)
  }

  await locator.click()
}

/** Type at a human pace, with the cursor parked on the field. */
export async function type(
  page: Page,
  locator: Locator,
  text: string,
  delay = 55
): Promise<void> {
  await centre(locator)
  const box = await locator.boundingBox()
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 18 })
  }
  await locator.click()
  await locator.pressSequentially(text, { delay })
}

/**
 * Scroll down in a way that reads as scrolling rather than jumping, so long
 * pages (reports, dashboards) can be shown in one shot.
 */
export async function scroll(page: Page, distance = 600, steps = 14): Promise<void> {
  const per = Math.round(distance / steps)
  for (let i = 0; i < steps; i += 1) {
    await page.mouse.wheel(0, per)
    await page.waitForTimeout(45)
  }
  await page.waitForTimeout(400)
}
