import { BookingWithServiceAndPayment } from "@/features/booking/types";
import { PaymentStatus } from "../types";
import { calculateBookingTotal } from "@/features/booking/utils/helpers";

export function calculatePaymentStatus(booking: BookingWithServiceAndPayment): PaymentStatus {
  // A booking with nothing left to pay (e.g. fully covered by a promo discount)
  // is settled, even before any Payment row exists.
  if (calculateBookingTotal(booking) <= 0) return PaymentStatus.PAID;

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
  const totalPrice = calculateBookingTotal(booking);

  if (totalPaid >= totalPrice) {
    return PaymentStatus.PAID;
  }

  if (totalPaid > 0) {
    return PaymentStatus.PARTIAL;
  }

  return PaymentStatus.PENDING;
}
