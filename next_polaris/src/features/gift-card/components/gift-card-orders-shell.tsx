"use client"

import { useState } from "react"
import { Gift, Search, CircleX, Mail, MessageSquare, Send, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Modal from "@/components/modal"
import { useGetGiftCards, useCancelGiftCard } from "../client/use-gift-cards"
import { SerializedGiftCard } from "../types"

interface GiftCardOrdersShellProps {
  initialGiftCards: SerializedGiftCard[]
}

const STATUS_STYLES: Record<string, string> = {
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-700",
  ACTIVE: "bg-green-100 text-green-700",
  PARTIALLY_REDEEMED: "bg-blue-100 text-blue-700",
  REDEEMED: "bg-gray-100 text-gray-500",
  EXPIRED: "bg-orange-100 text-orange-600",
  CANCELLED: "bg-red-100 text-red-600",
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "Pending payment",
  ACTIVE: "Active",
  PARTIALLY_REDEEMED: "Partially redeemed",
  REDEEMED: "Fully redeemed",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
}

const DELIVERY_ICONS: Record<string, React.ReactNode> = {
  EMAIL: <Mail className="w-3.5 h-3.5" />,
  SMS: <MessageSquare className="w-3.5 h-3.5" />,
  BOTH: <Send className="w-3.5 h-3.5" />,
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[status] || "bg-gray-100 text-gray-500"}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export default function GiftCardOrdersShell({ initialGiftCards }: GiftCardOrdersShellProps) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>("ALL")
  const [cancelTarget, setCancelTarget] = useState<SerializedGiftCard | null>(null)

  const { data: giftCards = initialGiftCards, isFetching } = useGetGiftCards({
    search: search.trim() || undefined,
    status: status !== "ALL" ? status : undefined,
  })
  const cancelMutation = useCancelGiftCard()

  return (
    <div className="space-y-6">
      {/* Header / filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <p className="text-sm text-gray-500">View and manage gift cards purchased by customers</p>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by code, sender, recipient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 bg-white border-[#E2E8F0] rounded-lg shadow-none"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-48 h-10 bg-white">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="PENDING_PAYMENT">Pending payment</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PARTIALLY_REDEEMED">Partially redeemed</SelectItem>
              <SelectItem value="REDEEMED">Fully redeemed</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Empty state */}
      {!isFetching && giftCards.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
          <Gift className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-semibold text-lg">No gift cards yet</p>
          <p className="text-gray-400 text-sm mt-1">Gift cards purchased by customers will appear here.</p>
        </div>
      )}

      {/* Gift cards list */}
      {giftCards.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {giftCards.map((gc) => {
            const canCancel = gc.status !== "REDEEMED" && gc.status !== "CANCELLED"
            const redemptions = gc.redemptions || []

            return (
              <Card key={gc.id} className="rounded-3xl border shadow-none hover:shadow-md transition-shadow duration-200 overflow-hidden">
                <CardContent className="p-5 space-y-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-lg text-gray-900 tracking-wide">{gc.code}</span>
                        <StatusBadge status={gc.status} />
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-fuchsia-100 text-fuchsia-700 px-2 py-0.5 rounded-full">
                          {DELIVERY_ICONS[gc.deliveryMethod]}
                          {gc.deliveryMethod}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">Purchased {formatDate(gc.createdAt)}</p>
                    </div>
                    {canCancel && (
                      <button
                        onClick={() => setCancelTarget(gc)}
                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors text-red-500 flex-shrink-0"
                        title="Cancel gift card"
                      >
                        <CircleX className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Sender / Recipient */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400">From</p>
                      <p className="text-sm font-semibold text-gray-700 truncate">{gc.senderName}</p>
                      <p className="text-xs text-gray-500 truncate">{gc.senderEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">To</p>
                      <p className="text-sm font-semibold text-gray-700 truncate">{gc.recipientName}</p>
                      <p className="text-xs text-gray-500 truncate">{gc.recipientEmail || gc.recipientPhone || "-"}</p>
                    </div>
                  </div>

                  {/* Items — only legacy item-based gift cards carry these */}
                  {gc.items.length > 0 && (
                    <div className="pt-2 border-t border-gray-100 space-y-1">
                      {gc.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-xs text-gray-600">
                          <span className="truncate pr-2">{item.name} {item.quantity > 1 ? `x${item.quantity}` : ""}</span>
                          <span className="flex-shrink-0">GHS {(Number(item.unitPrice) * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Balance */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Total value</p>
                      <p className="text-sm font-semibold text-gray-700">GHS {Number(gc.totalAmount).toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">Remaining balance</p>
                      <p className="text-sm font-semibold text-gray-700">GHS {Number(gc.balance).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Redemption history */}
                  {redemptions.length > 0 && (
                    <div className="pt-2 border-t border-gray-100 space-y-1.5">
                      <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5" />
                        Redemption history
                      </p>
                      {redemptions.map((r) => (
                        <div key={r.id} className="flex justify-between text-xs text-gray-600">
                          <span className="truncate pr-2">
                            {formatDate(r.createdAt)}{r.bookingId ? ` · Booking #${r.bookingId.slice(-6).toUpperCase()}` : ""}
                          </span>
                          <span className="flex-shrink-0 font-medium text-green-600">- GHS {Number(r.amountApplied).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {gc.message && (
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-400">Message</p>
                      <p className="text-xs text-gray-600 italic line-clamp-2">"{gc.message}"</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Cancel confirm */}
      <Modal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel Gift Card?"
        subtitle={`Are you sure you want to cancel gift card "${cancelTarget?.code}"? The remaining balance will no longer be redeemable. This cannot be undone.`}
        childrenClassName="max-h-56 w-[500px]"
        showSeparator={false}
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setCancelTarget(null)}>Back</Button>
          <Button
            className="bg-[#D10505] hover:bg-[#D10505]/90"
            disabled={cancelMutation.isPending}
            onClick={async () => {
              if (cancelTarget) {
                await cancelMutation.mutateAsync(cancelTarget.id)
                setCancelTarget(null)
              }
            }}
          >
            {cancelMutation.isPending ? "Cancelling..." : "Cancel Gift Card"}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
