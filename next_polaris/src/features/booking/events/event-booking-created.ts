import { inngest } from "@/lib/inngest"
import { bookingRepository } from "@/features/booking/server/booking.repository"
import { sendBookingConfirmedEmail } from "../emails/send-booking-confirmed-email"
import { sendSMS } from "@/lib/arkesal"
import { formatDate, formatTime } from "@/features/booking/utils/helpers"
import { customerBookingSummaryPath } from "@/app/paths"
import { getBaseUrl } from "@/utils/url"

export const bookingCreatedEvent = inngest.createFunction(
  { id: "booking-created" },
  { event: "app/booking.booking-created" },
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
    const summaryUrl = getBaseUrl() + customerBookingSummaryPath(bookingId)

    // Send confirmation email to customer (if email available)
    let emailResult = null
    if (booking.clientEmail) {
      emailResult = await step.run("send-confirmation-email", async () => {
        const result = await sendBookingConfirmedEmail(
          booking.clientEmail!,
          booking.clientName,
          booking.bookingReference,
          serviceNames,
          dateFormatted,
          timeFormatted,
          summaryUrl,
        )
        if (result.error) {
          console.error("Failed to send booking confirmation email:", result.error)
        }
        return result
      })
    }

    // Send confirmation SMS to customer (if phone available)
    let smsResult = null
    if (booking.clientPhone) {
      smsResult = await step.run("send-confirmation-sms", async () => {
        const message = `Hi ${booking.clientName}, your booking for ${serviceNames} on ${dateFormatted} at ${timeFormatted} has been received. Ref: ${booking.bookingReference}. View details: ${summaryUrl}`

        const result = await sendSMS({
          recipients: [booking.clientPhone!],
          message,
        })

        if (!result?.success) {
          console.error("Failed to send booking confirmation SMS:", result)
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
