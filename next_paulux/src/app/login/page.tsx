import { LoginForm } from '@/features/auth/components/login-form'
import { CardCompact } from '@/components/card-compact'
import { Sparkles } from 'lucide-react'

export default function LoginPage() {

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <CardCompact
        title="Admin login"
        description="Sign in to manage your salon"
        headerIcon={<Sparkles className="w-6 h-6 text-purple-600" />}
        className="w-full bg-white rounded-3xl border-0 shadow-none max-w-142.5"
        content={<LoginForm />}
      />
    </div>
  )
}