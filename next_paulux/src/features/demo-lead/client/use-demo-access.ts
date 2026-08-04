import { useMutation } from '@tanstack/react-query'
import { publicApi } from '@/lib/api'
import { DemoAccessInput, DemoVerifyInput } from '../utils/validation'

export type DemoCredentials = { email: string; password: string }

type RequestResponse = {
  success: boolean
  data?: { leadId: string }
}

type VerifyResponse = {
  success: boolean
  data?: { credentials: DemoCredentials | null }
}

/** Step 1 — submit details, receive an SMS code. */
export function useRequestDemoAccess() {
  return useMutation({
    mutationFn: async (formInput: DemoAccessInput) => {
      const { data } = await publicApi.post<RequestResponse>('/demo-access', formInput)
      return data
    },
    onError: (error) => {
      console.error('Demo access request error:', error)
    },
  })
}

/** Step 2 — prove the number, receive the credentials. */
export function useVerifyDemoAccess() {
  return useMutation({
    mutationFn: async (input: DemoVerifyInput) => {
      const { data } = await publicApi.post<VerifyResponse>('/demo-access/verify', input)
      return data
    },
    onError: (error) => {
      console.error('Demo verification error:', error)
    },
  })
}
