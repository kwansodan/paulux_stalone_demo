'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormLabel } from '@/components/ui/form'
import { ForgotPasswordInput, ForgotPasswordSchema } from '../utils/validation'
import { isAxiosError } from '@/lib/utils'
import { useForgotPassword } from '../client/hooks/use-forgot-password'
import { CardCompact } from '@/components/card-compact'
import { BackButton } from '@/components/back-button'
import { signInPath } from '@/app/paths'


export function PasswordForgotForm() {
  const forgotPasswordMutation = useForgotPassword()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState<string | null>(null)

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    await forgotPasswordMutation.mutateAsync(data)
    setEmail(data.email)
    setStep(2)
  }

  const handleOpenEmail = () => {
    // For mobile devices
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.href = 'mailto:'
    } else {
      // For desktop - try to detect email provider from email domain
      const domain = email?.split('@')[1]

      if (domain?.includes('gmail')) {
        window.open('https://mail.google.com', '_blank')
      } else if (domain?.includes('outlook') || domain?.includes('hotmail') || domain?.includes('live')) {
        window.open('https://outlook.live.com', '_blank')
      } else if (domain?.includes('yahoo')) {
        window.open('https://mail.yahoo.com', '_blank')
      } else {
        // Default to opening default mail client
        window.location.href = 'mailto:'
      }
    }
  }


  return (
    <div className="w-145 ">
      {step === 1 && (
        <div className=" flex-col space-y-4 items-center justify-center bg-gray-100">
          <div className="w-full flex justify-start">
            <BackButton href={signInPath()} label='Back to Login' />
          </div>
          <CardCompact
            title="Forgot Password"
            description="Enter email to receive you password reset link"
            headerIcon={<Sparkles className="w-6 h-6 text-purple-600" />}
            className="w-full bg-white rounded-3xl border-0 shadow-none max-w-142.5"
            content={
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


                  <Button
                    type="submit"
                    disabled={forgotPasswordMutation.isPending}
                    className="w-full h-12 bg-[#A800B7] hover:bg-[#A800B7]/90 text-white rounded-lg font-normal text-base mt-8"
                  >
                    {forgotPasswordMutation.isPending ? 'Submittig...' : 'Submit'}
                  </Button>

                  {forgotPasswordMutation.isError && (
                    <p className="text-red-500 text-sm text-center">
                      {isAxiosError(forgotPasswordMutation.error)
                        ? (forgotPasswordMutation.error as any).response?.data?.message || (forgotPasswordMutation.error as any).message
                        : "Submission failed. Please check your credentials."}
                    </p>
                  )}
                </form>
              </Form>
            }
          />
        </div>)}
      {step === 2 && email && (
        <div className=" flex-col items-center justify-center bg-gray-100">
          <div className="w-full flex justify-start">
            <BackButton href={signInPath()} label='Back to Login' />
          </div>
          <CardCompact
            title="Check Your Inbox"
            description={`We’ve sent a mail to ${email} to reset your password.`}
            headerIcon={<Mail className="w-6 h-6 text-purple-600" />}
            showSeparator={false}
            className="w-full bg-transparent! rounded-3xl border-0 shadow-none max-w-142.5"
            content={
              <div className='w-full flex flex-col gap-2'>
                <Button
                  type="button"
                  onClick={handleOpenEmail}
                  className="w-full h-12 bg-[#A800B7] hover:bg-[#A800B7]/90 text-white rounded-lg font-normal text-base mt-2"
                >
                  Open Email
                </Button>
                <div className="flex items-center ">
                  <span>Didn&apos;t Receive Mail?</span>
                  <Button className='text-fuchsia-500' variant={'ghost'} onClick={() => {
                    setEmail(null)
                    setStep(1)
                  }}>Request new mail</Button>
                </div>

              </div>}
          />
        </div>
      )}
    </div>
  )
}