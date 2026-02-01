// import { requireRole } from '@/app/_auth/require-role';
import React from 'react'
import Sidebar from '../_navigation/sidebar/components/sidebar'

const Layout = async ({ children }: Readonly<{ children: React.ReactNode }>) => {
  // await requireRole([UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.MANAGER]);

  return (
    <div className='flex h-screen'>
      <Sidebar/>
      <div className="overflow-y-scroll flex-1">
      {children}
      </div>
    </div>
  )
}

export default Layout
