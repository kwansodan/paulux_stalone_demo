import { NextResponse } from "next/server"
import { isAuthenticated } from "@/app/_auth/is-authenticated";
import { authRepository } from "@/features/auth/server/auth.repository";
import { deleteSessionCookie } from "@/features/auth/utils/cookie";

export async function GET() {
  try {
    const { session } = await isAuthenticated();
    
    if (!session) {
      return NextResponse.json({ success: true, message: "Internal server error" }, { status: 500 })
    }

    await authRepository.invalidateSession(session.id)
    await deleteSessionCookie()

    return NextResponse.json({ success: true },{ status: 200 })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
  
}