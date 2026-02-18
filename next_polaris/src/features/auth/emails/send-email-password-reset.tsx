import EmailPasswordReset from "@/emails/password/email-password-reset";
import { resend } from "@/lib/resend";


export const sendEmailPasswordReset = async (
    email: string,
    passwordResetLink: string
) => {
    return await resend.emails.send({
      from: "no-reply@app.ishmaelsroadstonextapp.com",
      to: email,
      subject: "Password Reset from Polaris",
      react: <EmailPasswordReset url={passwordResetLink} />,
    });
}