"use client"

import React, { useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X, LogOut } from "lucide-react"
import { cn, getActivePath } from "@/lib/utils"
import Link from "next/link"
import Image from 'next/image'
import { usePathname } from "next/navigation"
import { navItems } from "@/app/_navigation/sidebar/constants"
import { signInPath, dashboardPath } from "@/app/paths"
import { useSignout } from "@/features/auth/client/hooks/use-sign-out"
import Modal from "@/components/modal"
import { Button } from "@/components/ui/button"

export default function AdminMobileMenu({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const pathname = usePathname()
    const signOutMutation = useSignout()
    const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false)

    const { activeIndex } = getActivePath(
        pathname,
        navItems.map((item) => item.href || ""),
        [signInPath()]
    )

    const handleSignOutClick = (e: React.MouseEvent) => {
        e.preventDefault()
        setIsSignOutModalOpen(true)
    }

    return (
        <>
            <Dialog.Root open={open} onOpenChange={onOpenChange}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

                    <Dialog.Content
                        className={cn(
                            "fixed inset-y-0 left-0 z-50 w-[75vw] max-w-[300px] bg-white shadow-xl transition-transform duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
                            "focus:outline-none flex flex-col"
                        )}
                    >
                        <Dialog.Title className="sr-only">Admin Navigation Menu</Dialog.Title>

                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-4 border-b">
                            <Link href={dashboardPath()} onClick={() => onOpenChange(false)}>
                                <Image
                                    src="/images/polarisicon.png"
                                    alt="Logo"
                                    width={80}
                                    height={40}
                                    priority
                                />
                            </Link>

                            <button
                                onClick={() => onOpenChange(false)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
                            {navItems.map((item, index) => {
                                if (item.separator) {
                                    return <div key={`sep-${index}`} className="my-2 border-t mx-2" />
                                }

                                const isActive = activeIndex === index

                                return (
                                    <Link
                                        key={item.title}
                                        href={item.href || "#"}
                                        onClick={() => onOpenChange(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-fuchsia-50 text-fuchsia-600"
                                                : "text-gray-600 hover:bg-gray-100"
                                        )}
                                    >
                                        {item.icon && React.cloneElement(item.icon as React.ReactElement<any>, { className: "w-5 h-5" })}
                                        <span>{item.title}</span>
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* Footer / Sign Out */}
                        <div className="p-4 border-t">
                            <button
                                onClick={handleSignOutClick}
                                className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium text-gray-600 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                <span>Sign out</span>
                            </button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <Modal
                open={isSignOutModalOpen}
                onClose={() => setIsSignOutModalOpen(false)}
                title="Sign Out?"
                subtitle="Are you sure you want to logout?"
                childrenClassName="max-h-[224px] w-[90vw] max-w-[400px]"
                showSeparator={false}
            >
                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setIsSignOutModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        className="bg-[#D10505] hover:bg-[#D10505]/90 text-white"
                        onClick={() => {
                            signOutMutation.mutateAsync()
                            onOpenChange(false)
                        }}
                        disabled={signOutMutation.isPending}
                    >
                        {signOutMutation.isPending ? "Signing Out..." : "Sign Out"}
                    </Button>
                </div>
            </Modal>
        </>
    )
}
