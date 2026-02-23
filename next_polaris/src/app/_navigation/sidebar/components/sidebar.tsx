'use client'

import { cn, getActivePath } from '@/lib/utils'
import React, { useState } from 'react'
import Image from 'next/image';
import { Menu, LogOut } from 'lucide-react'
import { SidebarItem } from './sidebar-item'
import { NavItem } from '../types'
import { navItems } from '../constants'
import { usePathname } from 'next/navigation'
import { dashboardPath, signInPath } from '@/app/paths'
import Modal from '@/components/modal'
import { Button } from '@/components/ui/button'
import { useSignout } from '@/features/auth/client/hooks/use-sign-out'
import Link from 'next/link'

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true)
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false)
  const pathname = usePathname();
  const signOutMutation = useSignout()

  const { activeIndex } = getActivePath(pathname, navItems.map((item) => item.href), [signInPath()])

  return (
    <nav
      className={cn(
        "hidden md:flex flex-col h-screen  border-r bg-white transition-all duration-300",
        isOpen ? "w-60" : "w-20"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 border-b">

        {isOpen && (
          <div className='flex items-center gap-3'>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 mt-4 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href={dashboardPath()}>
              <Image
                src="/images/polarisicon.png"
                alt="Company Logo"
                width={100}
                height={50}
                priority
              />
            </Link>
            {/* <div className="flex items-center gap-2">
              <span className="font-semibold text-xl text-gray-900">PolarisBooking</span>
            </div> */}
          </div>
        )}

        {!isOpen && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="mx-auto my-10 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((navItem: NavItem, index: number) => (
          <SidebarItem
            key={navItem.title}
            isOpen={isOpen}
            isActive={activeIndex === index}
            navItem={navItem}
          // onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>

      {/* Sign Out */}
      <div className="px-3 py-4 border-t">
        <button
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:text-red-500 hover:bg-gray-100 transition-colors",
            !isOpen && "justify-center"
          )}
          onClick={() => setIsSignOutModalOpen(true)}
        >
          <LogOut className="w-5 h-5" />
          {isOpen && <span className="text-sm">Sign out</span>}
        </button>
      </div>

      <Modal
        open={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        title="Sign Out?"
        subtitle="Are you sure you want to logout? You will be taken back to the login screen and you can log back in later"
        childrenClassName="max-h-[224px] w-[500px]"
        showSeparator={false}
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button className="bg-[#D10505] hover:bg-[#D10505]/90" type="button" onClick={() => setIsSignOutModalOpen(false)}>
            Close
          </Button>
          <Button variant="outline" onClick={() => signOutMutation.mutateAsync()} disabled={signOutMutation.isPending} >
            {signOutMutation.isPending ? "Signing Out..." : "Sign Out"}
          </Button>
        </div>
      </Modal>
    </nav>
  )
}

export default Sidebar