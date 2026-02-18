'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormLabel } from '@/components/ui/form'
import { PasswordResetInput, PasswordResetSchema } from '../utils/validation'
import { isAxiosError } from '@/lib/utils'
import { CardCompact } from '@/components/card-compact'
import { BackButton } from '@/components/back-button'
import { signInPath } from '@/app/paths'
import { useState } from 'react'
import { useResetPassword } from '../client/hooks/use-reset-password'
import { CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'


export function ResetPasswordForm({ tokenId } : { tokenId: string }) {
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const resetPasswordMutation = useResetPassword(tokenId)
  const router = useRouter()

  const form = useForm<PasswordResetInput>({
    resolver: zodResolver(PasswordResetSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: PasswordResetInput) => {
    await resetPasswordMutation.mutateAsync(data)
    setStep(2)

    // Redirect to login page after 3 seconds
    setTimeout(() => {
      router.push(signInPath())
    }, 3000)
  }


  return (
    <>
      {step === 1 && (
        <div className="w-145 gap-6 flex flex-col items-center justify-center bg-white">
          <div className="w-full flex justify-start">
            <BackButton href={signInPath()} label='Back to Login' />
          </div>
          <CardCompact
            title="Reset Password"
            className="w-full bg-white rounded-3xl border-0 shadow-none max-w-142.5"
            content={
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                            placeholder="enter password"
                            className="h-12 bg-white shadow-none border-[#E2E8F0] rounded-lg pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
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

                  {/* Confirm Password Field */}
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <FormLabel className="text-sm font-normal text-foreground">
                          Confirm Password
                        </FormLabel>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="confirm password"
                            className="h-12 bg-white shadow-none border-[#E2E8F0] rounded-lg pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                        {form.formState.errors.confirmPassword && (
                          <p className="text-red-500 text-sm mt-1">
                            {form.formState.errors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                    )}
                  />


                  <Button
                    type="submit"
                    disabled={resetPasswordMutation.isPending}
                    className="w-full h-12 bg-[#A800B7] hover:bg-[#A800B7]/90 text-white rounded-lg font-normal text-base mt-8"
                  >
                    {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                  </Button>

                  {resetPasswordMutation.isError && (
                    <p className="text-red-500 text-sm text-center">
                      {isAxiosError(resetPasswordMutation.error)
                        ? resetPasswordMutation.error.response?.data?.message || resetPasswordMutation.error.message
                        : "Password reset failed. Please try again."}
                    </p>
                  )}
                </form>
              </Form>
            }
          />
        </div>
      )}
      {step === 2 && (
        <div className="w-full min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center space-y-4 max-w-md px-6">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900">
              You&apos;re all set!
            </h2>

            <p className="text-sm text-gray-600 leading-relaxed">
              You successfully reset your password, we&apos;re taking you back to the login screen to login again
            </p>
          </div>
        </div>
      )}
    </>
  )
}