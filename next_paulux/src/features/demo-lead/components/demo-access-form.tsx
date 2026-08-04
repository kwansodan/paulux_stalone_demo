'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormField, FormLabel } from '@/components/ui/form'
import { DemoAccessInput, DemoAccessSchema } from '../utils/validation'
import { useDemoAccess, type DemoCredentials } from '../client/use-demo-access'
import { isAxiosError } from '@/lib/utils'

const inputClass = 'h-12 bg-white shadow-none border-[#E2E8F0] rounded-lg'

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard is unavailable over plain HTTP on some browsers; the value
      // is on screen anyway, so a failure here is not worth surfacing.
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[#E2E8F0] bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
        <p className="truncate text-sm text-gray-900">{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${label.toLowerCase()}`}
        className="shrink-0 text-gray-400 hover:text-gray-700"
      >
        {copied ? <Check size={18} /> : <Copy size={18} />}
      </button>
    </div>
  )
}

export function DemoAccessForm() {
  const demoAccess = useDemoAccess()
  const [credentials, setCredentials] = useState<DemoCredentials | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<DemoAccessInput>({
    resolver: zodResolver(DemoAccessSchema),
    defaultValues: {
      name: '',
      email: '',
      business: '',
      phone: '',
      message: '',
      website: '',
    },
  })

  const onSubmit = async (data: DemoAccessInput) => {
    try {
      const result = await demoAccess.mutateAsync(data)
      setCredentials(result.data?.credentials ?? null)
      setSubmitted(true)
    } catch {
      // Swallowed on purpose: the failure is rendered from demoAccess.isError
      // below, and letting it escape here would be an unhandled rejection.
    }
  }

  if (submitted) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          Thanks — you&apos;re all set. Sign in above with these details.
        </p>

        {credentials ? (
          <div className="space-y-3">
            <CopyRow label="Email" value={credentials.email} />
            <CopyRow label="Password" value={credentials.password} />
            <p className="text-xs text-gray-500">
              This is a shared demo account with sample data. Feel free to change
              anything — it gets reset periodically.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-700">
            We&apos;ve got your details and will send your access shortly.
          </p>
        )}
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <div className="space-y-2">
              <FormLabel className="text-sm font-normal text-foreground">Your name</FormLabel>
              <Input placeholder="enter your name" className={inputClass} {...field} />
              {form.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <div className="space-y-2">
              <FormLabel className="text-sm font-normal text-foreground">Email</FormLabel>
              <Input placeholder="enter email" className={inputClass} {...field} />
              {form.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>
          )}
        />

        <FormField
          control={form.control}
          name="business"
          render={({ field }) => (
            <div className="space-y-2">
              <FormLabel className="text-sm font-normal text-foreground">
                Business name <span className="text-gray-400">(optional)</span>
              </FormLabel>
              <Input placeholder="enter business name" className={inputClass} {...field} />
            </div>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <div className="space-y-2">
              <FormLabel className="text-sm font-normal text-foreground">
                Phone <span className="text-gray-400">(optional)</span>
              </FormLabel>
              <Input placeholder="enter phone number" className={inputClass} {...field} />
            </div>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <div className="space-y-2">
              <FormLabel className="text-sm font-normal text-foreground">
                What are you hoping to see? <span className="text-gray-400">(optional)</span>
              </FormLabel>
              <Textarea
                placeholder="tell us a little about your salon"
                className="bg-white shadow-none border-[#E2E8F0] rounded-lg"
                rows={3}
                {...field}
              />
            </div>
          )}
        />

        {/* Honeypot: hidden from people, irresistible to bots. */}
        <div className="hidden" aria-hidden="true">
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <Input tabIndex={-1} autoComplete="off" {...field} />
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={demoAccess.isPending}
          className="w-full h-12 bg-[#A800B7] hover:bg-[#A800B7]/90 text-white rounded-lg font-normal text-base"
        >
          {demoAccess.isPending ? 'Sending...' : 'Get demo access'}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          We&apos;ll use these details to follow up about the product. Nothing else.
        </p>

        {demoAccess.isError && (
          <p className="text-red-500 text-sm text-center">
            {isAxiosError(demoAccess.error)
              ? (demoAccess.error as any).response?.data?.message || (demoAccess.error as any).message
              : 'Could not send your request. Please try again.'}
          </p>
        )}
      </form>
    </Form>
  )
}
