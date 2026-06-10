import { sendSMS } from "@/lib/arkesal"
import { getBaseUrl } from "@/utils/url"
import { sendGiftCardRecipientEmail } from "../emails/send-gift-card-email"
import { giftCardRepository } from "./gift-card.repository"
import { SerializedGiftCard } from "../types"

/**
 * Sends a gift card to its recipient via SMS and/or Email depending on the
 * chosen delivery method, then marks the gift card as delivered.
 */
export async function deliverGiftCard(giftCard: SerializedGiftCard) {
  const redeemUrl = `${getBaseUrl()}/customer/booking?giftCard=${giftCard.code}`
  const itemSummary = giftCard.items
    .map((i) => `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}`)
    .join(", ")
  const amount = Number(giftCard.totalAmount).toFixed(2)

  const tasks: Promise<unknown>[] = []

  if (
    (giftCard.deliveryMethod === "EMAIL" || giftCard.deliveryMethod === "BOTH") &&
    giftCard.recipientEmail
  ) {
    tasks.push(
      sendGiftCardRecipientEmail({
        to: giftCard.recipientEmail,
        recipientName: giftCard.recipientName,
        senderName: giftCard.senderName,
        message: giftCard.message,
        code: giftCard.code,
        amount,
        itemSummary,
        redeemUrl,
      }).catch((err) => console.error("Failed to send gift card email:", err))
    )
  }

  if (
    (giftCard.deliveryMethod === "SMS" || giftCard.deliveryMethod === "BOTH") &&
    giftCard.recipientPhone
  ) {
    tasks.push(
      sendSMS({
        recipients: [giftCard.recipientPhone],
        message: `${giftCard.senderName} sent you a gift from Polaris Beauty Lounge worth GHS ${amount} (${itemSummary}). Redeem code: ${giftCard.code}. Book now: ${redeemUrl}`,
      }).catch((err) => console.error("Failed to send gift card SMS:", err))
    )
  }

  await Promise.all(tasks)
  await giftCardRepository.markDelivered(giftCard.id)
}
