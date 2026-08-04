'use client'

import { cn } from '@/lib/utils'
import Link from 'next/link'
import { NavItem } from '../types'
import React from 'react'

interface SidebarItemProps {
  navItem: NavItem
  isOpen: boolean
  isActive: boolean
  onClick?: () => void
}

export function SidebarItem({ navItem, isOpen, isActive, onClick }: SidebarItemProps) {
  const content = (
    <div className={cn(
      "flex flex-row gap-4 p-2"
    )}>
      {React.cloneElement(navItem.icon, {
        className: cn(
          "w-5 h-5 flex-shrink-0",
          isActive ? "text-fuchsia-600" : "text-gray-600"
        )
      })}
      {isOpen && (
        <span
          className={cn(
            "text-sm font-medium",
            isActive ? "text-fuchsia-800" : "text-gray-700"
          )}
        >
          {navItem.title}
        </span>
      )}
    </div>
  )

  return (
    <Link
      href={navItem.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
        isActive && "bg-fuchsia-100",
        !isActive && "hover:bg-gray-50",
        !isOpen && "justify-start"
      )}
    >
      {content}
    </Link>
  )
}