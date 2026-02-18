import { NextRequest, NextResponse } from "next/server"
import { paymentRepository } from "@/features/payment/server/payment.repository"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const search = searchParams.get("search")
  const serviceId = searchParams.get("serviceId")
  const date = searchParams.get("date")

  let where: any = {}

  if (search) {
    where.booking = {
      OR: [
        { clientName: { contains: search, mode: "insensitive" } },
        { clientEmail: { contains: search, mode: "insensitive" } },
      ]
    }
  }

  if (serviceId) {
    where.booking = { ...(where.booking ?? {}), serviceId }
  }

  if (date) {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0) // midnight start of day

    const end = new Date(date)
    end.setHours(23, 59, 59, 999) // end of day

    where.createdAt = {
      gte: start,
      lte: end,
    }
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

