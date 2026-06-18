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
    manualMethodName?: string;
  };
};

export type StylistAssignedEventArgs = {
  data: {
    bookingId: string;
    serviceId: string;
    stylistId: string;
  };
};

export type ProductLowStockEventArgs = {
  data: {
    productId: string;
    productName: string;
    currentStock: number;
    threshold: number;
    isOutOfStock: boolean;
  };
};

export type MaterialLowStockEventArgs = {
  data: {
    materialId: string;
    materialName: string;
    unit: string;
    currentStock: number;
    threshold: number;
    isOutOfStock: boolean;
  };
};

type Events = {
  "app/password.password-reset": PasswordResetEventArgs;
  "app/booking.booking-cancel": BookingCancelEventArgs;
  "app/booking.booking-created": BookingCreatedEventArgs;
  "app/payment.payment-received": PaymentReceivedEventArgs;
  "app/booking.stylist-assigned": StylistAssignedEventArgs;
  "app/product.low-stock": ProductLowStockEventArgs;
  "app/material.low-stock": MaterialLowStockEventArgs;
};

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "polarisbeautylounge.com",
  schemas: new EventSchemas().fromRecord<Events>(),
});
