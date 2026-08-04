import { useMutation } from '@tanstack/react-query'
import { publicApi } from '@/lib/api'
import { DemoAccessInput } from '../utils/validation'

export type DemoCredentials = { email: string; password: string }

type DemoAccessResponse = {
  success: boolean
  data?: { credentials: DemoCredentials | null }
}

export function useDemoAccess() {
  return useMutation({
    mutationFn: async (formInput: DemoAccessInput) => {
      const { data } = await publicApi.post<DemoAccessResponse>('/demo-access', formInput)
      return data
    },
    onError: (error) => {
      console.error('Demo access request error:', error)
    },
  })
}
