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
