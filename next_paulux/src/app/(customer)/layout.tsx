import LandingFooter from '@/components/landing/landing-footer'
import LandingHeader from '@/components/landing/landing-heading'
import FloatingSocialButtons from '@/components/landing/floating-social-buttons'
import DemoBanner from '@/components/landing/demo-banner'
import React from 'react'

const Layout = async ({ children }: Readonly<{ children: React.ReactNode }>) => {
  // await requireRole([UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.MANAGER]);

  return (
    <main className="flex flex-col min-h-screen bg-white">
      <DemoBanner />
      <LandingHeader />
      {children}
      <LandingFooter />
      <FloatingSocialButtons />
    </main>
  )
}

export default Layout
