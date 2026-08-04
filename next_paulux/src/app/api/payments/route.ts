import { NextRequest, NextResponse } from "next/server"
import { paymentRepository } from "@/features/payment/server/payment.repository"
import { PaymentProvider, PaymentStatus } from "@generated/prisma/client"
import { requireRoleApi } from "@/app/_auth/require-role-api"

export async function GET(req: NextRequest) {
  const auth = await requireRoleApi(["ADMIN"], "payments.view")
  if (!auth.ok) return auth.response

  const { searchParams } = req.nextUrl

  const search = searchParams.get("search")
  const serviceId = searchParams.get("serviceId")
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const gateway = searchParams.get("gateway")
  const status = searchParams.get("status")

  const where: any = {}
  const and: any[] = []

  if (search) {
    and.push({
      OR: [
        { booking: { clientName: { contains: search, mode: "insensitive" } } },
        { booking: { clientEmail: { contains: search, mode: "insensitive" } } },
        { booking: { bookingReference: { contains: search, mode: "insensitive" } } },
        { providerRef: { contains: search, mode: "insensitive" } },
      ],
    })
  }

  if (serviceId) {
    and.push({ booking: { serviceId } })
  }

  if (from || to) {
    const createdAt: any = {}
    if (from) {
      const start = new Date(from + "T00:00:00")
      createdAt.gte = start
    }
    if (to) {
      const end = new Date(to + "T00:00:00")
      end.setHours(23, 59, 59, 999)
      createdAt.lte = end
    }
    and.push({ createdAt })
  }

  if (gateway) {
    and.push({ provider: gateway as PaymentProvider })
  }

  if (status) {
    and.push({ status: status as PaymentStatus })
  }

  if (and.length > 0) {
    where.AND = and
  }

  const payments = await paymentRepository.getAll(where)
  return NextResponse.json({
    success: true,
    message: "Successfully retrieved payments",
    data: payments
  }, { status: 200 })
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRoleApi(["ADMIN"], "payments.view")
    if (!auth.ok) return auth.response

    const body = await req.json()
    const { bookingId, provider, providerRef, amount, currency, status, rawPayload } = body

    // Validate required fields
    if (!bookingId || !provider || !providerRef || !amount || !currency || !status) {
      return NextResponse.json(
        { message: 'Missing required fields: bookingId, provider, providerRef, amount, currency, status' },
        { status: 400 }
      )
    }

    // Create payment record
    const payment = await paymentRepository.save({
      bookingId,
      provider,
      providerRef,
      amount: Number(amount),
      currency,
      status,
      rawPayload,
    })

    return NextResponse.json({
      success: true,
      message: "Payment record created successfully",
      data: payment
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating payment record:', error)
    return NextResponse.json(
      { message: 'Failed to create payment record', error: error.message },
      { status: 500 }
    )
  }
}

