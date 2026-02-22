"use client"

import { CircleCheck, CircleX, MoreVertical, PencilLine, CreditCard } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BookingWithService } from "../types"
import { formatTime, isBookingOwner } from "../utils/helpers"
import { User } from "@generated/prisma/client"
import { useMarkAsCompleted, useChargeCustomer } from "../client/hooks/use-booking"

type BookingCardProps = {
  booking: BookingWithService
  user: User
  onEdit: (bookingId: string) => void
  onCancel: (bookingId: string) => void
}

export default function BookingCard({ booking, user, onEdit, onCancel }: BookingCardProps) {
  const markAsCompletedMutation = useMarkAsCompleted()
  const chargeCustomer = useChargeCustomer()
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
              ${booking.paymentStatus === "PAID" && "border bg-emerald-50 text-emerald-800 border-emerald-800"}
              ${booking.paymentStatus === "PARTIAL" && "border bg-sky-50 text-sky-700 border-sky-700"}
              ${booking.paymentStatus === "PENDING" && "border bg-orange-50 text-orange-700 border-orange-700"}
              ${booking.paymentStatus === "FAILED" && "border bg-rose-50 text-rose-700 border-rose-700"}
            `}>
            <span>{booking.paymentStatus}</span>
          </div>
        </div>
        <p className="font-medium text-sm text-gray-900">{booking.clientName}</p>
        <p className="text-sm text-gray-500">
          {booking.service.name}
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
          {booking.status !== 'COMPLETED' && (<DropdownMenuItem onClick={() => markAsCompletedMutation.mutate(booking.id)} className="flex gap-2 text-green-600">
            <CircleCheck className="text-green-600" />
            <span className="w-full">Mark as completed</span>
          </DropdownMenuItem>)}
          {booking.paymentStatus !== 'PAID' && (
            <DropdownMenuItem onClick={() => chargeCustomer.mutate(booking.id)} className="flex gap-2 text-fuchsia-600">
              <CreditCard className="text-fuchsia-600" />
              <span className="w-full">Charge customer</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => onCancel(booking.id)} className="flex gap-2 text-red-600">
            <CircleX className="text-red-600" />
            <span className="w-full">Cancel order</span>

          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

    </div >
  )
}
