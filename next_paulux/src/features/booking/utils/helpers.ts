import { User } from "@generated/prisma/client";
import { BookingWithService } from "../types";


export function isPastSlot(date: Date, time: string) {
  const [h, m] = time.split(":").map(Number)

  const slot = new Date(date)
  slot.setHours(h, m, 0, 0)

  return slot.getTime() < Date.now()
}


export function getMinBookingDate(): string {
  const now = new Date()
  const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  return minDate.toISOString().split("T")[0]
}


export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
) {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  };

  const finalOptions = options ? { ...defaultOptions, ...options } : defaultOptions;

  return new Date(date).toLocaleDateString('en-US', finalOptions);
}



export function formatTime(time24: string) {
  // Parse the time string (e.g., "14:00")
  const [hours, minutes] = time24.split(':').map(Number);

  // Determine AM or PM
  const period = hours >= 12 ? 'PM' : 'AM';

  // Convert to 12-hour format
  const hours12 = hours % 12 || 12;

  // Format with leading zero for minutes
  const formattedMinutes = String(minutes).padStart(2, '0');

  return `${hours12}:${formattedMinutes} ${period}`;
}


export function isBookingOwner(booking: BookingWithService, user: User): boolean {
  if (user.role === 'ADMIN' || user.role === 'STAFF') return true

  if (!booking || !booking.createdById) return false

  if (booking.createdById !== user.id) return false

  return true
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Distinct human-readable payment-method labels for a booking, derived from its
 * PAID payments plus any gift-card redemptions. Returns [] when nothing is paid.
 */
export function getPaymentMethodLabels(booking: any): string[] {
  const labels: string[] = []

  const paidPayments = (booking?.payments ?? []).filter((p: any) => p.status === "PAID")
  for (const p of paidPayments) {
    if (p.provider === "MANUAL") {
      labels.push(p.manualMethod?.name ?? "Cash")
    } else {
      const channel = p.rawPayload?.data?.channel
      labels.push(channel === "card" ? "Card" : channel === "mobile_money" ? "Mobile Money" : "Paystack")
    }
  }

  if (booking?.giftCardRedemptions?.length) {
    labels.push("Gift card")
  }

  return Array.from(new Set(labels))
}

/** Total gift-card value applied to a booking (0 when none). */
export function getGiftCardApplied(booking: any): number {
  return (booking?.giftCardRedemptions ?? []).reduce(
    (sum: number, r: any) => sum + Number(r.amountApplied || 0),
    0
  )
}

/**
 * Gross value of items booked: services + products, with NO discount applied.
 * Use this for displaying "value of items"; use calculateBookingTotal for the
 * net amount the customer actually owes (which subtracts the promo discount).
 */
export function calculateBookingSubtotal(booking: any): number {
  if (!booking) return 0;

  const servicesTotal = booking.services?.reduce((sum: number, s: any) => {
    return sum + (Number(s.priceAtBooking) * (s.quantity || 1));
  }, 0) || 0;

  const productsTotal = booking.products?.reduce((sum: number, p: any) => {
    return sum + (Number(p.priceAtBooking) * (p.quantity || 1));
  }, 0) || 0;

  return servicesTotal + productsTotal;
}

export function calculateBookingTotal(booking: any): number {
  if (!booking) return 0;

  const servicesTotal = booking.services?.reduce((sum: number, s: any) => {
    return sum + (Number(s.priceAtBooking) * (s.quantity || 1));
  }, 0) || 0;

  const productsTotal = booking.products?.reduce((sum: number, p: any) => {
    return sum + (Number(p.priceAtBooking) * (p.quantity || 1));
  }, 0) || 0;

  const discount = Number(booking.discountAmount || 0);

  return Math.max(0, (servicesTotal + productsTotal) - discount);
}