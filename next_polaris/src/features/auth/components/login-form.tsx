'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormLabel } from '@/components/ui/form'
import { LoginInput, LoginSchema } from '../utils/validation'
import { useLogin } from '../client/hooks/use-login'
import Link from 'next/link'
import { forgotPasswordPath } from '@/app/paths'
import { isAxiosError } from '@/lib/utils'


export function LoginForm() {
  const loginMutation = useLogin()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginInput) => {
    await loginMutation.mutateAsync(data)
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <div className="space-y-2">
              <FormLabel className="text-sm font-normal text-foreground">
                Email
              </FormLabel>
              <Input
                placeholder="enter email"
                className="h-12 bg-white shadow-none border-[#E2E8F0] rounded-lg"
                {...field}
              />
              {form.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
          )}
        />

        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <div className="space-y-2">
              <FormLabel className="text-sm font-normal text-foreground">
                Password
              </FormLabel>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  className="h-12 bg-white  shadow-none border-[#E2E8F0] rounded-lg pr-10"
                  {...field}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
          )}
        />

        <Link
          className="text-sm text-red-500 hover:text-red-600 px-2.5"
          href={forgotPasswordPath()}
        >
          Forgot password
        </Link>

        <Button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full h-12 bg-[#A800B7] hover:bg-[#A800B7]/90 text-white rounded-lg font-normal text-base mt-8"
        >
          {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
        </Button>

        {loginMutation.isError && (
          <p className="text-red-500 text-sm text-center">
            {isAxiosError(loginMutation.error)
              ? (loginMutation.error as any).response?.data?.message || (loginMutation.error as any).message
              : "Login failed. Please check your credentials."}
          </p>
        )}
      </form>
    </Form>
  )
}