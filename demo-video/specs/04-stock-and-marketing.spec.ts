import { test } from "@playwright/test"
import { installOverlay, say, beat, clearCaption } from "../helpers/overlay"
import { click, navigate, scroll } from "../helpers/ui"
import { signIn } from "../helpers/auth"

/**
 * "More than a calendar"
 *
 * The differentiator clip. Consumables costing per section, retail stock,
 * promo codes and gift cards are what a generic booking app doesn't have —
 * and they're the reason a salon owner would pay for this rather than use a
 * shared Google Calendar.
 */
test("stock and marketing", async ({ page }) => {
  await installOverlay(page)
  await signIn(page)

  // ── Retail stock ─────────────────────────────────────────────────────────
  await navigate(page, "Products")
  await page.waitForURL(/\/products/)
  await beat(page, 1400)

  await say(page, "Sell retail alongside services")
  await scroll(page, 400)
  // The seed keeps one product under its threshold so this is always visible.
  await say(page, "Stock counts down as you sell, and warns you before it's gone", 3000)
  await clearCaption(page)

  // ── Consumables ──────────────────────────────────────────────────────────
  await navigate(page, "Materials")
  await page.waitForURL(/\/materials/)
  await beat(page, 1400)

  await say(page, "Track what gets used up, not just what gets sold", 2800)
  await scroll(page, 400)
  await say(page, "Relaxer, developer, gloves — issued to Hair, Nails or Barber", 3000)
  await say(page, "So you know what each section actually costs to run", 3000)
  await clearCaption(page)

  // ── Marketing ────────────────────────────────────────────────────────────
  await navigate(page, "Promo Codes")
  await page.waitForURL(/\/promo-codes/)
  await beat(page, 1400)

  await say(page, "Run a promotion, and see what it actually cost you", 2800)
  await scroll(page, 350)
  await clearCaption(page)

  await navigate(page, "Gift Cards")
  await page.waitForURL(/\/gift-card/)
  await beat(page, 1400)

  await say(page, "Sell gift cards. Balances tracked to the last cedi.", 2800)
  await scroll(page, 350)
  await clearCaption(page)
  await beat(page, 1200)
})
