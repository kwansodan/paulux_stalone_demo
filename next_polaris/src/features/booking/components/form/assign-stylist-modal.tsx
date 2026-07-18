"use client"

import { useState } from "react"
import Modal from "@/components/modal"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookingWithService } from "../../types"
import { useGetStylists } from "@/features/staff/client/use-staff"
import { useAssignServiceStylists } from "@/features/staff/client/use-staff"
import { Scissors, UserX } from "lucide-react"

type Props = {
  booking: BookingWithService
  open: boolean
  onClose: () => void
}

const UNASSIGN_VALUE = "__unassign__"

export default function AssignStylistModal({ booking, open, onClose }: Props) {
  // Server-filtered to stylists only (assignable staff).
  const { data: stylists = [], isLoading } = useGetStylists()
  const assignMutation = useAssignServiceStylists()

  // Initialise from current per-service assignments
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const bs of booking.services) {
      init[bs.serviceId] = (bs as any).assignedTo?.id ?? UNASSIGN_VALUE
    }
    return init
  })

  const handleChange = (serviceId: string, value: string) => {
    setSelections(prev => ({ ...prev, [serviceId]: value }))
  }

  const handleSave = async () => {
    const assignments = booking.services.map(bs => ({
      serviceId: bs.serviceId,
      stylistId: selections[bs.serviceId] === UNASSIGN_VALUE ? null : (selections[bs.serviceId] ?? null),
    }))
    await assignMutation.mutateAsync({ bookingId: booking.id, assignments })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Stylists"
      subtitle={`${booking.clientName} · ${booking.bookingDate}`}
      childrenClassName="max-h-[420px]"
      showSeparator={false}
    >
      <div className="space-y-5 py-2">
        {isLoading ? (
          <p className="text-sm text-gray-500 text-center py-4">Loading stylists...</p>
        ) : stylists.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <Scissors className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-sm text-gray-500">No stylists found.</p>
            <p className="text-xs text-gray-400">Add a staff member marked as a stylist from App Settings first.</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500">
              Assign a stylist to each service. Stylists with a phone number will receive an SMS notification.
            </p>

            {booking.services.map(bs => (
              <div key={bs.serviceId} className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">{bs.service.name}</label>
                <Select
                  value={selections[bs.serviceId] ?? UNASSIGN_VALUE}
                  onValueChange={v => handleChange(bs.serviceId, v)}
                >
                  <SelectTrigger className="h-11 bg-white border-[#E2E8F0] rounded-lg shadow-none">
                    <SelectValue placeholder="Choose a stylist..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNASSIGN_VALUE}>
                      <span className="flex items-center gap-2 text-gray-500">
                        <UserX className="w-4 h-4" />
                        Unassigned
                      </span>
                    </SelectItem>
                    {stylists.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        <span className="flex items-center gap-2">
                          <Scissors className="w-4 h-4 text-fuchsia-500" />
                          {s.username}
                          {s.phone && <span className="text-gray-400 text-xs">· {s.phone}</span>}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={assignMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
                onClick={handleSave}
                disabled={assignMutation.isPending}
              >
                {assignMutation.isPending ? "Saving..." : "Save assignments"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
