import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { CreateGiftCardSchema } from "@/features/gift-card/utils/validation"
import { giftCardRepository } from "@/features/gift-card/server/gift-card.repository"
import { generateGiftCardPaymentReference } from "@/features/gift-card/utils/helpers"
import { initializeTransaction } from "@/lib/paystack"
import { prisma } from "@/lib/prisma"
import { PaymentProvider } from "@generated/prisma/client"
import { requireRoleApi } from "@/app/_auth/require-role-api"

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRoleApi(["ADMIN"], "gift_cards.view")
    if (!auth.ok) return auth.response

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { senderName: { contains: search, mode: "insensitive" } },
        { senderEmail: { contains: search, mode: "insensitive" } },
        { recipientName: { contains: search, mode: "insensitive" } },
        { recipientEmail: { contains: search, mode: "insensitive" } },
        { recipientPhone: { contains: search } },
      ]
    }

    const giftCards = await giftCardRepository.getAll(where as any)

    return NextResponse.json({ success: true, data: giftCards })
  } catch (error: any) {
    if (error instanceof NextResponse) return error
    console.error("Error fetching gift cards:", error)
    return NextResponse.json({ success: false, message: error.message || "Failed to fetch gift cards" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = CreateGiftCardSchema.parse(body)

    const serviceIds = validated.items.filter((i) => i.itemType === "SERVICE").map((i) => i.id)
    const productIds = validated.items.filter((i) => i.itemType === "PRODUCT").map((i) => i.id)

    const [services, products] = await Promise.all([
      serviceIds.length
        ? prisma.service.findMany({ where: { id: { in: serviceIds }, isActive: true } })
        : Promise.resolve([]),
      productIds.length
        ? prisma.product.findMany({ where: { id: { in: productIds }, isActive: true } })
        : Promise.resolve([]),
    ])

    if (services.length !== serviceIds.length || products.length !== productIds.length) {
      return NextResponse.json(
        { success: false, message: "One or more selected items is no longer available" },
        { status: 409 }
      )
    }

    const items = validated.items.map((i) => {
      if (i.itemType === "SERVICE") {
        const svc = services.find((s) => s.id === i.id)!
        return {
          itemType: "SERVICE" as const,
          serviceId: svc.id,
          productId: null,
          name: svc.name,
          unitPrice: Number(svc.price),
          quantity: i.quantity,
        }
      }
      const prod = products.find((p) => p.id === i.id)!
      return {
        itemType: "PRODUCT" as const,
        serviceId: null,
        productId: prod.id,
        name: prod.name,
        unitPrice: Number(prod.price),
        quantity: i.quantity,
      }
    })

    const totalAmount = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

    if (totalAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Gift amount must be greater than zero" },
        { status: 400 }
      )
    }

    const reference = generateGiftCardPaymentReference()

    const giftCard = await giftCardRepository.create({
      senderName: validated.senderName,
      senderEmail: validated.senderEmail,
      senderPhone: validated.senderPhone,
      recipientName: validated.recipientName,
      recipientEmail: validated.recipientEmail || null,
      recipientPhone: validated.recipientPhone || null,
      message: validated.message || null,
      deliveryMethod: validated.deliveryMethod,
      totalAmount,
      items,
      paymentProvider: PaymentProvider.PRIMARY_PAYSTACK,
      paymentRef: reference,
    })

    const initResponse = await initializeTransaction(
      validated.senderEmail,
      Math.round(totalAmount * 100),
      reference,
      validated.callbackUrl,
      "GHS",
      ["mobile_money", "card"],
      PaymentProvider.PRIMARY_PAYSTACK,
      validated.senderPhone
    )

    if (!initResponse.status) {
      return NextResponse.json(
        { success: false, message: initResponse.message || "Failed to initialize payment" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Gift card created — redirecting to payment",
      data: {
        giftCard,
        authorizationUrl: initResponse.data.authorization_url,
        reference,
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Validation failed", details: error.issues },
        { status: 400 }
      )
    }
    console.error("Error creating gift card:", error)
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create gift card" },
      { status: 500 }
    )
  }
}
