
import { prisma } from "@/lib/prisma"
import { LoginSchema } from "@/features/auth/utils/validation"
import { generateSessionToken } from "@/utils/crypto"
import { comparePassword } from "@/utils/helpers"
import { type NextRequest, NextResponse } from "next/server"
import { authRepository } from "@/features/auth/server/auth.repository"
import { setSessionCookie } from "@/features/auth/utils/cookie"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 })
    }

    const validatedData = await LoginSchema.parse({ email, password })

    const user = await prisma.user.findUnique({
      where: {
        email: validatedData.email
      }
    })

    if (!user) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
    }


    const validPassword = await comparePassword(validatedData.password, user.passwordHash);
    // Demo password check
    if (!validPassword) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
    }

    const sessionToken = generateSessionToken();
    const session = await authRepository.createSession(sessionToken, user.id)
    await setSessionCookie(sessionToken, session.expiresAt)

    return NextResponse.json({ success: true, data: { user }, message: "Logged In Successfully." }, { status: 200 })

  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, message: "Login Failed. Internal server error" }, { status: 500 })
  }

}
