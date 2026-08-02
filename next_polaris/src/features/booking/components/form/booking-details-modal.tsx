"use client"

import Modal from "@/components/modal"
import { Scissors, Package, Tag, Gift, Wallet } from "lucide-react"
import { BookingWithService } from "../../types"
import {
  calculateBookingTotal,
  formatDate,
  formatTime,
  getGiftCardApplied,
  getPaymentMethodLabels,
} from "../../utils/helpers"
import { calculatePaymentStatus } from "@/features/payment/utils/helpers"

type Props = {
  booking: BookingWithService
  open: boolean
  onClose: () => void
}

const money = (n: number) => `GHS ${n.toFixed(2)}`

export default function BookingDetailsModal({ booking, open, onClose }: Props) {
  if (!booking) return null

  const services = booking.services ?? []
  const products = booking.products ?? []
  const payments = booking.payments ?? []

  const servicesTotal = services.reduce(
    (sum, s: any) => sum + Number(s.priceAtBooking) * (s.quantity || 1),
    0
  )
  const productsTotal = products.reduce(
    (sum, p: any) => sum + Number(p.priceAtBooking) * (p.quantity || 1),
    0
  )
  const subtotal = servicesTotal + productsTotal
  const discount = Number(booking.discountAmount || 0)
  const giftCardApplied = getGiftCardApplied(booking)
  const total = calculateBookingTotal(booking)

  const paidPayments = payments.filter((p) => p.status === "PAID")
  const amountPaid = paidPayments.reduce((sum, p) => sum + Number(p.amount), 0)
  const balanceDue = Math.max(0, total - amountPaid)

  const paymentStatus = calculatePaymentStatus(booking)
  const methodLabels = getPaymentMethodLabels(booking)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Booking details"
      childrenClassName="max-h-[70vh] space-y-4"
      showSeparator
    >
      {/* Header */}
      <div className="rounded-xl bg-white p-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-mono text-gray-500">{booking.bookingReference}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium leading-tight border
              ${booking.status === "COMPLETED" && "bg-lime-50 text-lime-800 border-lime-800"}
              ${booking.status === "CONFIRMED" && "bg-blue-50 text-blue-800 border-blue-800"}
              ${booking.status === "PENDING" && "bg-yellow-50 text-yellow-700 border-yellow-700"}
              ${booking.status === "CANCELLED" && "bg-red-50 text-red-700 border-red-700"}
            `}
          >
            {booking.status}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium leading-tight border
              ${paymentStatus === "PAID" && "bg-emerald-50 text-emerald-800 border-emerald-800"}
              ${paymentStatus === "PARTIAL" && "bg-sky-50 text-sky-700 border-sky-700"}
              ${paymentStatus === "PENDING" && "bg-orange-50 text-orange-700 border-orange-700"}
              ${paymentStatus === "FAILED" && "bg-rose-50 text-rose-700 border-rose-700"}
            `}
          >
            {paymentStatus}
          </span>
        </div>
        <div className="text-sm text-gray-700">
          {formatDate(booking.bookingDate)} · {formatTime(booking.bookingTime)}
        </div>
        <div className="text-sm text-gray-900 font-medium">{booking.clientName}</div>
        <div className="text-xs text-gray-500">
          {booking.clientPhone}
          {booking.clientEmail ? ` · ${booking.clientEmail}` : ""}
        </div>
        {booking.assignedTo?.username && (
          <div className="text-xs text-fuchsia-600">Stylist: {booking.assignedTo.username}</div>
        )}
        <div className="text-xs text-fuchsia-400">
          {booking.createdById ? "Created by admin" : "Created by client"}
        </div>
      </div>

      {/* Services */}
      {services.length > 0 && (
        <div className="rounded-xl bg-white p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Services</p>
          <div className="space-y-2">
            {services.map((bs: any) => {
              const qty = bs.quantity || 1
              const unit = Number(bs.priceAtBooking)
              const stylist = bs.assignedTo?.username
              return (
                <div key={bs.serviceId} className="flex items-start justify-between gap-3 text-sm">
                  <div className="flex items-start gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-fuchsia-300 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-gray-800">{bs.service.name}</span>
                      {qty > 1 && <span className="text-gray-400"> × {qty}</span>}
                      {stylist ? (
                        <span className="block text-xs text-fuchsia-600">→ {stylist}</span>
                      ) : (
                        <span className="block text-xs text-gray-400 italic">unassigned</span>
                      )}
                    </div>
                  </div>
                  <span className="text-gray-700 whitespace-nowrap">{money(unit * qty)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Products */}
      {products.length > 0 && (
        <div className="rounded-xl bg-white p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Products</p>
          <div className="space-y-2">
            {products.map((bp: any) => {
              const qty = bp.quantity || 1
              const unit = Number(bp.priceAtBooking)
              return (
                <div key={bp.productId} className="flex items-start justify-between gap-3 text-sm">
                  <div className="flex items-start gap-1.5">
                    <Package className="w-3.5 h-3.5 text-fuchsia-300 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-gray-800">{bp.product.name}</span>
                      {qty > 1 && <span className="text-gray-400"> × {qty}</span>}
                    </div>
                  </div>
                  <span className="text-gray-700 whitespace-nowrap">{money(unit * qty)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="rounded-xl bg-white p-4 space-y-1.5 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{money(subtotal)}</span>
        </div>
        {booking.promoCode && (
          <div className="flex justify-between text-fuchsia-600">
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> Promo · {booking.promoCode.code}
            </span>
            {discount > 0 && <span>-{money(discount)}</span>}
          </div>
        )}
        {discount > 0 && !booking.promoCode && (
          <div className="flex justify-between text-gray-600">
            <span>Discount</span>
            <span>-{money(discount)}</span>
          </div>
        )}
        {giftCardApplied > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span className="flex items-center gap-1">
              <Gift className="w-3.5 h-3.5" /> Gift card applied
            </span>
            <span>-{money(giftCardApplied)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-fuchsia-700 pt-1.5 border-t border-gray-100">
          <span>Total</span>
          <span>{money(total)}</span>
        </div>
      </div>

      {/* Payments */}
      <div className="rounded-xl bg-white p-4 space-y-2 text-sm">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1">
          <Wallet className="w-3.5 h-3.5" /> Payments
        </p>
        {methodLabels.length > 0 && (
          <p className="text-xs text-gray-500">Mode: {methodLabels.join(", ")}</p>
        )}
        {payments.length === 0 ? (
          <p className="text-gray-400">No payments recorded.</p>
        ) : (
          <div className="space-y-1.5">
            {payments.map((p: any) => {
              const label =
                p.provider === "MANUAL"
                  ? p.manualMethod?.name ?? "Cash"
                  : p.rawPayload?.data?.channel === "card"
                    ? "Card"
                    : p.rawPayload?.data?.channel === "mobile_money"
                      ? "Mobile Money"
                      : "Paystack"
              return (
                <div key={p.id} className="flex items-center justify-between gap-3">
                  <div className="text-gray-700">
                    {label}
                    <span className="text-xs text-gray-400">
                      {" "}· {new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-800">{money(Number(p.amount))}</span>
                    <span
                      className={`text-[10px] font-medium ${
                        p.status === "PAID" ? "text-emerald-600" : p.status === "FAILED" ? "text-rose-600" : "text-gray-400"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div className="flex justify-between pt-1.5 border-t border-gray-100 text-gray-600">
          <span>Amount paid</span>
          <span className="text-lime-700">{money(amountPaid)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Balance due</span>
          <span className={balanceDue === 0 ? "text-gray-600" : "text-[#D10505]"}>
            {balanceDue === 0 ? "Settled" : money(balanceDue)}
          </span>
        </div>
      </div>
    </Modal>
  )
}
