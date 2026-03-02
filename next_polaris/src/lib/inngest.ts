import type { BookingCancelEventArgs } from "@/features/auth/events/event-booking-cancel";
import type { PasswordResetEventArgs } from "@/features/auth/events/event-password-reset";
import type { PaymentReceivedEventArgs } from "@/features/payment/events/event-payment-received";
import { EventSchemas, Inngest } from "inngest";

type Events = {
  "app/password.password-reset": PasswordResetEventArgs;
  "app/booking.booking-cancel": BookingCancelEventArgs;
  "app/payment.payment-received": PaymentReceivedEventArgs;
};

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "app.ishmaelsroadstonextapp.com",
  schemas: new EventSchemas().fromRecord<Events>(),
});
