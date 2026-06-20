"use client"

import { useState, useMemo } from "react"
import Modal from "@/components/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Minus, Plus, Search, ShoppingBag } from "lucide-react"
import { BookingWithService } from "../../types"
import { SerializedService } from "@/features/service/types"
import { SerializedProduct } from "@/features/product/types"
import { useEditBooking } from "../../client/hooks/use-booking"

type Props = {
  booking: BookingWithService
  services: SerializedService[]
  products: SerializedProduct[]
  open: boolean
  onClose: () => void
}

export default function EditServicesModal({ booking, services, products, open, onClose }: Props) {
  const mutation = useEditBooking()

  // Initialise from the booking's current services
  const [entries, setEntries] = useState<{ id: string; quantity: number }[]>(() =>
    booking.services.map(s => ({
      id: s.serviceId,
      quantity: (s as any).quantity ?? 1,
    }))
  )

  // Initialise from the booking's current products
  const [productEntries, setProductEntries] = useState<{ id: string; quantity: number }[]>(() =>
    (booking as any).products?.map((p: any) => ({ id: p.productId, quantity: p.quantity ?? 1 })) ?? []
  )

  const [search, setSearch] = useState("")
  const [productSearch, setProductSearch] = useState("")

  const filtered = useMemo(() =>
    services.filter(s => s.name.toLowerCase().includes(search.toLowerCase())),
    [services, search]
  )
  const filteredProducts = useMemo(() =>
    products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())),
    [products, productSearch]
  )

  function isSelected(id: string) {
    return entries.some(e => e.id === id)
  }

  function toggle(id: string) {
    if (isSelected(id)) {
      setEntries(prev => prev.filter(e => e.id !== id))
    } else {
      setEntries(prev => [...prev, { id, quantity: 1 }])
    }
  }

  function changeQty(id: string, delta: number) {
    setEntries(prev =>
      prev.map(e => e.id === id ? { ...e, quantity: Math.max(1, e.quantity + delta) } : e)
    )
  }

  function isProductSelected(id: string) {
    return productEntries.some(e => e.id === id)
  }

  function toggleProduct(id: string) {
    if (isProductSelected(id)) {
      setProductEntries(prev => prev.filter(e => e.id !== id))
    } else {
      setProductEntries(prev => [...prev, { id, quantity: 1 }])
    }
  }

  function changeProductQty(id: string, delta: number) {
    setProductEntries(prev =>
      prev.map(e => e.id === id ? { ...e, quantity: Math.max(1, e.quantity + delta) } : e)
    )
  }

  const servicesTotal = entries.reduce((sum, entry) => {
    const svc = services.find(s => s.id === entry.id)
    return sum + (svc ? Number(svc.price) * entry.quantity : 0)
  }, 0)
  const productsTotal = productEntries.reduce((sum, entry) => {
    const prod = products.find(p => p.id === entry.id)
    return sum + (prod ? Number(prod.price) * entry.quantity : 0)
  }, 0)
  const total = servicesTotal + productsTotal

  function handleSave() {
    mutation.mutate({
      id: booking.id,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail ?? "",
      clientPhone: booking.clientPhone,
      serviceIds: entries,
      productIds: productEntries,
      bookingDate: booking.bookingDate.slice(0, 10),
      bookingTime: booking.bookingTime,
      status: booking.status,
      bookingType: booking.bookingType,
    }, {
      onSuccess: () => onClose(),
    })
  }

  // Reset state each time the modal opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setEntries(booking.services.map(s => ({ id: s.serviceId, quantity: (s as any).quantity ?? 1 })))
      setProductEntries((booking as any).products?.map((p: any) => ({ id: p.productId, quantity: p.quantity ?? 1 })) ?? [])
      setSearch("")
      setProductSearch("")
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Services"
      subtitle={`${booking.clientName} · ${booking.bookingReference}`}
      className="sm:max-w-xl"
      childrenClassName="max-h-[50vh]"
      showSeparator
      footer={
        <div className="w-full flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500">Services + products total</p>
            <p className="text-lg font-bold text-fuchsia-700">GHS {total.toFixed(2)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button
              className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
              onClick={handleSave}
              disabled={mutation.isPending || entries.length === 0}
            >
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pt-2">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search services..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 bg-white border-gray-200 shadow-none"
          />
        </div>

        {/* Service list */}
        <div className="flex flex-col gap-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No services found</p>
          ) : (
            filtered.map(svc => {
              const selected = isSelected(svc.id)
              const qty = entries.find(e => e.id === svc.id)?.quantity ?? 1
              return (
                <div
                  key={svc.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    selected
                      ? "bg-fuchsia-50 border-fuchsia-200"
                      : "bg-white border-gray-100 hover:border-gray-200"
                  }`}
                >
                  {/* Checkbox */}
                  <div
                    onClick={() => toggle(svc.id)}
                    className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center cursor-pointer transition-colors ${
                      selected ? "bg-fuchsia-600 border-fuchsia-600" : "border-gray-300"
                    }`}
                  >
                    {selected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* Name */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => toggle(svc.id)}
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">{svc.name}</p>
                    <p className="text-xs text-gray-400">{svc.durationMinutes} mins</p>
                  </div>

                  {/* Quantity stepper — only when selected */}
                  {selected && (
                    <div
                      className="flex items-center gap-1.5"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => changeQty(svc.id, -1)}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                      <button
                        type="button"
                        onClick={() => changeQty(svc.id, 1)}
                        className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Price */}
                  <p className="text-sm font-semibold text-fuchsia-700 whitespace-nowrap w-20 text-right flex-shrink-0">
                    GHS {(Number(svc.price) * (selected ? qty : 1)).toFixed(2)}
                  </p>
                </div>
              )
            })
          )}
        </div>

        {/* Products */}
        {products.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-fuchsia-600" />
              Products <span className="text-gray-400 text-xs font-normal">(optional)</span>
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="pl-9 h-10 bg-white border-gray-200 shadow-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              {filteredProducts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No products found</p>
              ) : (
                filteredProducts.map(p => {
                  const selected = isProductSelected(p.id)
                  const qty = productEntries.find(e => e.id === p.id)?.quantity ?? 1
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                        selected
                          ? "bg-fuchsia-50 border-fuchsia-200"
                          : "bg-white border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div
                        onClick={() => toggleProduct(p.id)}
                        className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center cursor-pointer transition-colors ${
                          selected ? "bg-fuchsia-600 border-fuchsia-600" : "border-gray-300"
                        }`}
                      >
                        {selected && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => toggleProduct(p.id)}
                      >
                        <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      </div>

                      {selected && (
                        <div
                          className="flex items-center gap-1.5"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => changeProductQty(p.id, -1)}
                            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                          <button
                            type="button"
                            onClick={() => changeProductQty(p.id, 1)}
                            className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <p className="text-sm font-semibold text-fuchsia-700 whitespace-nowrap w-20 text-right flex-shrink-0">
                        GHS {(Number(p.price) * (selected ? qty : 1)).toFixed(2)}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

      </div>
    </Modal>
  )
}
