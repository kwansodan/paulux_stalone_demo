
import { prisma } from "@/lib/prisma"
import { LoginSchema } from "@/features/auth/utils/validation"
import { generateSessionToken } from "@/utils/crypto"
import { comparePassword, DUMMY_PASSWORD_HASH } from "@/utils/helpers"
import { type NextRequest, NextResponse } from "next/server"
import { authRepository } from "@/features/auth/server/auth.repository"
import { SESSION_COOKIE_NAME } from "@/constants"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const rateLimited = checkRateLimit(request, "login", 10, 15 * 60 * 1000)
    if (rateLimited) return rateLimited

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 })
    }

    const validatedData = await LoginSchema.parse({ email, password })

    const user = await prisma.user.findUnique({
      where: {
        email: validatedData.email.toLowerCase()
      },
      include: { customRole: { select: { permissions: true } } },
    })

    // Always run a bcrypt compare with the same cost factor, even when the user
    // doesn't exist, so response timing doesn't reveal whether an email is registered.
    const validPassword = await comparePassword(validatedData.password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);
    if (!user || !validPassword) {
      return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 })
    }

    // Deactivated accounts keep their history but cannot sign in.
    if ((user as any).isActive === false) {
      return NextResponse.json(
        { success: false, message: "This account has been deactivated. Please contact an administrator." },
        { status: 403 }
      )
    }

    const sessionToken = generateSessionToken();
    const session = await authRepository.createSession(sessionToken, user.id)

    // Never return the password hash. Expose just what the client needs (incl. the
    // role/stylist flag/permissions used for the post-login redirect).
    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isStylist: (user as any).isStylist ?? false,
      permissions: (user as any).customRole?.permissions ?? [],
    }

    const response = NextResponse.json({ success: true, data: { user: safeUser }, message: "Logged In Successfully." }, { status: 200 })

    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.SECURE_COOKIES !== "false",
      path: "/",
      expires: session.expiresAt,
    })

    return response

  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, message: "Login Failed. Internal server error" }, { status: 500 })
  }

}
