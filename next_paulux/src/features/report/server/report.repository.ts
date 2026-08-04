import { prisma } from "@/lib/prisma"
import { bookingInclude } from "@/lib/prisma-includes"
import { calculateBookingTotal, calculateBookingSubtotal } from "@/features/booking/utils/helpers"
import { materialRepository } from "@/features/material/server/material.repository"
import { BookingStatus, PaymentProvider, PaymentStatus } from "@generated/prisma/client"

const db = prisma as any

type Row = Record<string, any>

// createdAt-based reports: inclusive day range in local terms.
function dateRange(from: string, to: string) {
  return { gte: new Date(`${from}T00:00:00`), lte: new Date(`${to}T23:59:59.999`) }
}

const paid = (booking: any) =>
  (booking.payments ?? [])
    .filter((p: any) => p.status === PaymentStatus.PAID)
    .reduce((s: number, p: any) => s + Number(p.amount), 0)

// Gift-card redemptions are recorded as PAID MANUAL payments (see gift-cards/redeem
// route). They are not cash collected, so revenue reporting separates them out.
const isGiftCardPayment = (p: any) =>
  p.provider === PaymentProvider.MANUAL &&
  (String(p.providerRef ?? "").startsWith("GIFTCARD_") || p.rawPayload?.method === "Gift Card")

const paidPayments = (booking: any) =>
  (booking.payments ?? []).filter((p: any) => p.status === PaymentStatus.PAID)

const cashPaid = (booking: any) =>
  paidPayments(booking)
    .filter((p: any) => !isGiftCardPayment(p))
    .reduce((s: number, p: any) => s + Number(p.amount), 0)

const giftCardPaid = (booking: any) =>
  paidPayments(booking)
    .filter((p: any) => isGiftCardPayment(p))
    .reduce((s: number, p: any) => s + Number(p.amount), 0)

class ReportRepository {
  // ── Financial ──────────────────────────────────────────────────────────────
  async revenue(from: string, to: string): Promise<Row[]> {
    const bookings = await db.booking.findMany({
      where: { bookingDate: { gte: from, lte: to } },
      include: bookingInclude,
      orderBy: { bookingDate: "asc" },
    })
    return bookings.map((b: any) => {
      const billed = b.status === BookingStatus.CANCELLED ? 0 : calculateBookingSubtotal(b)
      const discount = Number(b.discountAmount ?? 0)
      const giftCard = giftCardPaid(b)
      const cash = cashPaid(b)
      return {
        reference: b.bookingReference,
        date: b.bookingDate,
        customer: b.clientName,
        status: b.status,
        billed,
        promoCode: b.promoCode?.code ?? "—",
        discount,
        giftCard,
        paid: cash,
        outstanding: Math.max(0, billed - discount - giftCard - cash),
      }
    })
  }

