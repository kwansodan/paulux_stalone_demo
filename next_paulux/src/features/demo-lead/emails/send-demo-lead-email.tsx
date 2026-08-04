import DemoLeadEmail from "@/emails/demo/demo-lead-email"
import { resend } from "@/lib/resend"
import { EMAIL_FROM } from "@/lib/email-from"

type SendDemoLeadEmailArgs = {
  to: string[]
  name: string
  email: string
  business?: string | null
  phone?: string | null
  message?: string | null
  requestedAt: Date
}

export const sendDemoLeadEmail = async ({
  to,
  name,
  email,
  business,
  phone,
  message,
  requestedAt,
}: SendDemoLeadEmailArgs) => {
  const who = business ? `${name} (${business})` : name

  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    // Reply goes straight to the prospect rather than to the sending domain.
    replyTo: email,
    subject: `New demo request: ${who}`,
    react: (
      <DemoLeadEmail
        name={name}
        email={email}
        business={business}
        phone={phone}
        message={message}
        requestedAt={requestedAt.toUTCString()}
      />
    ),
  })
}
