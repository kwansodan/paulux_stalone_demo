import GiftCardRecipientEmail from "@/emails/gift-card/gift-card-recipient-email"
import { resend } from "@/lib/resend"

export const sendGiftCardRecipientEmail = async ({
  to,
  recipientName,
  senderName,
  message,
  code,
  amount,
  itemSummary,
  redeemUrl,
}: {
  to: string
  recipientName: string
  senderName: string
  message?: string | null
  code: string
  amount: string
  itemSummary?: string
  redeemUrl: string
}) => {
  return await resend.emails.send({
    from: "no-reply@pauluxbooking.com",
    to,
    subject: `${senderName} sent you a gift from Paulux Booking!`,
    react: (
      <GiftCardRecipientEmail
        recipientName={recipientName}
        senderName={senderName}
        message={message}
        code={code}
        amount={amount}
        itemSummary={itemSummary}
        redeemUrl={redeemUrl}
      />
    ),
  })
}
