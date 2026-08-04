import EmailPasswordReset from "@/emails/password/email-password-reset";
import { resend } from "@/lib/resend";
import { EMAIL_FROM } from "@/lib/email-from";

export const sendEmailPasswordReset = async (
  email: string,
  passwordResetLink: string
) => {
  return await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Password Reset from Paulux",
    react: <EmailPasswordReset url={passwordResetLink} />,
  });
}