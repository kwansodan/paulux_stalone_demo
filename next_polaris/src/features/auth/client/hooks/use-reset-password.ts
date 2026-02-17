import { useMutation } from '@tanstack/react-query'
import { PasswordResetInput } from '../../utils/validation'
// import { useRouter } from 'next/navigation'
// import { dashboardPath } from '@/app/paths'
// import { toast } from 'sonner'
import { api } from '@/lib/api'

export function useResetPassword() {
  // const router = useRouter()

  return useMutation({
    mutationFn: async (formInput: PasswordResetInput) => {
      const { data } = await api.post(
        '/reset-password',
        formInput
      )
      
      return data
    },
    onSuccess: (data) => {
      console.log('Reset successful', data)
      return data
    },
    onError: (error) => {
      console.error('Reset Password error:', error)
    },
  })
}