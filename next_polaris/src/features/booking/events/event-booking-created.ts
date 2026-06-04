import { inngest } from "@/lib/inngest"
import { bookingRepository } from "@/features/booking/server/booking.repository"
import { sendBookingConfirmedEmail } from "../emails/send-booking-confirmed-email"
import { sendWalkinWelcomeEmail } from "../emails/send-walkin-welcome-email"
import { sendSMS } from "@/lib/arkesal"
import { formatDate, formatTime } from "@/features/booking/utils/helpers"
import { customerBookingSummaryPath } from "@/app/paths"
import { getBaseUrl } from "@/utils/url"

const INSTAGRAM_HANDLE = "@polarisbeautylounge"

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

    const isWalkIn = booking.bookingType === "WALKIN"
    const serviceNames = booking.services.map(s => s.service.name)
    const serviceNamesJoined = serviceNames.join(", ")
    const dateFormatted = formatDate(booking.bookingDate)
    const timeFormatted = formatTime(booking.bookingTime)
    const summaryUrl = getBaseUrl() + customerBookingSummaryPath(bookingId)

    // ── Email ────────────────────────────────────────────────────────────────
    let emailResult = null
    if (booking.clientEmail) {
      emailResult = await step.run("send-confirmation-email", async () => {
        let result

        if (isWalkIn) {
          // Walk-in: warm welcome message
          result = await sendWalkinWelcomeEmail(
            booking.clientEmail!,
            booking.clientName,
            booking.bookingReference,
            serviceNames,
            summaryUrl,
          )
        } else {
          // Scheduled: standard booking confirmation
          result = await sendBookingConfirmedEmail(
            booking.clientEmail!,
            booking.clientName,
            booking.bookingReference,
            serviceNamesJoined,
            dateFormatted,
            timeFormatted,
            summaryUrl,
          )
        }

        if (result.error) {
          console.error("Failed to send booking confirmation email:", result.error)
        }
        return result
      })
    }

    // ── SMS ──────────────────────────────────────────────────────────────────
    let smsResult = null
    if (booking.clientPhone) {
      smsResult = await step.run("send-confirmation-sms", async () => {
        const message = isWalkIn
          ? `Welcome to Polaris! 🌟 We're so glad you're here, ${booking.clientName}. Today you'll be enjoying ${serviceNamesJoined}. Sit back and relax — you're in great hands! Any concerns? Find us on Instagram ${INSTAGRAM_HANDLE}`
          : `Hi ${booking.clientName}, your booking for ${serviceNamesJoined} on ${dateFormatted} at ${timeFormatted} has been received. Ref: ${booking.bookingReference}. View details: ${summaryUrl}`

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
      type: isWalkIn ? "walkin" : "scheduled",
      emailStatus: booking.clientEmail ? (emailResult?.data?.id ? "sent" : "failed") : "no_email",
      smsStatus: smsResult?.success ? "sent" : (booking.clientPhone ? "failed" : "no_phone"),
    }
  }
)
