import { useMutation } from '@tanstack/react-query'
import { ForgotPasswordInput } from '../../utils/validation'
// import { useRouter } from 'next/navigation'
// import { dashboardPath } from '@/app/paths'
import { toast } from 'sonner'
import { api } from '@/lib/api'

export function useForgotPassword() {
  // const router = useRouter()

  return useMutation({
    mutationFn: async (formInput: ForgotPasswordInput) => {
      const { data } = await api.post(
        '/forgot-password',
        formInput
      )
      
      return data
    },
    onSuccess: (data) => {
      console.log('Password Forgot Initiation successful', data)
      toast("Password Forgot Initiation Successful")
      // router.push(dashboardPath())
      // Store token, redirect, etc.
      return data
    },
    onError: (error) => {
      console.error('Password Forgot Initiation error:', error)
    },
  })
}