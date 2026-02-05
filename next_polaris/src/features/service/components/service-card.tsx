"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CircleX, Clock, MoreHorizontal, PencilLine, Timer } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ToggleSwitch } from "./toggle-switch"
import { SerializedService } from "../types"
import { formatDuration, formatDurationShort } from "../utils/helpers"
import { useDeleteService, useUpdateStatus } from "../client/use-service"
import { useState } from "react"
import Modal from "@/components/modal"
import EditServiceForm from "./form/edit-service-form"
import { Button } from "@/components/ui/button"

export default function ServiceCard({ service }: { service: SerializedService }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  function handleServiceAction(action: 'edit' | 'delete') {
    if (action === 'edit') {
      setIsEditModalOpen(true)
    } else if (action === 'delete') {
      setIsDeleteModalOpen(true)
    }
  }

  const currencySymbol = service.currency === "GHS" ? "₵" : service.currency

  const updateStatusMutation = useUpdateStatus()
  const deleteServiceMutation = useDeleteService()
  return (
    <Card className="relative rounded-3xl border shadow-none p-0  max-w-87.5 max-h-37.5">
      <CardContent className="p-4 space-y-3">

        {/* Top row */}
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold">{service.name}</p>
            <p className="text-sm font-normal text-muted-foreground line-clamp-1">
              {service.description || "No Description" }
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className=" h-6 w-6 flex items-center justify-center rounded-full hover:bg-muted">
                <MoreHorizontal size={18} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleServiceAction('edit')} className="flex gap-2 text-gray-900">
                <PencilLine className="text-gray-900" />
                <span className="w-full">Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleServiceAction('delete')} className="flex gap-2 text-red-600">
                <CircleX className="text-red-600" />
                <span className="w-full">Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex justify-between items-center pt-2">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-1 gap-y-0 text-sm text-muted-foreground max-w-[65%]">
            <Timer className="h-4 w-4" />
            <span className="min-w-fit">{formatDurationShort(service.durationMinutes)}</span>
            <span>·</span>
            <span className="min-w-fit">
              {currencySymbol}{Number(service.price).toFixed(2)}
            </span>
          </div>

          {/* Bottom row */}
          <span className="flex items-center text-[11px] bg-fuchsia-200 px-2 py-0.5 rounded-xl whitespace-nowrap">
            {service.minDepositPercent}% deposit
          </span>


          <ToggleSwitch
            checked={service.isActive}
            onChecked={() => updateStatusMutation.mutateAsync({ id: service.id, status: true })}
            onUnchecked={() => updateStatusMutation.mutateAsync({ id: service.id, status: false })}
          />
        </div>
      </CardContent>
      <Modal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Service"
        childrenClassName="max-h-120"
        showSeparator={true}
      >
        <EditServiceForm
          service={service!}
          onCancel={() => setIsEditModalOpen(false)}
          onSuccess={() => setIsEditModalOpen(false)}
        />
      </Modal>
      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Service?"
        subtitle={`Are you sure you want to delete ${service.name}? This action cannot be undone. All bookings related to this service will be deleted.If there are existing bookings, consider deactivating instead.`}
        childrenClassName="max-h-[224px] w-[500px]"
        showSeparator={false}
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button className="bg-[#D10505] hover:bg-[#D10505]/90" type="button" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="outline"  onClick={() => deleteServiceMutation.mutate(service.id)} disabled={deleteServiceMutation.isPending} >
            {deleteServiceMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </Card>
  )
}
