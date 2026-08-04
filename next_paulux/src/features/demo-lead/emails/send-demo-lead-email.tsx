import DemoLeadEmail from "@/emails/demo/demo-lead-email"
import { resend } from "@/lib/resend"
import { EMAIL_FROM } from "@/lib/email-from"

type SendDemoLeadEmailArgs = {
  to: string[]
  name: string
  phone: string
  email?: string | null
  business?: string | null
  message?: string | null
  requestedAt: Date
}

export const sendDemoLeadEmail = async ({
  to,
  name,
  phone,
  email,
  business,
  message,
  requestedAt,
}: SendDemoLeadEmailArgs) => {
  const who = business ? `${name} (${business})` : name

  return resend.emails.send({
    from: EMAIL_FROM,
    to,
    // Reply goes to the prospect when they left an address. Email is optional
    // now, so this is set only when there is somewhere to reply to.
    ...(email ? { replyTo: email } : {}),
    subject: `New demo request: ${who} — ${phone}`,
    react: (
      <DemoLeadEmail
        name={name}
        phone={phone}
        email={email}
        business={business}
        message={message}
        requestedAt={requestedAt.toUTCString()}
      />
    ),
  })
}
