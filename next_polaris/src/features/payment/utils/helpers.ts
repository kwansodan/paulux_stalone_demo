import { BookingWithServiceAndPayment } from "@/features/booking/types";
import { PaymentStatus } from "../types";




export function calculatePaymentStatus(booking: BookingWithServiceAndPayment): PaymentStatus {
  if (!booking.payments?.length) {
    return PaymentStatus.PENDING;
  }

  const statuses = booking.payments.map(p => p.status);

  // Priority order: PAID > PARTIAL > PENDING > REFUNDED > FAILED
  if (statuses.every(s => s === PaymentStatus.PAID)) {
    return PaymentStatus.PAID;
  }
  if (statuses.includes(PaymentStatus.PAID)) {
    return PaymentStatus.PENDING; // Incomplete
  }
  if (statuses.every(s => s === PaymentStatus.PARTIAL)) {
    return PaymentStatus.PARTIAL;
  }
  if (statuses.includes(PaymentStatus.PARTIAL)) {
    return PaymentStatus.PARTIAL;
  }
  if (statuses.every(s => s === PaymentStatus.REFUNDED)) {
    return PaymentStatus.REFUNDED;
  }
  if (statuses.includes(PaymentStatus.FAILED)) {
    return PaymentStatus.FAILED;
  }

  return PaymentStatus.PENDING;
}
