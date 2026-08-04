import { Step } from "./components/customer/booking/step-indicator";

export const SESSION_COOKIE_NAME = "session";
export const SESSION_REFRESH_INTERVAL_MS = 1000 * 60 * 60 * 24 * 15; // 15 days
export const SESSION_MAX_DURATION_MS = SESSION_REFRESH_INTERVAL_MS * 2; // 30 days

export const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
export const BOOKING_STEPS: Step[] = [
  { number: 1, label: "Details" },
  { number: 2, label: "Service" },
  { number: 3, label: "Date & time" },
  { number: 4, label: "Confirm" },
]