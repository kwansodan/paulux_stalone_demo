"use client"

import { useState } from "react"
import Modal from "@/components/modal"
import { Button } from "@/components/ui/button"
import { BookingWithService } from "../../types"
import { calculatePaymentStatus } from "@/features/payment/utils/helpers"

type Props = {
  booking: BookingWithService
  open: boolean
  onClose: () => void
  onConfirm: (amount: number) => void
  isPending: boolean
}

export default function ChargeCustomerModal({ booking, open, onClose, onConfirm, isPending }: Props) {
  const totalPrice = booking.services.reduce((sum, s) => sum + Number(s.priceAtBooking), 0)
  const totalPaid = (booking as any).payments
    ?.filter((p: any) => p.status === "PAID")
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0) ?? 0
  const remainingBalance = totalPrice - totalPaid

  const [amount, setAmount] = useState<string>(remainingBalance.toFixed(2))
  const [error, setError] = useState<string>("")

  const handleConfirm = () => {
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) {
      setError("Enter a valid amount greater than 0")
      return
    }
    if (parsed > remainingBalance) {
      setError(`Cannot exceed remaining balance of GHS ${remainingBalance.toFixed(2)}`)
      return
    }
    setError("")
    onConfirm(parsed)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Charge Customer"
      subtitle={`${booking.clientName} · ${booking.services.map(s => s.service.name).join(", ")}`}
      childrenClassName="max-h-[300px]"
      showSeparator={false}
    >
      <div className="space-y-4 py-2">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white rounded-xl p-3">
            <p className="text-gray-500 text-xs mb-1">Total price</p>
            <p className="font-semibold text-gray-900">GHS {totalPrice.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl p-3">
            <p className="text-gray-500 text-xs mb-1">Remaining balance</p>
            <p className="font-semibold text-fuchsia-700">GHS {remainingBalance.toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Amount to charge (GHS)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">GHS</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              max={remainingBalance}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value)
                setError("")
              }}
              className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <p className="text-xs text-gray-500">
            You can charge any amount up to GHS {remainingBalance.toFixed(2)}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Processing..." : "Charge"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
