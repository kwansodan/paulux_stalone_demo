import AdminMobileHeader from '@/components/admin/admin-mobile-header'
import DemoActivityBeacon from '@/components/demo-activity-beacon'
import Sidebar from '@/app/_navigation/sidebar/components/sidebar'
import { isAuthenticated } from '@/app/_auth/is-authenticated'
import { UserRole } from '@generated/prisma/client'

const Layout = async ({ children }: Readonly<{ children: React.ReactNode }>) => {
  const { user } = await isAuthenticated()

  const isFullAccess =
    !user ||
    user.role === UserRole.ADMIN ||
    (user.role as string) === "SUPER_ADMIN"

  const userPermissions: string[] = isFullAccess
    ? ["*"]
    : ((user as any)?.customRole?.permissions ?? [])

  return (
    <div className='flex flex-col h-screen'>
      {/* No-ops for anyone without the signed demo cookie, i.e. all staff. */}
      <DemoActivityBeacon />
      <AdminMobileHeader />
      <div className='flex flex-1 overflow-hidden'>
        <Sidebar userPermissions={userPermissions} />
        <div className="overflow-y-auto flex-1 h-full">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout
