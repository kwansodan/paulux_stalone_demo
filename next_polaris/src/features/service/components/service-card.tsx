"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CircleX, MoreHorizontal, PencilLine, Timer } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ToggleSwitch } from "./toggle-switch"
import { SerializedService } from "../types"
import { formatDurationShort } from "../utils/helpers"
import { useDeleteService, useUpdateStatus } from "../client/use-service"
import { useState } from "react"
import Modal from "@/components/modal"
import EditServiceForm from "./form/edit-service-form"
import { Button } from "@/components/ui/button"
import Image from "next/image"

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
    <Card className="relative rounded-3xl border shadow-none p-0 w-full overflow-hidden hover:shadow-md transition-shadow duration-200">
      {service.imageUrl && (
        <div className="relative w-full h-40">
          <Image
            src={service.imageUrl}
            alt={service.name}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      )}
      <CardContent className="p-4 space-y-3">

        {/* Top row */}
        <div className="flex justify-between items-start">
          <div>
            <p className="font-semibold text-lg">{service.name}</p>
            <p className="text-sm font-normal text-muted-foreground line-clamp-2">
              {service.description || "No Description"}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
                <MoreHorizontal size={18} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleServiceAction('edit')} className="flex gap-2 text-gray-900 cursor-pointer">
                <PencilLine className="h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleServiceAction('delete')} className="flex gap-2 text-red-600 cursor-pointer">
                <CircleX className="h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {service.category && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {service.category.name}
            </span>
            <span className="text-[11px] text-gray-400">cap: {service.category.capacity}</span>
          </div>
        )}

        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Timer className="h-4 w-4" />
              <span>{formatDurationShort(service.durationMinutes)}</span>
            </div>
            <span>·</span>
            <span className="font-semibold text-gray-900">
              {currencySymbol}{Number(service.price).toFixed(2)}
            </span>
          </div>

          {/* Bottom row */}
          <div className="flex items-center gap-3">
            <span className="flex items-center text-[11px] font-medium bg-fuchsia-100 text-fuchsia-700 px-2 py-0.5 rounded-full whitespace-nowrap">
              {service.minDepositPercent}% deposit
            </span>

            <ToggleSwitch
              checked={service.isActive}
              onChecked={() => updateStatusMutation.mutateAsync({ id: service.id, status: true })}
              onUnchecked={() => updateStatusMutation.mutateAsync({ id: service.id, status: false })}
            />
          </div>
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
          <Button variant="outline" type="button" onClick={() => setIsDeleteModalOpen(false)}>
            Cancel
          </Button>
          <Button className="bg-[#D10505] hover:bg-[#D10505]/90" onClick={() => deleteServiceMutation.mutate(service.id)} disabled={deleteServiceMutation.isPending} >
            {deleteServiceMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </Modal>
    </Card>
  )
}
