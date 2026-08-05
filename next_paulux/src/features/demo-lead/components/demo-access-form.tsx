'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormField, FormLabel } from '@/components/ui/form'
import {
  DemoAccessInput,
  DemoAccessSchema,
  DemoCodeInput,
  DemoCodeSchema,
} from '../utils/validation'
import {
  useRequestDemoAccess,
  useVerifyDemoAccess,
  type DemoCredentials,
} from '../client/use-demo-access'
import { isAxiosError } from '@/lib/utils'

const inputClass = 'h-12 bg-white shadow-none border-[#E2E8F0] rounded-lg'

const errorMessage = (error: unknown, fallback: string) =>
  isAxiosError(error)
    ? (error as any).response?.data?.message || (error as any).message
    : fallback

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
  const requestAccess = useRequestDemoAccess()
  const verifyAccess = useVerifyDemoAccess()

  const [leadId, setLeadId] = useState<string | null>(null)
  const [sentTo, setSentTo] = useState('')
  const [credentials, setCredentials] = useState<DemoCredentials | null>(null)
  const [done, setDone] = useState(false)

  const detailsForm = useForm<DemoAccessInput>({
    resolver: zodResolver(DemoAccessSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      business: '',
      message: '',
      website: '',
    },
  })

  const codeForm = useForm<DemoCodeInput>({
    resolver: zodResolver(DemoCodeSchema),
    defaultValues: { code: '' },
  })

  const onRequest = async (data: DemoAccessInput) => {
    try {
      const result = await requestAccess.mutateAsync(data)
      const id = result.data?.leadId
      if (!id) return
      setLeadId(id)
      setSentTo(data.phone)
      codeForm.reset({ code: '' })
    } catch {
      // Rendered from requestAccess.isError below; rethrowing here would only
      // produce an unhandled rejection.
    }
  }

  const onVerify = async (data: DemoCodeInput) => {
    if (!leadId) return
    try {
      const result = await verifyAccess.mutateAsync({ leadId, code: data.code })
      setCredentials(result.data?.credentials ?? null)
      setDone(true)
    } catch {
      // Rendered from verifyAccess.isError below.
    }
  }

  const backToDetails = () => {
    // Re-submitting the details issues a fresh code and retires the old one,
    // so there is no separate resend endpoint to keep in sync.
    codeForm.reset({ code: '' })
    setLeadId(null)
  }

  // ── Step 3: verified ──────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          Number verified — you&apos;re all set. Sign in above with these details.
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

  // ── Step 2: enter the code ────────────────────────────────────────────────
  if (leadId) {
    return (
      <Form {...codeForm}>
        <form onSubmit={codeForm.handleSubmit(onVerify)} className="space-y-5">
          <p className="text-sm text-gray-700">
            We sent a 6-digit code to <span className="font-medium">{sentTo}</span>.
          </p>

          <FormField
            control={codeForm.control}
            name="code"
            render={({ field }) => (
              <div className="space-y-2">
                <FormLabel className="text-sm font-normal text-foreground">
                  Verification code
                </FormLabel>
                {/* value/onChange come AFTER the spread on purpose: they must
                    win, so the field can never end up controlled with a value
                    that nothing updates — which shows as typing doing nothing. */}
                <Input
                  {...field}
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="000000"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  className={`${inputClass} tracking-[0.4em] text-center text-lg text-gray-900`}
                />
                {codeForm.formState.errors.code && (
                  <p className="text-red-500 text-sm mt-1">
                    {codeForm.formState.errors.code.message}
                  </p>
                )}
              </div>
            )}
          />

          <Button
            type="submit"
            disabled={verifyAccess.isPending}
            className="w-full h-12 bg-[#A800B7] hover:bg-[#A800B7]/90 text-white rounded-lg font-normal text-base"
          >
            {verifyAccess.isPending ? 'Verifying...' : 'Verify number'}
          </Button>

          <button
            type="button"
            onClick={backToDetails}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Didn&apos;t get it? Go back and try again
          </button>

          {verifyAccess.isError && (
            <p className="text-red-500 text-sm text-center">
              {errorMessage(verifyAccess.error, 'Could not verify the code. Please try again.')}
            </p>
          )}
        </form>
      </Form>
    )
  }

  // ── Step 1: details ───────────────────────────────────────────────────────
  return (
    <Form {...detailsForm}>
      <form onSubmit={detailsForm.handleSubmit(onRequest)} className="space-y-5">
        <FormField
          control={detailsForm.control}
          name="name"
          render={({ field }) => (
            <div className="space-y-2">
              <FormLabel className="text-sm font-normal text-foreground">Your name</FormLabel>
              <Input placeholder="enter your name" className={inputClass} {...field} />
              {detailsForm.formState.errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {detailsForm.formState.errors.name.message}
                </p>
              )}
            </div>
          )}
        />

        <FormField
          control={detailsForm.control}
          name="phone"
          render={({ field }) => (
            <div className="space-y-2">
              <FormLabel className="text-sm font-normal text-foreground">Mobile number</FormLabel>
              <Input
                placeholder="024 000 0000"
                inputMode="tel"
                autoComplete="tel"
                className={inputClass}
                {...field}
              />
              <p className="text-xs text-gray-500">We&apos;ll text you a code to verify it.</p>
              {detailsForm.formState.errors.phone && (
                <p className="text-red-500 text-sm mt-1">
                  {detailsForm.formState.errors.phone.message}
                </p>
              )}
            </div>
          )}
        />

        <FormField
          control={detailsForm.control}
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
          control={detailsForm.control}
          name="email"
          render={({ field }) => (
            <div className="space-y-2">
              <FormLabel className="text-sm font-normal text-foreground">
                Email <span className="text-gray-400">(optional)</span>
              </FormLabel>
              <Input placeholder="enter email" className={inputClass} {...field} />
              {detailsForm.formState.errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {detailsForm.formState.errors.email.message}
                </p>
              )}
            </div>
          )}
        />

        <FormField
          control={detailsForm.control}
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
            control={detailsForm.control}
            name="website"
            render={({ field }) => <Input tabIndex={-1} autoComplete="off" {...field} />}
          />
        </div>

        <Button
          type="submit"
          disabled={requestAccess.isPending}
          className="w-full h-12 bg-[#A800B7] hover:bg-[#A800B7]/90 text-white rounded-lg font-normal text-base"
        >
          {requestAccess.isPending ? 'Sending code...' : 'Send me a code'}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          We&apos;ll use these details to follow up about the product, and we
          record which parts of the demo you visit so we know what to show you.
        </p>

        {requestAccess.isError && (
          <p className="text-red-500 text-sm text-center">
            {errorMessage(requestAccess.error, 'Could not send your request. Please try again.')}
          </p>
        )}
      </form>
    </Form>
  )
}
