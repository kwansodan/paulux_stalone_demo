import { inngest } from "@/lib/inngest"
import { bookingRepository } from "@/features/booking/server/booking.repository"
import { sendBookingUpdatedEmail } from "../emails/send-booking-updated-email"
import { sendSMS } from "@/lib/arkesal"
import { formatDate, formatTime } from "@/features/booking/utils/helpers"
import { customerBookingSummaryPath } from "@/app/paths"
import { getBaseUrl } from "@/utils/url"

type LineItem = { id: string; name: string; quantity: number }

function diffLineItems(previous: LineItem[], current: LineItem[], label: string): string[] {
  const lines: string[] = []

  const added = current.filter(c => !previous.some(p => p.id === c.id))
  const removed = previous.filter(p => !current.some(c => c.id === p.id))
  const quantityChanged = current.filter(c => {
    const prev = previous.find(p => p.id === c.id)
    return prev && prev.quantity !== c.quantity
  })

  if (added.length > 0) {
    lines.push(`Added ${label}: ${added.map(i => i.quantity > 1 ? `${i.name} x${i.quantity}` : i.name).join(", ")}`)
  }
  if (removed.length > 0) {
    lines.push(`Removed ${label}: ${removed.map(i => i.quantity > 1 ? `${i.name} x${i.quantity}` : i.name).join(", ")}`)
  }
  for (const item of quantityChanged) {
    const prevQty = previous.find(p => p.id === item.id)!.quantity
    lines.push(`${item.name} quantity changed from ${prevQty} to ${item.quantity}`)
  }

  return lines
}

export const bookingUpdatedEvent = inngest.createFunction(
  { id: "booking-updated" },
  { event: "app/booking.booking-updated" },
  async ({ event, step }) => {
    const { bookingId, previousServices, previousProducts, previousBookingDate, previousBookingTime } = event.data

    const booking = await step.run("fetch-booking", async () => {
      const b = await bookingRepository.findById(bookingId)
      if (!b) throw new Error(`Booking ${bookingId} not found`)
      return b
    })

    const currentServices: LineItem[] = booking.services.map(s => ({
      id: s.serviceId,
      name: s.service.name,
      quantity: (s as any).quantity ?? 1,
    }))
    const currentProducts: LineItem[] = (booking.products ?? []).map(p => ({
      id: p.productId,
      name: p.product.name,
      quantity: p.quantity ?? 1,
    }))

    const changeSummary: string[] = [
      ...diffLineItems(previousServices, currentServices, "service(s)"),
      ...diffLineItems(previousProducts, currentProducts, "product(s)"),
    ]

    if (previousBookingDate !== booking.bookingDate) {
      changeSummary.push(`Date changed to ${formatDate(booking.bookingDate)}`)
    }
    if (previousBookingTime !== booking.bookingTime) {
      changeSummary.push(`Time changed to ${formatTime(booking.bookingTime)}`)
    }

    // Nothing actually changed (e.g. admin saved without modifying anything) — don't notify.
    if (changeSummary.length === 0) {
      return { bookingId, notified: false, reason: "no_changes" }
    }

    const dateFormatted = formatDate(booking.bookingDate)
    const timeFormatted = formatTime(booking.bookingTime)
    const summaryUrl = getBaseUrl() + customerBookingSummaryPath(bookingId)

    let emailResult = null
    if (booking.clientEmail) {
      emailResult = await step.run("send-update-email", async () => {
        const result = await sendBookingUpdatedEmail(
          booking.clientEmail!,
          booking.clientName,
          booking.bookingReference,
          changeSummary,
          dateFormatted,
          timeFormatted,
          summaryUrl,
        )
        if (result.error) {
          console.error("Failed to send booking update email:", result.error)
        }
        return result
      })
    }

    let smsResult = null
    if (booking.clientPhone) {
      smsResult = await step.run("send-update-sms", async () => {
        const message = `Hi ${booking.clientName}, your booking (${booking.bookingReference}) has been updated: ${changeSummary.join("; ")}. Date: ${dateFormatted} at ${timeFormatted}. View details: ${summaryUrl}`

        const result = await sendSMS({
          recipients: [booking.clientPhone!],
          message,
        })

        if (!result?.success) {
          console.error("Failed to send booking update SMS:", result)
        }
        return result
      })
    }

    return {
      bookingId,
      notified: true,
      changeSummary,
      emailStatus: booking.clientEmail ? (emailResult?.data?.id ? "sent" : "failed") : "no_email",
      smsStatus: smsResult?.success ? "sent" : (booking.clientPhone ? "failed" : "no_phone"),
    }
  }
)
