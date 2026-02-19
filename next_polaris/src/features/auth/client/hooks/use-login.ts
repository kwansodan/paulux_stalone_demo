import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { LoginInput } from '../../utils/validation'
import { dashboardPath } from '@/app/paths'
import { toast } from 'sonner'
import { publicApi } from '@/lib/api'

export function useLogin() {
  const router = useRouter()

  return useMutation({
    mutationFn: async (formInput: LoginInput) => {
      const { data } = await publicApi.post(
        '/login',
        formInput
      )
      
      return data
    },
    onSuccess: (data) => {
      console.log('Login successful', data)
      if(data.success === true){
        toast("Login Successful. Redirecting to Dashboard")
        router.push(dashboardPath())
      }
      // Store token, redirect, etc.
    },
    onError: (error) => {
      console.error('Login error:', error)
    },
  })
}