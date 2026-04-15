"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import ImageUpload from "@/components/ui/image-upload"
import { useCreatePackage, useUpdatePackage } from "../../client/use-packages"
import { SerializedPackage } from "../../types"
import { SerializedService } from "@/features/service/types"
import { isAxiosError } from "@/lib/utils"

interface PackageFormProps {
  pkg?: SerializedPackage
  services: SerializedService[]
  onCancel: () => void
  onSuccess: () => void
}

export default function PackageForm({ pkg, services, onCancel, onSuccess }: PackageFormProps) {
  const isEdit = !!pkg

  const [name, setName] = useState(pkg?.name ?? "")
  const [description, setDescription] = useState(pkg?.description ?? "")
  const [imageUrl, setImageUrl] = useState<string | null>(pkg?.imageUrl ?? null)
  const [price, setPrice] = useState(pkg ? String(Number(pkg.price)) : "")
  const [minDepositPercent, setMinDepositPercent] = useState(String(pkg?.minDepositPercent ?? 0))
  const [isActive, setIsActive] = useState(pkg?.isActive ?? true)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    pkg?.services.map((ps) => ps.serviceId) ?? []
  )

  const createMutation = useCreatePackage()
  const updateMutation = useUpdatePackage()
  const mutation = isEdit ? updateMutation : createMutation

  const individualTotal = useMemo(() => {
    return services
      .filter((s) => selectedServiceIds.includes(s.id))
      .reduce((sum, s) => sum + Number(s.price), 0)
  }, [services, selectedServiceIds])

  const packagePrice = Number(price) || 0
  const savings = individualTotal - packagePrice

  function toggleService(serviceId: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || selectedServiceIds.length === 0 || !price) return

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      imageUrl: imageUrl || null,
      price: parseFloat(price),
      minDepositPercent: parseInt(minDepositPercent) || 0,
      isActive,
      serviceIds: selectedServiceIds,
    }

    if (isEdit) {
      await (updateMutation as any).mutateAsync({ id: pkg!.id, ...payload })
    } else {
      await (createMutation as any).mutateAsync(payload)
    }
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="flex-1 space-y-4 overflow-y-auto px-1">

        {/* Image */}
        <div className="space-y-1">
          <Label className="text-sm font-normal">Package image</Label>
          <ImageUpload value={imageUrl} onChange={setImageUrl} />
        </div>

        {/* Name */}
        <div className="space-y-1">
          <Label className="text-sm font-normal">Name <span className="text-red-500">*</span></Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Bridal Package"
            className="h-12 bg-white shadow-none border border-[#E2E8F0] rounded-lg"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <Label className="text-sm font-normal">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the package"
            className="h-20 bg-white shadow-none border border-[#E2E8F0] rounded-lg"
            rows={3}
          />
        </div>

        {/* Price & Deposit */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-sm font-normal">Package price (GHS) <span className="text-red-500">*</span></Label>
            <Input
              type="number"
              step="0.01"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-12 bg-white shadow-none border-[#E2E8F0] rounded-lg"
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-normal">Min deposit (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={minDepositPercent}
              onChange={(e) => setMinDepositPercent(e.target.value)}
              className="h-12 bg-white shadow-none border-[#E2E8F0] rounded-lg"
            />
          </div>
        </div>

        {/* Services multi-select */}
        <div className="space-y-2">
          <Label className="text-sm font-normal">
            Included services <span className="text-red-500">*</span>
            <span className="ml-2 text-xs text-gray-400">({selectedServiceIds.length} selected)</span>
          </Label>
          <div className="border border-[#E2E8F0] rounded-lg divide-y divide-gray-100 max-h-56 overflow-y-auto">
            {services.map((service) => {
              const checked = selectedServiceIds.includes(service.id)
              return (
                <label
                  key={service.id}
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-fuchsia-50/30 transition-colors"
                >
                  <div className="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleService(service.id)}
                      className="sr-only peer"
                    />
                    <div className="w-4 h-4 rounded border-2 border-gray-300 peer-checked:border-fuchsia-600 peer-checked:bg-fuchsia-600 flex items-center justify-center transition-colors">
                      {checked && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{service.name}</p>
                    <p className="text-xs text-gray-400">{service.durationMinutes} mins</p>
                  </div>
                  <span className="text-sm font-medium text-fuchsia-600 flex-shrink-0">
                    ₵{Number(service.price).toFixed(2)}
                  </span>
                </label>
              )
            })}
            {services.length === 0 && (
              <p className="px-3 py-4 text-sm text-gray-400 text-center">No services available</p>
            )}
          </div>
        </div>

        {/* Savings indicator */}
        {selectedServiceIds.length > 0 && price && (
          <div className={`flex items-center justify-between text-xs rounded-lg px-3 py-2 ${savings > 0 ? "bg-green-50 text-green-700" : savings < 0 ? "bg-amber-50 text-amber-700" : "bg-gray-50 text-gray-500"}`}>
            <span>Individual total: ₵{individualTotal.toFixed(2)}</span>
            {savings > 0 && <span className="font-semibold">Customer saves ₵{savings.toFixed(2)}</span>}
            {savings < 0 && <span className="font-semibold">Package costs ₵{Math.abs(savings).toFixed(2)} more</span>}
            {savings === 0 && <span>No discount</span>}
          </div>
        )}

        {/* Active toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative flex-shrink-0">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="sr-only peer" />
            <div className="w-5 h-5 rounded border-2 border-gray-300 peer-checked:border-fuchsia-600 peer-checked:bg-fuchsia-600 flex items-center justify-center transition-colors">
              {isActive && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          </div>
          <Label className="text-sm font-normal cursor-pointer">Active (visible to customers)</Label>
        </label>
      </div>

      {mutation.isError && (
        <p className="text-red-500 text-sm text-center mt-2">
          {isAxiosError(mutation.error)
            ? (mutation.error as any).response?.data?.message || (mutation.error as any).message
            : "Failed to save package"}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button
          type="submit"
          disabled={mutation.isPending || !name.trim() || selectedServiceIds.length === 0 || !price}
          className="bg-fuchsia-700 hover:bg-fuchsia-600"
        >
          {mutation.isPending ? (isEdit ? "Updating..." : "Creating...") : (isEdit ? "Update Package" : "Create Package")}
        </Button>
      </div>
    </form>
  )
}
