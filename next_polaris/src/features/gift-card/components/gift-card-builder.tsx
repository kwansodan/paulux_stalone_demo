"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { SerializedService } from "@/features/service/types"
import { SerializedProduct } from "@/features/product/types"
import { GiftCardDeliveryMethodType, GiftCardItemInput } from "@/features/gift-card/types"
import { giftCardSuccessPath } from "@/app/paths"
import {
  Gift,
  Search,
  Plus,
  Minus,
  Trash2,
  Mail,
  MessageSquare,
  Sparkles,
  ShoppingBag,
  Scissors,
  Loader2,
} from "lucide-react"

type CatalogItem = {
  itemType: "SERVICE" | "PRODUCT"
  id: string
  name: string
  price: number
  description?: string | null
  imageUrl?: string | null
}

type SelectedItem = CatalogItem & { quantity: number }

export default function GiftCardBuilder({
  services,
  products,
}: {
  services: SerializedService[]
  products: SerializedProduct[]
}) {
  const [activeTab, setActiveTab] = useState<"SERVICE" | "PRODUCT">("SERVICE")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])

  const [senderName, setSenderName] = useState("")
  const [senderEmail, setSenderEmail] = useState("")
  const [senderPhone, setSenderPhone] = useState("")
  const [recipientName, setRecipientName] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [recipientPhone, setRecipientPhone] = useState("")
  const [message, setMessage] = useState("")
  const [deliveryMethod, setDeliveryMethod] = useState<GiftCardDeliveryMethodType>("EMAIL")

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const catalog: CatalogItem[] = useMemo(() => {
    if (activeTab === "SERVICE") {
      return services.map((s) => ({
        itemType: "SERVICE" as const,
        id: s.id,
        name: s.name,
        price: Number(s.price),
        description: s.description,
        imageUrl: s.imageUrl,
      }))
    }
    return products.map((p) => ({
      itemType: "PRODUCT" as const,
      id: p.id,
      name: p.name,
      price: Number(p.price),
      description: p.description,
      imageUrl: p.imageUrl,
    }))
  }, [activeTab, services, products])

  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return catalog
    const q = searchQuery.toLowerCase()
    return catalog.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.description?.toLowerCase() || "").includes(q)
    )
  }, [catalog, searchQuery])

  const handleAddItem = (item: CatalogItem) => {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.id === item.id && i.itemType === item.itemType)
      if (existing) {
        return prev.map((i) =>
          i.id === item.id && i.itemType === item.itemType
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const handleQuantityChange = (id: string, itemType: "SERVICE" | "PRODUCT", delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((i) =>
          i.id === id && i.itemType === itemType
            ? { ...i, quantity: Math.max(1, i.quantity + delta) }
            : i
        )
        .filter((i) => i.quantity > 0)
    )
  }

  const handleRemoveItem = (id: string, itemType: "SERVICE" | "PRODUCT") => {
    setSelectedItems((prev) => prev.filter((i) => !(i.id === id && i.itemType === itemType)))
  }

  const totalAmount = useMemo(
    () => selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [selectedItems]
  )

  const validate = (): string | null => {
    if (selectedItems.length === 0) return "Add at least one service or product to your gift"
    if (!senderName.trim() || senderName.trim().length < 2) return "Please enter your name"
    if (!senderEmail.trim()) return "Please enter your email address"
    if (!senderPhone.trim()) return "Please enter your phone number"
    if (!recipientName.trim() || recipientName.trim().length < 2) return "Please enter the recipient's name"
    if ((deliveryMethod === "EMAIL" || deliveryMethod === "BOTH") && !recipientEmail.trim()) {
      return "Recipient email is required for email delivery"
    }
    if ((deliveryMethod === "SMS" || deliveryMethod === "BOTH") && !recipientPhone.trim()) {
      return "Recipient phone is required for SMS delivery"
    }
    return null
  }

  const handleSubmit = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setIsSubmitting(true)

    try {
      const items: GiftCardItemInput[] = selectedItems.map((i) => ({
        itemType: i.itemType,
        id: i.id,
        quantity: i.quantity,
      }))

      const callbackUrl = `${window.location.origin}${giftCardSuccessPath()}`

      const res = await fetch("/api/gift-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName,
          senderEmail,
          senderPhone,
          recipientName,
          recipientEmail: recipientEmail || undefined,
          recipientPhone: recipientPhone || undefined,
          message: message || undefined,
          deliveryMethod,
          items,
          callbackUrl,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to create gift card")
        setIsSubmitting(false)
        return
      }

      window.location.href = data.data.authorizationUrl
    } catch {
      setError("Something went wrong. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-fuchsia-50 mb-2">
          <Gift className="w-7 h-7 text-fuchsia-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Send a Gift</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Stack your favorite services and products into a gift card and send it to someone special via SMS or Email.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: catalog + selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("SERVICE")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
                activeTab === "SERVICE"
                  ? "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <Scissors className="w-4 h-4" />
              Services
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("PRODUCT")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
                activeTab === "PRODUCT"
                  ? "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Products
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder={`Search ${activeTab === "SERVICE" ? "services" : "products"}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Catalog list */}
          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {filteredCatalog.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No items found</p>
            )}
            {filteredCatalog.map((item) => (
              <div
                key={`${item.itemType}-${item.id}`}
                className="flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-fuchsia-200 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-sm text-fuchsia-600 font-semibold">GHS {item.price.toFixed(2)}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddItem(item)}
                  className="shrink-0"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: gift summary + details */}
        <div className="space-y-6">
          {/* Selected items */}
          <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
            <p className="font-semibold text-gray-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-fuchsia-600" />
              Your gift
            </p>

            {selectedItems.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">
                Add services or products to build your gift
              </p>
            ) : (
              <div className="space-y-2">
                {selectedItems.map((item) => (
                  <div key={`${item.itemType}-${item.id}`} className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        GHS {item.price.toFixed(2)} x {item.quantity} = GHS {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, item.itemType, -1)}
                        className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm w-5 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, item.itemType, 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id, item.itemType)}
                        className="w-6 h-6 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-fuchsia-600 text-lg">GHS {totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Sender details */}
          <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
            <p className="font-semibold text-gray-900">Your details</p>
            <Input placeholder="Your full name" value={senderName} onChange={(e) => setSenderName(e.target.value)} />
            <Input placeholder="Your email" type="email" value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} />
            <Input placeholder="Your phone number" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} />
          </div>

          {/* Recipient details */}
          <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
            <p className="font-semibold text-gray-900">Recipient details</p>
            <Input placeholder="Recipient's full name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
            <Input placeholder="Recipient's email" type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
            <Input placeholder="Recipient's phone number" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} />
            <Textarea
              placeholder="Add a personal message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />

            {/* Delivery method */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Send via</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: "EMAIL", label: "Email", icon: Mail },
                  { value: "SMS", label: "SMS", icon: MessageSquare },
                  { value: "BOTH", label: "Both", icon: Sparkles },
                ] as const).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDeliveryMethod(value)}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 text-xs font-semibold transition-colors ${
                      deliveryMethod === value
                        ? "border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>
          )}

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white py-6 text-base font-semibold rounded-xl"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>Pay GHS {totalAmount.toFixed(2)} & Send Gift</>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
