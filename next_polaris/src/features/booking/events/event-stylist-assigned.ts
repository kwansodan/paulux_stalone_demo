import { inngest } from "@/lib/inngest"
import { prisma } from "@/lib/prisma"
import { sendSMS } from "@/lib/arkesal"
import { formatDate, formatTime } from "@/features/booking/utils/helpers"

export const stylistAssignedEvent = inngest.createFunction(
  { id: "stylist-assigned" },
  { event: "app/booking.stylist-assigned" },
  async ({ event, step }) => {
    const { bookingId, serviceId, stylistId } = event.data

    const data = await step.run("fetch-assignment-data", async () => {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          bookingReference: true,
          clientName: true,
          bookingDate: true,
          bookingTime: true,
        },
      })
      if (!booking) throw new Error(`Booking ${bookingId} not found`)

      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        select: { name: true },
      })

      const stylist = await prisma.user.findUnique({
        where: { id: stylistId },
        select: { username: true, phone: true },
      })

      return { booking, service, stylist }
    })

    const { booking, service, stylist } = data

    if (!stylist?.phone) {
      // Common cause of "no SMS": the stylist was created without a phone number.
      console.warn(
        `Stylist assignment SMS skipped — stylist ${stylistId} (${stylist?.username ?? "unknown"}) has no phone number on file. Booking ${booking.bookingReference}.`
      )
      return { status: "no_phone", stylistId }
    }

    const result = await step.run("send-assignment-sms", async () => {
      const date = formatDate(booking.bookingDate)
      const time = formatTime(booking.bookingTime)
      const message = `Hi ${stylist.username}, you have been assigned to ${booking.clientName}'s booking on ${date} at ${time} for ${service?.name ?? "a service"}. Ref: ${booking.bookingReference}.`

      const smsResult = await sendSMS({
        recipients: [stylist.phone!],
        message,
      })

      if (!smsResult?.success) {
        // sendSMS now reflects Arkesel's real outcome, so this surfaces the true
        // reason (unregistered sender, low balance, etc.) instead of a false "sent".
        console.error(
          `Failed to send stylist assignment SMS to ${stylist.username} (${stylist.phone}) for booking ${booking.bookingReference}:`,
          smsResult
        )
      }
      return smsResult
    })

    return {
      bookingId,
      serviceId,
      stylistId,
      smsStatus: result?.success ? "sent" : "failed",
    }
  }
)
