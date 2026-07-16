import type { ReportColumn } from "./types"

// Row shape is report-specific; the API returns matching keys. Kept loose here
// and accessed by string key.
type Row = Record<string, any>

const ghs = (v: unknown) => `GHS ${Number(v ?? 0).toFixed(2)}`
const num = (v: unknown) => Number(v ?? 0)
const sum = (rows: Row[], key: string) => rows.reduce((a, r) => a + num(r[key]), 0)

export type ReportConfig = {
  title: string
  // Defaults to the slug; set when the API path differs.
  endpoint?: string
  columns: ReportColumn<Row>[]
  // Chips shown above the table; also computed from the same rows.
  summary?: (rows: Row[]) => { label: string; value: string }[]
}

// A right-aligned currency column (table shows GHS, CSV keeps the raw number).
const money = (key: string, label: string): ReportColumn<Row> => ({
  key,
  label,
  align: "right",
  value: (r) => num(r[key]),
  render: (r) => ghs(r[key]),
})

const int = (key: string, label: string): ReportColumn<Row> => ({
  key,
  label,
  align: "right",
  value: (r) => num(r[key]),
  render: (r) => String(num(r[key])),
})

const text = (key: string, label: string): ReportColumn<Row> => ({
  key,
  label,
  value: (r) => r[key] ?? "",
})

export const REPORT_CONFIG: Record<string, ReportConfig> = {
  // ── Financial ────────────────────────────────────────────────────────────
  revenue: {
    title: "Revenue",
    columns: [
      text("reference", "Booking"),
      text("date", "Date"),
      text("customer", "Customer"),
      text("status", "Status"),
      money("billed", "Billed"),
      money("paid", "Paid"),
      money("outstanding", "Outstanding"),
      money("discount", "Discount"),
    ],
    summary: (rows) => [
      { label: "Billed", value: ghs(sum(rows, "billed")) },
      { label: "Paid", value: ghs(sum(rows, "paid")) },
      { label: "Outstanding", value: ghs(sum(rows, "outstanding")) },
    ],
  },
  collections: {
    title: "Collections & payment methods",
    columns: [
      text("date", "Date"),
      text("reference", "Booking"),
      text("customer", "Customer"),
      text("method", "Method"),
      money("amount", "Amount"),
      text("status", "Status"),
    ],
    summary: (rows) => [
      { label: "Collected", value: ghs(sum(rows.filter((r) => r.status === "PAID"), "amount")) },
      { label: "Payments", value: String(rows.length) },
    ],
  },
  outstanding: {
    title: "Outstanding balances",
    columns: [
      text("reference", "Booking"),
      text("customer", "Customer"),
      text("phone", "Phone"),
      text("date", "Date"),
      money("billed", "Billed"),
      money("paid", "Paid"),
      money("due", "Due"),
      text("status", "Status"),
    ],
    summary: (rows) => [
      { label: "Total due", value: ghs(sum(rows, "due")) },
      { label: "Debtors", value: String(rows.length) },
    ],
  },

  // ── Sales & products ───────────────────────────────────────────────────────
  "sales-by-service": {
    title: "Sales by service",
    columns: [
      text("service", "Service"),
      text("category", "Category"),
      int("quantity", "Qty"),
      money("revenue", "Revenue"),
    ],
    summary: (rows) => [
      { label: "Qty sold", value: String(sum(rows, "quantity")) },
      { label: "Revenue", value: ghs(sum(rows, "revenue")) },
    ],
  },
  "product-sales": {
    title: "Product sales",
    columns: [
      text("product", "Product"),
      text("category", "Category"),
      int("unitsSold", "Units sold"),
      money("revenue", "Revenue"),
    ],
    summary: (rows) => [
      { label: "Units", value: String(sum(rows, "unitsSold")) },
      { label: "Revenue", value: ghs(sum(rows, "revenue")) },
    ],
  },

  // ── Staff & marketing ──────────────────────────────────────────────────────
  "staff-performance": {
    title: "Staff performance",
    columns: [
      text("staff", "Stylist"),
      int("bookings", "Bookings"),
      money("revenue", "Revenue attributed"),
    ],
    summary: (rows) => [
      { label: "Bookings", value: String(sum(rows, "bookings")) },
      { label: "Revenue", value: ghs(sum(rows, "revenue")) },
    ],
  },
  "promo-usage": {
    title: "Promo-code usage",
    columns: [
      text("code", "Code"),
      text("discountType", "Type"),
      text("discountValue", "Value"),
      int("timesUsed", "Times used"),
      money("totalDiscount", "Total discount"),
    ],
    summary: (rows) => [
      { label: "Redemptions", value: String(sum(rows, "timesUsed")) },
      { label: "Discount given", value: ghs(sum(rows, "totalDiscount")) },
    ],
  },
  "gift-cards": {
    title: "Gift cards",
    columns: [
      text("code", "Code"),
      text("issuedDate", "Issued"),
      text("sender", "Sender"),
      text("recipient", "Recipient"),
      money("totalAmount", "Value"),
      money("redeemed", "Redeemed"),
      money("balance", "Balance"),
      text("status", "Status"),
    ],
    summary: (rows) => [
      { label: "Issued value", value: ghs(sum(rows, "totalAmount")) },
      { label: "Redeemed", value: ghs(sum(rows, "redeemed")) },
      { label: "Outstanding", value: ghs(sum(rows, "balance")) },
    ],
  },

  // ── Inventory ──────────────────────────────────────────────────────────────
  "material-usage": {
    title: "Material usage & cost by section",
    columns: [
      text("section", "Section"),
      text("material", "Material"),
      text("unit", "Unit"),
      int("quantity", "Quantity"),
      money("cost", "Cost"),
    ],
    summary: (rows) => [{ label: "Total cost", value: ghs(sum(rows, "cost")) }],
  },
  "stock-movements": {
    title: "Product stock movements",
    columns: [
      text("date", "Date"),
      text("product", "Product"),
      text("type", "Type"),
      int("quantity", "Qty"),
      text("reference", "Booking"),
      text("notes", "Notes"),
    ],
    summary: (rows) => [{ label: "Movements", value: String(rows.length) }],
  },

  // ── General ────────────────────────────────────────────────────────────────
  bookings: {
    title: "Bookings",
    columns: [
      text("reference", "Booking"),
      text("date", "Date"),
      text("time", "Time"),
      text("customer", "Customer"),
      text("phone", "Phone"),
      text("status", "Status"),
      text("payment", "Payment"),
      money("amount", "Amount"),
    ],
    summary: (rows) => [
      { label: "Bookings", value: String(rows.length) },
      { label: "Value", value: ghs(sum(rows, "amount")) },
    ],
  },
}
