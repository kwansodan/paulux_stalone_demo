"use client"

import { useState } from "react"
import Modal from "@/components/modal"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookingWithService } from "../../types"
import { useGetStaff } from "@/features/staff/client/use-staff"
import { useAssignStylist } from "@/features/staff/client/use-staff"
import { Scissors, UserX } from "lucide-react"

type Props = {
  booking: BookingWithService
  open: boolean
  onClose: () => void
}

const UNASSIGN_VALUE = "__unassign__"

export default function AssignStylistModal({ booking, open, onClose }: Props) {
  const { data: staff = [], isLoading } = useGetStaff()
  const assignMutation = useAssignStylist()

  const [selected, setSelected] = useState<string>(
    booking.assignedTo?.id ?? UNASSIGN_VALUE
  )

  const handleSave = async () => {
    const stylistId = selected === UNASSIGN_VALUE ? null : selected
    await assignMutation.mutateAsync({ bookingId: booking.id, stylistId })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Stylist"
      subtitle={`${booking.clientName} · ${booking.services.map(s => s.service.name).join(", ")}`}
      childrenClassName="max-h-[280px]"
      showSeparator={false}
    >
      <div className="space-y-4 py-2">
        {isLoading ? (
          <p className="text-sm text-gray-500 text-center py-4">Loading stylists...</p>
        ) : staff.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <Scissors className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-sm text-gray-500">No stylists found.</p>
            <p className="text-xs text-gray-400">Add staff members from the Staff page first.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Select stylist</label>
            <Select value={selected} onValueChange={setSelected}>
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
                {staff.map((s) => (
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
        )}

        {staff.length > 0 && (
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
              {assignMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
