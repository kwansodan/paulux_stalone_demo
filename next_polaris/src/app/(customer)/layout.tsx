import LandingFooter from '@/components/landing/landing-footer'
import LandingHeader from '@/components/landing/landing-heading'
import React from 'react'

const Layout = async ({ children }: Readonly<{ children: React.ReactNode }>) => {
  // await requireRole([UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.MANAGER]);

  return (
    <main className="flex flex-col min-h-screen bg-white">
      <LandingHeader />
      {children}
      <LandingFooter />
    </main>
  )
}

export default Layout
