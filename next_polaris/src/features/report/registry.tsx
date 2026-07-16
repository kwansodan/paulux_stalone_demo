import type { ComponentType } from "react"
import {
  Banknote,
  CreditCard,
  AlertCircle,
  Scissors,
  ShoppingBag,
  Users,
  Tag,
  Gift,
  Boxes,
  PackageSearch,
  Calendar,
} from "lucide-react"
import type { ReportGroup } from "./types"

export type ReportEntry = {
  slug: string
  title: string
  description: string
  group: ReportGroup
  icon: ComponentType<{ className?: string }>
}

// Single source of truth for the hub listing + which slugs are valid report
// pages. Each entry has a matching config in reports-config.tsx and an API route
// at /api/reports/<slug>.
export const REPORTS: ReportEntry[] = [
  // Financial
  { slug: "revenue", title: "Revenue", description: "Billed, paid and outstanding per booking.", group: "Financial", icon: Banknote },
  { slug: "collections", title: "Collections & payment methods", description: "Payments received by method and provider.", group: "Financial", icon: CreditCard },
  { slug: "outstanding", title: "Outstanding balances", description: "Bookings with a balance still due.", group: "Financial", icon: AlertCircle },
  // Sales & products
  { slug: "sales-by-service", title: "Sales by service", description: "Quantity and revenue per service.", group: "Sales & products", icon: Scissors },
  { slug: "product-sales", title: "Product sales", description: "Units sold and revenue per product.", group: "Sales & products", icon: ShoppingBag },
  // Staff & marketing
  { slug: "staff-performance", title: "Staff performance", description: "Bookings and revenue per stylist.", group: "Staff & marketing", icon: Users },
  { slug: "promo-usage", title: "Promo-code usage", description: "Redemptions and discount given per code.", group: "Staff & marketing", icon: Tag },
  { slug: "gift-cards", title: "Gift cards", description: "Issued value, redeemed and outstanding balances.", group: "Staff & marketing", icon: Gift },
  // Inventory
  { slug: "material-usage", title: "Material usage & cost", description: "Consumables issued to each section, at cost.", group: "Inventory", icon: Boxes },
  { slug: "stock-movements", title: "Product stock movements", description: "Every stock in/out/sale/adjustment.", group: "Inventory", icon: PackageSearch },
  // General
  { slug: "bookings", title: "Bookings", description: "All bookings with status, payment and value.", group: "General", icon: Calendar },
]

export const REPORT_GROUPS: ReportGroup[] = [
  "Financial",
  "Sales & products",
  "Staff & marketing",
  "Inventory",
  "General",
]

export function getReport(slug: string): ReportEntry | undefined {
  return REPORTS.find((r) => r.slug === slug)
}
