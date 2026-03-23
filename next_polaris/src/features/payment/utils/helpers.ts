import { BookingWithServiceAndPayment } from "@/features/booking/types";
import { PaymentStatus } from "../types";




export function calculatePaymentStatus(booking: BookingWithServiceAndPayment): PaymentStatus {
  if (!booking.payments?.length) {
    return PaymentStatus.PENDING;
  }

  // Filter for PAID payments only for summing
  const paidPayments = booking.payments.filter(p => p.status === PaymentStatus.PAID);

  if (paidPayments.length === 0) {
    const statuses = booking.payments.map(p => p.status);
    if (statuses.includes(PaymentStatus.FAILED)) return PaymentStatus.FAILED;
    if (statuses.includes(PaymentStatus.REFUNDED)) return PaymentStatus.REFUNDED;
    return PaymentStatus.PENDING;
  }

  const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalPrice = booking.services.reduce((sum, s) => sum + Number(s.priceAtBooking), 0);

  if (totalPaid >= totalPrice) {
    return PaymentStatus.PAID;
  }

  if (totalPaid > 0) {
    return PaymentStatus.PARTIAL;
  }

  return PaymentStatus.PENDING;
}
