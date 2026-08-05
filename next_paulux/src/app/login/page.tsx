import Link from 'next/link'
import { LoginForm } from '@/features/auth/components/login-form'
import { CardCompact } from '@/components/card-compact'
import { Sparkles } from 'lucide-react'
import { tryDemoPath } from '@/app/paths'

export default function LoginPage() {

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12">
      <CardCompact
        title="Admin login"
        description="Sign in to manage your salon"
        headerIcon={<Sparkles className="w-6 h-6 text-purple-600" />}
        className="w-full bg-white rounded-3xl border-0 shadow-none max-w-142.5"
        content={
          <>
            <LoginForm />

            {/* A pointer, not a second form. The demo gate lives on /try, where
                it can explain itself; stacking it here buried the people who
                need it under a form they can't use. */}
            <p className="mt-8 border-t border-gray-100 pt-6 text-center text-sm text-gray-600">
              No login yet?{' '}
              <Link
                href={tryDemoPath()}
                className="font-medium text-[#A800B7] hover:underline"
              >
                Get demo access
              </Link>
            </p>
          </>
        }
      />
    </div>
  )
}
