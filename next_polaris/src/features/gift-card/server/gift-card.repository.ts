import { prisma } from "@/lib/prisma"
import {
  GiftCardItemType,
  GiftCardStatus,
  GiftCardDeliveryMethod,
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from "@generated/prisma/client"
import { generateGiftCardCode } from "../utils/helpers"
import { SerializedGiftCard } from "../types"

function serializeGiftCard(giftCard: any): SerializedGiftCard {
  return {
    ...giftCard,
    totalAmount: giftCard.totalAmount.toString(),
    balance: giftCard.balance.toString(),
    createdAt: giftCard.createdAt.toISOString(),
    updatedAt: giftCard.updatedAt.toISOString(),
    expiresAt: giftCard.expiresAt ? giftCard.expiresAt.toISOString() : null,
    deliveredAt: giftCard.deliveredAt ? giftCard.deliveredAt.toISOString() : null,
    items: (giftCard.items ?? []).map((item: any) => ({
      ...item,
      unitPrice: item.unitPrice.toString(),
    })),
    ...(giftCard.redemptions && {
      redemptions: giftCard.redemptions.map((r: any) => ({
        ...r,
        amountApplied: r.amountApplied.toString(),
        createdAt: r.createdAt.toISOString(),
      })),
    }),
  }
}

export interface CreateGiftCardItemData {
  itemType: GiftCardItemType
  serviceId?: string | null
  productId?: string | null
  name: string
  unitPrice: number
  quantity: number
}

export interface CreateGiftCardData {
  senderName: string
  senderEmail: string
  senderPhone: string
  recipientName: string
  recipientEmail?: string | null
  recipientPhone?: string | null
  message?: string | null
  deliveryMethod: GiftCardDeliveryMethod
  totalAmount: number
  items: CreateGiftCardItemData[]
  paymentProvider: PaymentProvider
  paymentRef: string
}

export class GiftCardRepository {
  async create(data: CreateGiftCardData) {
    const giftCard = await prisma.giftCard.create({
      data: {
        code: generateGiftCardCode(),
        senderName: data.senderName,
        senderEmail: data.senderEmail,
        senderPhone: data.senderPhone,
        recipientName: data.recipientName,
        recipientEmail: data.recipientEmail || null,
        recipientPhone: data.recipientPhone || null,
        message: data.message || null,
        deliveryMethod: data.deliveryMethod,
        totalAmount: data.totalAmount,
        balance: data.totalAmount,
        status: GiftCardStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
        paymentProvider: data.paymentProvider,
        paymentRef: data.paymentRef,
        items: {
          create: data.items.map((item) => ({
            itemType: item.itemType,
            serviceId: item.serviceId ?? null,
            productId: item.productId ?? null,
            name: item.name,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    })

    return serializeGiftCard(giftCard)
  }

  async findByPaymentRef(paymentRef: string) {
    const giftCard = await prisma.giftCard.findFirst({
      where: { paymentRef },
      include: { items: true },
    })

    return giftCard ? serializeGiftCard(giftCard) : null
  }

  async findByCode(code: string) {
    const giftCard = await prisma.giftCard.findUnique({
      where: { code: code.toUpperCase() },
      include: { items: true },
    })

    return giftCard ? serializeGiftCard(giftCard) : null
  }

  async findById(id: string) {
    const giftCard = await prisma.giftCard.findUnique({
      where: { id },
      include: { items: true },
    })

    return giftCard ? serializeGiftCard(giftCard) : null
  }

  async getAll(where?: Prisma.GiftCardWhereInput) {
    const giftCards = await prisma.giftCard.findMany({
      where,
      include: { items: true, redemptions: true },
      orderBy: { createdAt: "desc" },
    })

    return giftCards.map(serializeGiftCard)
  }

  async activate(id: string) {
    const giftCard = await prisma.giftCard.update({
      where: { id },
      data: {
        status: GiftCardStatus.ACTIVE,
        paymentStatus: PaymentStatus.PAID,
      },
      include: { items: true },
    })

    return serializeGiftCard(giftCard)
  }

  async markDelivered(id: string) {
    await prisma.giftCard.update({
      where: { id },
      data: { deliveredAt: new Date() },
    })
  }

  /**
   * Apply (redeem) a portion of a gift card's balance toward a booking.
   * Returns the updated gift card and the amount actually applied.
   */
  async redeem(id: string, bookingId: string | null, amount: number, redeemedById?: string | null) {
    return prisma.$transaction(async (tx) => {
      const giftCard = await tx.giftCard.findUnique({ where: { id } })
      if (!giftCard) throw new Error("Gift card not found")

      const currentBalance = Number(giftCard.balance)
      const amountApplied = Math.min(amount, currentBalance)
      const newBalance = Math.max(0, currentBalance - amountApplied)

      const newStatus =
        newBalance <= 0
          ? GiftCardStatus.REDEEMED
          : GiftCardStatus.PARTIALLY_REDEEMED

      const updated = await tx.giftCard.update({
        where: { id },
        data: {
          balance: newBalance,
          status: newStatus,
        },
        include: { items: true },
      })

      await tx.giftCardRedemption.create({
        data: {
          giftCardId: id,
          bookingId,
          amountApplied,
          redeemedById: redeemedById ?? null,
        },
      })

      return { giftCard: serializeGiftCard(updated), amountApplied }
    })
  }
}

export const giftCardRepository = new GiftCardRepository()