  async collections(from: string, to: string): Promise<Row[]> {
    const payments = await db.payment.findMany({
      where: { createdAt: dateRange(from, to) },
      include: {
        booking: { select: { bookingReference: true, clientName: true } },
        manualMethod: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return payments.map((p: any) => {
      let method: string
      if (p.provider === PaymentProvider.MANUAL) {
        method = p.manualMethod?.name ?? (p.rawPayload as any)?.method ?? "Cash"
      } else {
        const channel = (p.rawPayload as any)?.data?.channel ?? "mobile_money"
        method = channel === "card" ? "Bank Card" : "Mobile Money"
      }
      return {
        date: p.createdAt.toISOString().split("T")[0],
        reference: p.booking?.bookingReference ?? "",
        customer: p.booking?.clientName ?? "",
        method,
        amount: Number(p.amount),
        status: p.status,
      }
    })
  }

  async outstanding(from: string, to: string): Promise<Row[]> {
    const bookings = await db.booking.findMany({
      where: { bookingDate: { gte: from, lte: to }, status: { not: BookingStatus.CANCELLED } },
      include: bookingInclude,
      orderBy: { bookingDate: "asc" },
    })
    return bookings
      .map((b: any) => {
        const billed = calculateBookingTotal(b)
        const p = paid(b)
        return {
          reference: b.bookingReference,
          customer: b.clientName,
          phone: b.clientPhone,
          date: b.bookingDate,
          billed,
          paid: p,
          due: Math.max(0, billed - p),
          status: b.status,
        }
      })
      .filter((r: Row) => r.due > 0)
  }

  // ── Sales & products ─────────────────────────────────────────────────────────
  async salesByService(from: string, to: string): Promise<Row[]> {
    const rows = await db.bookingService.findMany({
      where: { booking: { bookingDate: { gte: from, lte: to }, status: { not: BookingStatus.CANCELLED } } },
      include: { service: { select: { name: true, category: { select: { name: true } } } } },
    })
    const map = new Map<string, Row>()
    for (const r of rows) {
      const name = r.service?.name ?? "Unknown"
      const key = name
      const qty = r.quantity ?? 1
      const revenue = Number(r.priceAtBooking) * qty
      const existing = map.get(key)
      if (existing) {
        existing.quantity += qty
        existing.revenue += revenue
      } else {
        map.set(key, { service: name, category: r.service?.category?.name ?? "—", quantity: qty, revenue })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
  }

  async productSales(from: string, to: string): Promise<Row[]> {
    const rows = await db.bookingProduct.findMany({
      where: { booking: { bookingDate: { gte: from, lte: to }, status: { not: BookingStatus.CANCELLED } } },
      include: { product: { select: { name: true, category: { select: { name: true } } } } },
    })
    const map = new Map<string, Row>()
    for (const r of rows) {
      const name = r.product?.name ?? "Unknown"
      const qty = r.quantity ?? 1
      const revenue = Number(r.priceAtBooking) * qty
      const existing = map.get(name)
      if (existing) {
        existing.unitsSold += qty
        existing.revenue += revenue
      } else {
        map.set(name, { product: name, category: r.product?.category?.name ?? "—", unitsSold: qty, revenue })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
  }

  // ── Staff & marketing ────────────────────────────────────────────────────────
  async staffPerformance(from: string, to: string): Promise<Row[]> {
    const bookings = await db.booking.findMany({
      where: {
        bookingDate: { gte: from, lte: to },
        status: { not: BookingStatus.CANCELLED },
        assignedToId: { not: null },
      },
      include: { ...bookingInclude, assignedTo: { select: { username: true } } },
    })
    const map = new Map<string, Row>()
    for (const b of bookings) {
      const staff = b.assignedTo?.username ?? "Unassigned"
      const revenue = calculateBookingTotal(b)
      const existing = map.get(staff)
      if (existing) {
        existing.bookings += 1
        existing.revenue += revenue
      } else {
        map.set(staff, { staff, bookings: 1, revenue })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
  }

  async promoUsage(from: string, to: string): Promise<Row[]> {
    const bookings = await db.booking.findMany({
      where: { bookingDate: { gte: from, lte: to }, promoCodeId: { not: null } },
      include: { promoCode: { select: { code: true, discountType: true, discountValue: true } } },
    })
    const map = new Map<string, Row>()
    for (const b of bookings) {
      const code = b.promoCode?.code ?? "—"
      const discount = Number(b.discountAmount ?? 0)
      const existing = map.get(code)
      if (existing) {
        existing.timesUsed += 1
        existing.totalDiscount += discount
      } else {
        map.set(code, {
          code,
          discountType: b.promoCode?.discountType ?? "",
          discountValue: b.promoCode ? String(b.promoCode.discountValue) : "",
          timesUsed: 1,
          totalDiscount: discount,
        })
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalDiscount - a.totalDiscount)
  }

  async giftCards(from: string, to: string): Promise<Row[]> {
    const cards = await db.giftCard.findMany({
      where: { createdAt: dateRange(from, to) },
      orderBy: { createdAt: "desc" },
    })
    return cards.map((c: any) => {
      const total = Number(c.totalAmount)
      const balance = Number(c.balance)
      return {
        code: c.code,
        issuedDate: c.createdAt.toISOString().split("T")[0],
        sender: c.senderName,
        recipient: c.recipientName,
        totalAmount: total,
        redeemed: Math.max(0, total - balance),
        balance,
        status: c.status,
      }
    })
  }

  // ── Inventory ──────────────────────────────────────────────────────────────
  async materialUsage(from: string, to: string): Promise<Row[]> {
    const report = await materialRepository.getUsageBySection(
      new Date(`${from}T00:00:00`),
      new Date(`${to}T23:59:59.999`)
    )
    const rows: Row[] = []
    for (const section of report.sections) {
      for (const line of section.lines) {
        rows.push({
          section: section.sectionName,
          material: line.materialName,
          unit: line.unit,
          quantity: line.quantity,
          cost: line.cost,
        })
      }
    }
    return rows
  }

  async stockMovements(from: string, to: string): Promise<Row[]> {
    const movements = await db.productStockMovement.findMany({
      where: { createdAt: dateRange(from, to) },
      include: {
        product: { select: { name: true } },
        booking: { select: { bookingReference: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return movements.map((m: any) => ({
      date: m.createdAt.toISOString().split("T")[0],
      product: m.product?.name ?? "—",
      type: m.type,
      quantity: m.quantity,
      reference: m.booking?.bookingReference ?? "",
      notes: m.notes ?? "",
    }))
  }

  // ── General ────────────────────────────────────────────────────────────────
  async bookings(from: string, to: string): Promise<Row[]> {
    const bookings = await db.booking.findMany({
      where: { bookingDate: { gte: from, lte: to } },
      include: bookingInclude,
      orderBy: [{ bookingDate: "asc" }, { bookingTime: "asc" }],
    })
    return bookings.map((b: any) => ({
      reference: b.bookingReference,
      date: b.bookingDate,
      time: b.bookingTime,
      customer: b.clientName,
      phone: b.clientPhone,
      status: b.status,
      payment: b.paymentStatus,
      amount: b.status === BookingStatus.CANCELLED ? 0 : calculateBookingTotal(b),
    }))
  }
}

export const reportRepository = new ReportRepository()
