// Remembers a customer's details on this device so repeat visitors don't
// have to retype their name/email/phone on every booking. Best-effort only —
// guarded against SSR (no window) and storage being unavailable/disabled.

const STORAGE_KEY = "polaris_customer_details"

export type SavedCustomerDetails = {
  fullName: string
  email: string
  phone: string
}

export function getSavedCustomerDetails(): SavedCustomerDetails | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.fullName && !parsed?.email && !parsed?.phone) return null
    return parsed
  } catch {
    return null
  }
}

export function saveCustomerDetails(details: SavedCustomerDetails) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(details))
  } catch {
    // Private browsing / storage disabled — fine to silently skip.
  }
}
