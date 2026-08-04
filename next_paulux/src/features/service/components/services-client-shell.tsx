'use client'

import React, { useState } from 'react'
import ServicesHeader from './service-header'
import ServiceList from './service-list'
import { SerializedService } from '../types'
import PackagesShell from '@/features/package/components/packages-shell'
import { SerializedPackage } from '@/features/package/types'

interface ServicesClientShellProps {
  initialServices: SerializedService[]
  initialPackages: SerializedPackage[]
}

const ServicesClientShell = ({ initialServices, initialPackages }: ServicesClientShellProps) => {
  const [activeTab, setActiveTab] = useState<'services' | 'packages'>('services')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Services</h1>
        <p className="text-sm sm:text-[16px] text-gray-600">Manage your salon services and packages</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('services')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'services'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Services
        </button>
        <button
          onClick={() => setActiveTab('packages')}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'packages'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Packages
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'services' && (
        <>
          <ServicesHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
          <ServiceList services={initialServices} searchQuery={searchQuery} />
        </>
      )}

      {activeTab === 'packages' && (
        <PackagesShell initialPackages={initialPackages} services={initialServices} />
      )}
    </div>
  )
}

export default ServicesClientShell
