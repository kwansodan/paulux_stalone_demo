import type { ReactNode } from "react"

// A report column drives BOTH the on-screen table (render) and the CSV (value).
// If `value` is omitted it falls back to `row[key]`; if `render` is omitted the
// table shows `value`/`row[key]`.
export type ReportColumn<T = Record<string, unknown>> = {
  key: string
  label: string
  render?: (row: T) => ReactNode
  value?: (row: T) => string | number | null | undefined
  align?: "left" | "right"
}

export type ReportGroup = "Financial" | "Sales & products" | "Staff & marketing" | "Inventory" | "General"

// Metadata used by the hub to list reports (serialisable except the icon, which
// is fine to reference from a Server Component).
export type ReportMeta = {
  slug: string
  title: string
  description: string
  group: ReportGroup
}
