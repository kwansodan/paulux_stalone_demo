"use client"

import { useState } from "react"
import Modal from "@/components/modal"
import { Button } from "@/components/ui/button"
import { BookingWithService } from "../../types"
import { calculateBookingTotal } from "../../utils/helpers"
import { useGetManualPaymentMethods } from "@/features/payment/client/use-manual-payment-methods"
import { Loader2 } from "lucide-react"

type Props = {
  booking: BookingWithService
  open: boolean
  onClose: () => void
  onConfirm: (amount: number, methodId: string) => void
  isPending: boolean
}

export default function RecordPaymentModal({ booking, open, onClose, onConfirm, isPending }: Props) {
  const totalPrice = calculateBookingTotal(booking)
  const totalPaid = (booking as any).payments
    ?.filter((p: any) => p.status === "PAID")
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0) ?? 0
  const remainingBalance = Math.max(0, totalPrice - totalPaid)

  const [amount, setAmount] = useState<string>(remainingBalance.toFixed(2))
  const [methodId, setMethodId] = useState<string>("")
  const [error, setError] = useState<string>("")

  const { data: methods = [], isLoading: methodsLoading } = useGetManualPaymentMethods()
  const activeMethods = methods.filter((m) => m.isActive)

  const handleConfirm = () => {
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) {
      setError("Enter a valid amount greater than 0")
      return
    }
    if (parsed > remainingBalance) {
      setError(`Cannot exceed outstanding balance of GHS ${remainingBalance.toFixed(2)}`)
      return
    }
    if (!methodId) {
      setError("Select a payment method")
      return
    }
    setError("")
    onConfirm(parsed, methodId)
  }

  const isPartial = parseFloat(amount) < remainingBalance && parseFloat(amount) > 0

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record Payment"
      subtitle={`${booking.clientName} · ${booking.services.map(s => s.service.name).join(", ")}`}
      childrenClassName="max-h-[480px]"
      showSeparator={false}
    >
      <div className="space-y-4 py-2">
        {/* Payment breakdown */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="bg-white rounded-xl p-3">
            <p className="text-gray-500 text-xs mb-1">Total</p>
            <p className="font-semibold text-gray-900">GHS {totalPrice.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl p-3">
            <p className="text-gray-500 text-xs mb-1">Paid</p>
            <p className="font-semibold text-emerald-700">GHS {totalPaid.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl p-3">
            <p className="text-gray-500 text-xs mb-1">Outstanding</p>
            <p className="font-semibold text-fuchsia-700">GHS {remainingBalance.toFixed(2)}</p>
          </div>
        </div>

        {/* Payment method selector */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Payment method</label>
          {methodsLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading methods...
            </div>
          ) : activeMethods.length === 0 ? (
            <p className="text-xs text-amber-600 py-1">
              No payment methods configured. Add them in App Settings → Payment Methods.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeMethods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => { setMethodId(m.id); setError("") }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    methodId === m.id
                      ? "bg-fuchsia-600 text-white border-fuchsia-600"
                      : "bg-white text-gray-700 border-gray-200 hover:border-fuchsia-400"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Amount input */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700">Amount received (GHS)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">GHS</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              max={remainingBalance}
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError("") }}
              className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          {isPartial && !error && (
            <p className="text-xs text-amber-600">
              Partial payment — GHS {(remainingBalance - parseFloat(amount)).toFixed(2)} will remain outstanding
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
            onClick={handleConfirm}
            disabled={isPending || activeMethods.length === 0}
          >
            {isPending ? "Recording..." : "Record Payment"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
