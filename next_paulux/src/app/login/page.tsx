import { LoginForm } from '@/features/auth/components/login-form'
import { DemoAccessForm } from '@/features/demo-lead/components/demo-access-form'
import { CardCompact } from '@/components/card-compact'
import { Sparkles, KeyRound } from 'lucide-react'

export default function LoginPage() {

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gray-100 py-12">
      <CardCompact
        title="Admin login"
        description="Sign in to manage your salon"
        headerIcon={<Sparkles className="w-6 h-6 text-purple-600" />}
        className="w-full bg-white rounded-3xl border-0 shadow-none max-w-142.5"
        content={<LoginForm />}
      />

      {/* Demo gate: the only route into this deployment for someone who hasn't
          been given credentials, so it doubles as the lead capture. */}
      <CardCompact
        title="New here?"
        description="Tell us who you are and we'll hand you the keys"
        headerIcon={<KeyRound className="w-6 h-6 text-purple-600" />}
        className="w-full bg-white rounded-3xl border-0 shadow-none max-w-142.5"
        content={<DemoAccessForm />}
      />
    </div>
  )
}
