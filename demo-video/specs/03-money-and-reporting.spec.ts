import { test } from "@playwright/test"
import { installOverlay, say, beat, clearCaption } from "../helpers/overlay"
import { click, navigate, scroll } from "../helpers/ui"
import { signIn } from "../helpers/auth"

/**
 * "Know what you actually earned"
 *
 * Three of the ten reports defined in
 * next_paulux/src/features/report/reports-config.tsx. Showing all ten would
 * be tedious; three makes the point that the depth is there.
 */
const REPORTS: Array<{ title: RegExp; line: string }> = [
  { title: /revenue/i, line: "What was billed, discounted, collected — and what's still out" },
  { title: /outstanding/i, line: "Exactly who still owes you, and how much" },
  { title: /staff performance/i, line: "Which stylist brought in what" },
]

test("money and reporting", async ({ page }) => {
  await installOverlay(page)
  await signIn(page)

  await navigate(page, "Reports")
  await page.waitForURL(/\/reports/)
  await beat(page, 1400)

  await say(page, "Ten reports, ready to run — no exporting to Excel", 2800)
  await scroll(page, 420)
  await clearCaption(page)

  for (const report of REPORTS) {
    const link = page.getByRole("link", { name: report.title }).first()

    if (!(await link.isVisible().catch(() => false))) {
      // A report card that isn't a link on this breakpoint — skip rather than
      // fail, so one layout change doesn't cost the whole clip.
      continue
    }

    await click(page, link)
    await beat(page, 1600)
    await say(page, report.line, 3000)
    await scroll(page, 380)
    await beat(page, 900)
    await clearCaption(page)

    await page.goBack()
    await beat(page, 1100)
  }

  await say(page, "Pick any date range. The numbers follow.", 2600)
  await clearCaption(page)
  await beat(page, 1200)
})
