"use client"

import { useState } from "react"
import { CircleCheck, CircleX, MoreVertical, PencilLine, CreditCard, Scissors, Sparkles, MessageSquareHeart } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BookingWithService } from "../types"
import { calculateBookingTotal, formatTime, isBookingOwner } from "../utils/helpers"
import { User } from "@generated/prisma/client"
import { useMarkAsCompleted, useChargeCustomer, useMarkAsPaid, useRequestFeedback } from "../client/hooks/use-booking"
import { calculatePaymentStatus } from "@/features/payment/utils/helpers"
import ChargeCustomerModal from "./form/charge-customer-modal"
import AssignStylistModal from "./form/assign-stylist-modal"
import RecordPaymentModal from "./form/record-payment-modal"
import EditServicesModal from "./form/edit-services-modal"
import { SerializedService } from "@/features/service/types"
import { SerializedProduct } from "@/features/product/types"

type BookingCardProps = {
  booking: BookingWithService
  user: User
  services: SerializedService[]
  products: SerializedProduct[]
  onEdit: (bookingId: string) => void
  onCancel: (bookingId: string) => void
}

export default function BookingCard({ booking, user, services, products, onEdit, onCancel }: BookingCardProps) {
  const [chargeModalOpen, setChargeModalOpen] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false)
  const [editServicesOpen, setEditServicesOpen] = useState(false)
  const markAsCompletedMutation = useMarkAsCompleted()
  const chargeCustomer = useChargeCustomer()
  const markAsPaid = useMarkAsPaid()
  const requestFeedback = useRequestFeedback()
  const feedbackRequestedAt = (booking as any).feedbackRequestedAt as string | null | undefined

  const handleRequestFeedback = () => {
    const confirmed = feedbackRequestedAt
      ? window.confirm(`Feedback was already requested on ${new Date(feedbackRequestedAt).toLocaleDateString()}. Send again?`)
      : true
    if (confirmed) requestFeedback.mutate(booking.id)
  }
  const bookingPaymentStatus = calculatePaymentStatus(booking)
  const bookingTotal = calculateBookingTotal(booking)

  return (
    <div className="bg-gray-50 rounded-xl p-3 flex justify-between">

      <div>
        <div className="flex gap-2 items-center">
          <p className="font-semibold text-[16px] mr-1">
            {formatTime(booking.bookingTime)}
          </p>
          <div className={`px-2 py-0.5 flex justify-center items-center rounded-full text-[10px] font-medium leading-tight
              ${booking.status === "COMPLETED" && "border bg-lime-50 text-lime-800 border-lime-800"}
              ${booking.status === "CONFIRMED" && "border bg-blue-50 text-blue-800 border-blue-800"}
              ${booking.status === "PENDING" && "border bg-yellow-50 text-yellow-700 border-yellow-700"}
              ${booking.status === "CANCELLED" && "border bg-red-50 text-red-700 border-red-700"}
            `}>
            <span>{booking.status}</span>
          </div>
          <div className={`px-2 py-0.5 flex justify-center items-center rounded-full text-[10px] font-medium leading-tight
              ${bookingPaymentStatus === "PAID" && "border bg-emerald-50 text-emerald-800 border-emerald-800"}
              ${bookingPaymentStatus === "PARTIAL" && "border bg-sky-50 text-sky-700 border-sky-700"}
              ${bookingPaymentStatus === "PENDING" && "border bg-orange-50 text-orange-700 border-orange-700"}
              ${bookingPaymentStatus === "FAILED" && "border bg-rose-50 text-rose-700 border-rose-700"}
            `}>
            <span>{bookingPaymentStatus}</span>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <p className="font-medium text-sm text-gray-900">{booking.clientName}</p>
          <span className="px-0">|</span>
          <p className="font-medium text-sm text-gray-900">{booking.clientPhone}</p>
        </div>
        <div className="space-y-0.5 mt-0.5">
          {booking.services.map(bs => {
            const stylist = (bs as any).assignedTo
            return (
              <div key={bs.serviceId} className="flex items-center gap-1.5">
                <Scissors className="w-3 h-3 text-fuchsia-300 flex-shrink-0" />
                <span className="text-sm text-gray-600">{bs.service.name}</span>
                {stylist ? (
                  <span className="text-xs font-medium text-fuchsia-600 ml-1">→ {stylist.username}</span>
                ) : (
                  <span className="text-xs text-gray-400 italic ml-1">unassigned</span>
                )}
              </div>
            )
          })}
        </div>
        <p className="text-sm font-semibold text-fuchsia-700 mt-1">
          GHS {bookingTotal.toFixed(2)}
        </p>
        <p className="text-xs text-fuchsia-400">
          {booking.createdById ? "Created by admin" : "Created by client"}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-2 h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted">
            <MoreVertical size={18} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          {isBookingOwner(booking, user) && (
            <DropdownMenuItem onClick={() => onEdit(booking.id)} className="flex gap-2 text-gray-900">
              <PencilLine className="text-gray-900" />
              <span className="w-full">Edit</span>
            </DropdownMenuItem>
          )}

          {/* Edit Services */}
          {!['CANCELLED', 'COMPLETED'].includes(booking.status) && (
            <DropdownMenuItem onClick={() => setEditServicesOpen(true)} className="flex gap-2 text-fuchsia-600">
              <Sparkles className="text-fuchsia-600" />
              <span className="w-full">Edit Services</span>
            </DropdownMenuItem>
          )}

          {/* Assign Stylist — available for any non-cancelled/completed booking */}
          {!['CANCELLED', 'COMPLETED'].includes(booking.status) && (
            <DropdownMenuItem onClick={() => setAssignModalOpen(true)} className="flex gap-2 text-fuchsia-600">
              <Scissors className="text-fuchsia-600" />
              <span className="w-full">
                {booking.assignedTo ? "Reassign stylist" : "Assign stylist"}
              </span>
            </DropdownMenuItem>
          )}

          {!['CANCELLED', 'COMPLETED', 'PENDING'].includes(booking.status) && (
            <DropdownMenuItem onClick={() => markAsCompletedMutation.mutate(booking.id)} className="flex gap-2 text-green-600">
              <CircleCheck className="text-green-600" />
              <span className="w-full">Mark as completed</span>
            </DropdownMenuItem>
          )}

          {booking.status === 'COMPLETED' && (booking.clientEmail || booking.clientPhone) && (
            <DropdownMenuItem onClick={handleRequestFeedback} className="flex gap-2 text-pink-600">
              <MessageSquareHeart className="text-pink-600" />
              <span className="w-full">
                {feedbackRequestedAt ? "Resend feedback request" : "Request feedback"}
              </span>
            </DropdownMenuItem>
          )}

          {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && ['PENDING', 'PARTIAL', 'FAILED'].includes(bookingPaymentStatus) && (
            <DropdownMenuItem onClick={() => setChargeModalOpen(true)} className="flex gap-2 text-fuchsia-600">
              <CreditCard className="text-fuchsia-600" />
              <span className="w-full">Charge customer</span>
            </DropdownMenuItem>
          )}

          {(bookingPaymentStatus === 'PENDING' || bookingPaymentStatus === 'PARTIAL') && booking.status !== 'CANCELLED' && (
            <DropdownMenuItem onClick={() => setRecordPaymentOpen(true)} className="flex gap-2 text-blue-600">
              <CircleCheck className="text-blue-600" />
              <span className="w-full">Mark as paid</span>
            </DropdownMenuItem>
          )}

          {!['CANCELLED', 'COMPLETED'].includes(booking.status) && (
            <DropdownMenuItem onClick={() => onCancel(booking.id)} className="flex gap-2 text-red-600">
              <CircleX className="text-red-600" />
              <span className="w-full">Cancel order</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ChargeCustomerModal
        booking={booking}
        open={chargeModalOpen}
        onClose={() => setChargeModalOpen(false)}
        onConfirm={(amount) => chargeCustomer.mutate({ id: booking.id, amount })}
        isPending={chargeCustomer.isPending}
      />

      <AssignStylistModal
        booking={booking}
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
      />

      <RecordPaymentModal
        booking={booking}
        open={recordPaymentOpen}
        onClose={() => setRecordPaymentOpen(false)}
        onConfirm={(amount, methodId) => {
          markAsPaid.mutate({ id: booking.id, amount, methodId }, {
            onSuccess: () => setRecordPaymentOpen(false),
          })
        }}
        isPending={markAsPaid.isPending}
      />

      <EditServicesModal
        booking={booking}
        services={services}
        products={products}
        open={editServicesOpen}
        onClose={() => setEditServicesOpen(false)}
      />
    </div>
  )
}
