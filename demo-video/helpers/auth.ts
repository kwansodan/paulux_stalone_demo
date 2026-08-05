import type { Page } from "@playwright/test"
import { click, type } from "./ui"
import { say, beat } from "./overlay"

/**
 * Signs in to the demo as the shared demo account.
 *
 * Credentials come from the environment — the same DEMO_LOGIN_EMAIL /
 * DEMO_LOGIN_PASSWORD the app already uses — and are never committed.
 *
 * Note this deliberately bypasses the OTP demo gate. A side effect worth
 * knowing: the browser therefore never receives the signed `demo_lead` cookie,
 * so /api/demo-activity ignores it and recording cannot pollute the real lead
 * analytics with robot page views.
 */
export async function signIn(page: Page, narrate = true): Promise<void> {
  const email = process.env.DEMO_LOGIN_EMAIL
  const password = process.env.DEMO_LOGIN_PASSWORD

  if (!email || !password) {
    throw new Error(
      "DEMO_LOGIN_EMAIL and DEMO_LOGIN_PASSWORD must be set. " +
        "See demo-video/README.md — never hardcode them in a spec."
    )
  }

  await page.goto("/login")

  // The page has TWO forms: the staff login and the "New here?" demo-access
  // gate, and both use the placeholder "enter email". Scope by the form that
  // contains the Sign in button so this keeps working as that page changes.
  const form = page.locator("form").filter({
    has: page.getByRole("button", { name: /sign in/i }),
  })

  if (narrate) await say(page, "Staff sign in", 1600)

  await type(page, form.getByPlaceholder("enter email"), email)
  await type(page, form.locator('input[type="password"]'), password, 40)
  await click(page, form.getByRole("button", { name: /sign in/i }))

  await page.waitForURL(/\/(dashboard|stylist)/, { timeout: 30_000 })
  await beat(page, 1200)
}
