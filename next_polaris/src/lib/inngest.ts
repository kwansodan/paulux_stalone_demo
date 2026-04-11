import { EventSchemas, Inngest } from "inngest";

export type BookingCancelEventArgs = {
  data: {
    bookingId: string;
  }
}

export type BookingCreatedEventArgs = {
  data: {
    bookingId: string;
  }
}

export type PasswordResetEventArgs = {
  data: {
    userId: string;
  }
}

export type PaymentReceivedEventArgs = {
  data: {
    bookingId: string;
    amountPaid: number;
    provider: string;
  };
};

type Events = {
  "app/password.password-reset": PasswordResetEventArgs;
  "app/booking.booking-cancel": BookingCancelEventArgs;
  "app/booking.booking-created": BookingCreatedEventArgs;
  "app/payment.payment-received": PaymentReceivedEventArgs;
};

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "polarisbeautylounge.com",
  schemas: new EventSchemas().fromRecord<Events>(),
});
