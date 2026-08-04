"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import { Menu } from 'lucide-react'
import Link from 'next/link'
import { dashboardPath } from '@/app/paths'
import AdminMobileMenu from './admin-mobile-menu'

export default function AdminMobileHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
        <>
            <header className="flex md:hidden items-center justify-between px-4 py-3 bg-white border-b sticky top-0 z-30">
                <Link href={dashboardPath()} className="flex items-center gap-2">
                    <Image
                        src="/images/pauluxicon.png"
                        alt="Paulux Logo"
                        width={80}
                        height={40}
                        priority
                    />
                </Link>

                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Open navigation menu"
                >
                    <Menu className="w-6 h-6 text-gray-700" />
                </button>
            </header>

            <AdminMobileMenu
                open={isMenuOpen}
                onOpenChange={setIsMenuOpen}
            />
        </>
    )
}
