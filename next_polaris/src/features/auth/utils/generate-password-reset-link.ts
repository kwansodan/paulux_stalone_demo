import { resetPasswordPath } from '@/app/paths';
import { getBaseUrl } from '@/utils/url';
import { prisma } from '@/lib/prisma';
import { generateSessionToken, hashToken } from '@/utils/crypto';

const PASSWORD_RESET_TOKEN_LIFETIME_MS = 1000 * 60 * 60 * 2; //2 hours

export const generatePasswordResetLink = async (userId: string) => {
  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: userId
    }
  })

  const tokenId = generateSessionToken();
  const tokenHash = hashToken(tokenId);

  await prisma.passwordResetToken.create({
    data: {
      tokenHash,
      userId,
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_LIFETIME_MS)
    }
  })

  const pageUrl = getBaseUrl() + resetPasswordPath();
  const passwordResetLink = pageUrl + `/${tokenId}`


  return passwordResetLink;
}

