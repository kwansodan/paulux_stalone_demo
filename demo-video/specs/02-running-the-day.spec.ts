import { test } from "@playwright/test"
import { installOverlay, say, beat, clearCaption } from "../helpers/overlay"
import { click, navigate, scroll } from "../helpers/ui"
import { signIn } from "../helpers/auth"

/**
 * "Your front desk, on one screen"
 *
 * Navigation goes through the sidebar rather than page.goto, because seeing
 * the menu is part of the pitch — it shows how much the product covers.
 */
test("running the day", async ({ page }) => {
  await installOverlay(page)
  await signIn(page)

  // ── Dashboard ────────────────────────────────────────────────────────────
  await say(page, "Every morning starts here")
  await beat(page, 900)

  await say(page, "Today's takings, what's booked, what's still owed", 2600)
  await scroll(page, 450)
  await say(page, "Today's appointments, in order, with the stylist assigned", 2600)
  await scroll(page, 450)

  // The seed leaves one product under its threshold on purpose, so this
  // warning is always present in a freshly seeded demo.
  await say(page, "And it tells you when stock is running out", 2400)
  await clearCaption(page)

  // ── Bookings ─────────────────────────────────────────────────────────────
  await navigate(page, "Bookings")
  await page.waitForURL(/\/bookings/)
  await beat(page, 1400)

  await say(page, "Every booking — past, today, and ahead")
  await scroll(page, 400)
  await say(page, "Filter by day, status, or who it's assigned to", 2400)
  await clearCaption(page)
  await beat(page, 1000)

  // Open the first booking. Card layouts differ between breakpoints, so this
  // tries the obvious affordances and carries on if the row isn't clickable.
  const firstBooking = page
    .getByRole("button", { name: /view|details|open/i })
    .first()

  if (await firstBooking.isVisible().catch(() => false)) {
    await click(page, firstBooking)
    await beat(page, 1400)
    await say(page, "Services, payments and history in one place", 2600)
    await say(page, "Assign a stylist, take a payment, reschedule — from here", 2800)
    await clearCaption(page)

    const close = page.getByRole("button", { name: /close|cancel|×/i }).first()
    if (await close.isVisible().catch(() => false)) {
      await click(page, close)
    } else {
      await page.keyboard.press("Escape")
    }
    await beat(page, 900)
  }

  // ── Payments ─────────────────────────────────────────────────────────────
  await navigate(page, "Payments")
  await page.waitForURL(/\/payments/)
  await beat(page, 1400)

  await say(page, "Cash, mobile money and card — all recorded the same way", 2800)
  await scroll(page, 400)
  await say(page, "So the day's takings reconcile without a spreadsheet", 2800)
  await clearCaption(page)
  await beat(page, 1200)
})
