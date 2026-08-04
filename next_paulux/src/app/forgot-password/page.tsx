import { PasswordForgotForm } from '@/features/auth/components/forgot-password-form'

export default function ForgotPasswordPage() {

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      {<PasswordForgotForm />}

    </div>
  )
}