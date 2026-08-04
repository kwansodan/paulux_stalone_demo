
import { prisma } from "@/lib/prisma"
import { PasswordResetSchema } from "@/features/auth/utils/validation"
import { type NextRequest, NextResponse } from "next/server"
import { hashToken } from "@/utils/crypto";
import { hashPassword } from "@/utils/helpers";

export async function POST(request: NextRequest, { params }: { params: Promise<{ tokenId: string }> }) {
  try {
    const awaitedParams = await params;
    const tokenId = awaitedParams.tokenId;
    const { password, confirmPassword } = await request.json()

    if (!password || !confirmPassword) {
      return NextResponse.json({ success: false, message: "Password is required" }, { status: 400 })
    }
    const validatedData = PasswordResetSchema.parse({
      password: password,
      confirmPassword: confirmPassword,
    });

    const tokenHash: string = hashToken(tokenId);

    const passwordResetToken = await prisma.passwordResetToken.findUnique({
      where: {
        tokenHash
      }
    })

    if (!passwordResetToken || Date.now() > passwordResetToken.expiresAt.getTime()) {
      return NextResponse.json({ success: false, message: "Expired Or Invalid Verification Token"}, { status: 400 })
    }

    if (passwordResetToken) {
      await prisma.passwordResetToken.delete({
        where: {
          tokenHash,
        },
      });
    }

    await prisma.session.deleteMany({
      where: {
        userId: passwordResetToken.userId,
      },
    });

    const passwordHash = await hashPassword(validatedData.password);

    await prisma.user.update({
      where: {
        id: passwordResetToken.userId
      },
      data: {
        passwordHash: passwordHash
      }
    })

    return NextResponse.json({ success: true, message: "Successfully Reset Password" }, { status: 200 })

  } catch (error) {
    console.error("Reset Password error:", error)
    return NextResponse.json({ success: false, message: "Reset Password Failed. Internal server error" }, { status: 500 })
  }

}
