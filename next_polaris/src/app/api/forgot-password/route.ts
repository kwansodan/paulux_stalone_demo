
import { prisma } from "@/lib/prisma"
import { ForgotPasswordSchema } from "@/features/auth/utils/validation"
import { type NextRequest, NextResponse } from "next/server"
import { inngest } from "@/lib/inngest"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 })
    }

    const validatedData = await ForgotPasswordSchema.parse({ email })

    const user = await prisma.user.findUnique({
      where: {
        email: validatedData.email.toLowerCase()
      }
    })

    if (!user) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
    }

    await inngest.send({
      name: "app/password.password-reset",
      data: {
        userId: user.id
      }
    })

    return NextResponse.json({ success: true, message: "Check Email For Password Link." }, { status: 200 })

  } catch (error) {
    console.error("Forgot Password error:", error)
    return NextResponse.json({ success: false, message: "Forgot Password Failed. Internal server error" }, { status: 500 })
  }

}
