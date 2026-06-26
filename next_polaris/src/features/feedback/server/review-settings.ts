import { prisma } from "@/lib/prisma"

/** SystemSetting key holding the Google Business review link used in feedback requests. */
export const GOOGLE_REVIEW_LINK_KEY = "google_review_link"

export async function getGoogleReviewLink(): Promise<string | null> {
  const setting = await prisma.systemSetting.findUnique({ where: { key: GOOGLE_REVIEW_LINK_KEY } })
  return setting?.value || null
}
