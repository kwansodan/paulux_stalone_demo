import { test } from "@playwright/test"
import { installOverlay, say, beat, clearCaption } from "../helpers/overlay"
import { click, type, scroll } from "../helpers/ui"

/**
 * "Your clients book themselves"
 *
 * The public journey — no login. For a salon owner this is usually the most
 * persuasive clip, because it shows what THEIR clients would experience.
 *
 * Selectors here were taken from the running demo, not guessed.
 */
test("customer books online", async ({ page }) => {
  await installOverlay(page)

  // ── The shopfront ────────────────────────────────────────────────────────
  await page.goto("/")
  await beat(page, 1200)
  await say(page, "Your salon, open for bookings around the clock")

  await scroll(page, 700)
  await say(page, "Every service, with prices and deposits shown up front")
  await scroll(page, 700)
  await clearCaption(page)

  // ── Step 1: their details ────────────────────────────────────────────────
  await page.goto("/customer/booking")
  await beat(page, 1000)
  await say(page, "Booking takes four steps. First, who they are.")

  await type(page, page.getByPlaceholder("Ama mensah"), "Akosua Danso")
  await type(page, page.getByPlaceholder("ama@example.com"), "akosua@example.com")
  await type(page, page.getByPlaceholder("0584943029"), "0244000000")
  await beat(page, 700)

  await click(page, page.getByRole("button", { name: "Continue" }))

  // ── Step 2: what they want ───────────────────────────────────────────────
  await say(page, "Then the service they want")
  await click(page, page.getByRole("button", { name: "Add services" }))
  await beat(page, 900)

  await say(page, "Sixteen services, searchable and grouped by category", 2000)
  await type(page, page.getByPlaceholder("Search services..."), "Knotless")
  await beat(page, 1100)

  // Searching narrows the list to a single row, so this Add is unambiguous.
  await click(page, page.getByRole("button", { name: "Add", exact: true }))
  await beat(page, 900)

  const closeList = page.getByRole("button", { name: "Close list" })
  if (await closeList.isVisible().catch(() => false)) {
    await click(page, closeList)
  }

  await say(page, "Four hours, GHS 400 — the slot is reserved to match", 2200)
  await click(page, page.getByRole("button", { name: "Continue" }))

  // ── Step 3: when ─────────────────────────────────────────────────────────
  await say(page, "Only real openings are offered — no double bookings")
  await beat(page, 1000)

  // Pick a day a little ahead, then the first time still free that day.
  const day = page.getByRole("button", { name: /^\d{1,2}$/ }).nth(18)
  if (await day.isVisible().catch(() => false)) {
    await click(page, day)
    await beat(page, 800)
  }

  const slot = page.getByRole("button", { name: /^\d{2}:\d{2}$/ }).first()
  if (await slot.isVisible().catch(() => false)) {
    await click(page, slot)
    await beat(page, 900)
  }

  await click(page, page.getByRole("button", { name: "Continue" }))

  // ── Step 4: confirm ──────────────────────────────────────────────────────
  // Deliberately stops short of submitting. Recording a real booking every
  // time would litter the demo with rows named after a fictional client.
  await beat(page, 1200)
  await say(page, "A deposit is taken before the chair is held", 2600)
  await scroll(page, 400)
  await say(page, "Card, mobile money — or cash on arrival", 2600)
  await clearCaption(page)
  await beat(page, 1200)
})
