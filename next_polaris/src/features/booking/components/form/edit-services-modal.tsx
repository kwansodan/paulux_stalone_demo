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

  // Merge the live (active-only) catalog with the booking's OWN lines, so items
  // turned off after the booking was made still appear here, remain removable,
  // and count toward the total. On-booking items are priced at their locked-in
  // snapshot (priceAtBooking) — matching what a save persists and what
  // calculateBookingTotal reports — while catalog items not yet on the booking
  // use the current price.
  type PickItem = { id: string; name: string; price: number; sub: string; inactive: boolean }

  const serviceItems = useMemo<PickItem[]>(() => {
    const snap = new Map((booking.services as any[]).map(s => [s.serviceId, s]))
    const catalogIds = new Set(services.map(s => s.id))
    const items: PickItem[] = services.map(s => ({
      id: s.id,
      name: s.name,
      price: snap.has(s.id) ? Number(snap.get(s.id).priceAtBooking) : Number(s.price),
      sub: `${s.durationMinutes} mins`,
      inactive: false,
    }))
    for (const bs of booking.services as any[]) {
      if (!catalogIds.has(bs.serviceId)) {
        items.push({
          id: bs.serviceId,
          name: bs.service?.name ?? "Service",
          price: Number(bs.priceAtBooking ?? 0),
          sub: `${bs.durationAtBooking ?? bs.service?.durationMinutes ?? 0} mins`,
          inactive: true,
        })
      }
    }
    return items
  }, [services, booking.services])

  const productItems = useMemo<PickItem[]>(() => {
    const bookingProducts = ((booking as any).products ?? []) as any[]
    const snap = new Map(bookingProducts.map(p => [p.productId, p]))
    const catalogIds = new Set(products.map(p => p.id))
    const items: PickItem[] = products.map(p => ({
      id: p.id,
      name: p.name,
      price: snap.has(p.id) ? Number(snap.get(p.id).priceAtBooking) : Number(p.price),
      sub: "",
      inactive: false,
    }))
    for (const bp of bookingProducts) {
      if (!catalogIds.has(bp.productId)) {
        items.push({
          id: bp.productId,
          name: bp.product?.name ?? "Product",
          price: Number(bp.priceAtBooking ?? 0),
          sub: "",
          inactive: true,
        })
      }
    }
    return items
  }, [products, booking])

  const serviceItemById = useMemo(() => new Map(serviceItems.map(i => [i.id, i])), [serviceItems])
  const productItemById = useMemo(() => new Map(productItems.map(i => [i.id, i])), [productItems])

  const filtered = useMemo(() =>
    serviceItems.filter(s => s.name.toLowerCase().includes(search.toLowerCase())),
    [serviceItems, search]
  )
  const filteredProducts = useMemo(() =>
    productItems.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())),
    [productItems, productSearch]
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
    return sum + (serviceItemById.get(entry.id)?.price ?? 0) * entry.quantity
  }, 0)
  const productsTotal = productEntries.reduce((sum, entry) => {
    return sum + (productItemById.get(entry.id)?.price ?? 0) * entry.quantity
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
                    <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-1.5">
                      {svc.name}
                      {svc.inactive && (
                        <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Inactive</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">{svc.sub}</p>
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
                    GHS {(svc.price * (selected ? qty : 1)).toFixed(2)}
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
                        <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-1.5">
                          {p.name}
                          {p.inactive && (
                            <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Inactive</span>
                          )}
                        </p>
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
                        GHS {(p.price * (selected ? qty : 1)).toFixed(2)}
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
