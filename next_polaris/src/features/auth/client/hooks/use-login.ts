import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { LoginInput } from '../../utils/validation'
import { dashboardPath, stylistPath } from '@/app/paths'
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
      if (data.success !== true) return

      const user = data.data?.user
      const hasAdminAccess =
        user?.role === 'ADMIN' ||
        user?.role === 'SUPER_ADMIN' ||
        (Array.isArray(user?.permissions) && user.permissions.length > 0)

      // Pure stylists (no admin access) go to their own portal; everyone with
      // admin access lands on the dashboard.
      if (!hasAdminAccess && user?.isStylist) {
        toast('Login successful. Redirecting to your jobs…')
        router.push(stylistPath())
      } else {
        toast('Login successful. Redirecting…')
        router.push(dashboardPath())
      }
    },
    onError: (error) => {
      console.error('Login error:', error)
    },
  })
}