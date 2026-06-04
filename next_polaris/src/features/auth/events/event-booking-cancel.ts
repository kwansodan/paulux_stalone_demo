import { inngest } from "@/lib/inngest"
import { customerBookingSummaryPath } from "@/app/paths"
import { bookingRepository } from "@/features/booking/server/booking.repository"
import { getBaseUrl } from "@/utils/url"
import { sendBookingCancelEmail } from "@/features/booking/emails/send-booking-cancel-email"
import { sendSMS } from "@/lib/arkesal"
import { formatDate, formatTime } from "@/features/booking/utils/helpers"

export const bookingCancelledEvent = inngest.createFunction(
  { id: "booking-cancel" },
  { event: "app/booking.booking-cancel" },
  async ({ event, step }) => {
    const { bookingId } = event.data

    const booking = await step.run("fetch-booking", async () => {
      const b = await bookingRepository.findById(bookingId)
      if (!b) throw new Error(`Booking ${bookingId} not found`)
      return b
    })

    const serviceNames = booking.services.map(s => s.service.name).join(", ")
    const dateFormatted = formatDate(booking.bookingDate)
    const timeFormatted = formatTime(booking.bookingTime)
    const bookingSummaryLink = getBaseUrl() + customerBookingSummaryPath(bookingId)

    // Send cancellation email (skip gracefully if no email — walk-in customers)
    let emailResult = null
    if (booking.clientEmail) {
      emailResult = await step.run("send-cancellation-email", async () => {
        const result = await sendBookingCancelEmail(
          booking.clientEmail!,
          booking.clientName,
          booking.bookingReference,
          serviceNames,
          dateFormatted,
          timeFormatted,
          bookingSummaryLink,
        )
        if (result.error) {
          console.error("Failed to send cancellation email:", result.error)
        }
        return result
      })
    }

    // Send cancellation SMS (always attempt if phone exists)
    let smsResult = null
    if (booking.clientPhone) {
      smsResult = await step.run("send-cancellation-sms", async () => {
        const message = `Hi ${booking.clientName}, your appointment for ${serviceNames} on ${dateFormatted} at ${timeFormatted} has been cancelled. View details: ${bookingSummaryLink}`

        const result = await sendSMS({
          recipients: [booking.clientPhone!],
          message,
        })

        if (!result?.success) {
          console.error("Failed to send cancellation SMS:", result)
        }
        return result
      })
    }

    return {
      bookingId,
      emailStatus: booking.clientEmail ? (emailResult?.data?.id ? "sent" : "failed") : "no_email",
      smsStatus: smsResult?.success ? "sent" : (booking.clientPhone ? "failed" : "no_phone"),
    }
  }
)
