import AdminMobileHeader from '@/components/admin/admin-mobile-header'

const Layout = async ({ children }: Readonly<{ children: React.ReactNode }>) => {
  // await requireRole([UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.MANAGER]);

  return (
    <div className='flex flex-col h-screen'>
      <AdminMobileHeader />
      <div className='flex flex-1 overflow-hidden'>
        <Sidebar />
        <div className="overflow-y-auto flex-1 h-full">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout
