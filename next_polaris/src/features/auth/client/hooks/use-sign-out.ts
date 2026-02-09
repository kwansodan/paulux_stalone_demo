import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { signInPath } from '@/app/paths'

export function useSignout() {
  const router = useRouter()

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.get('/logout')
      
      return data
    },
    onSuccess: (data) => {
      console.log('Signout successful', data)
      // toast("Login Successful. Redirecting to Dashboard")
      router.push(signInPath())
      // Store token, redirect, etc.
    },
    onError: (error) => {
      console.error('Login error:', error)
    },
  })
}