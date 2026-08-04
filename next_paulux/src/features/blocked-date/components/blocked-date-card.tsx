"use client"

import { BlockedDate } from "@generated/prisma/client"
import { Trash2 } from "lucide-react"
import { useDeleteBlockedDate } from "../client/use-blocked-date"
import { useState } from "react"
import Modal from "@/components/modal"
import { Button } from "@/components/ui/button"

export default function BlockedDateRow({ date }: { date: BlockedDate }) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const deleteBlockedDateMutation = useDeleteBlockedDate()

  return (
    <div className="flex justify-between items-center bg-gray-100 rounded-xl p-4">
      <div>
        <p className="font-medium text-sm">
          {new Date(date.date).toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        {date.reason && (
          <p className="text-sm text-muted-foreground">{date.reason}</p>
        )}
      </div>

      <button
        onClick={() => setIsDeleteModalOpen(true)}
        className="text-red-500 hover:text-red-600"
      >
        <Trash2 size={18} />
      </button>

      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Blocked Date?"
        subtitle="Are you sure you want to delete this blocked date?"
        childrenClassName="max-h-[224px] w-[500px]"
        showSeparator={false}
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button className="bg-[#D10505] hover:bg-[#D10505]/90" type="button" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => deleteBlockedDateMutation.mutateAsync(date.date.toString())} disabled={deleteBlockedDateMutation.isPending} >
            {deleteBlockedDateMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
