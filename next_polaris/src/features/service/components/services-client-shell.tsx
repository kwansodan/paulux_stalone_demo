'use client'

import React, { useState } from 'react'
import ServicesHeader from './service-header'
import ServiceList from './service-list'
import { SerializedService } from '../types'

interface ServicesClientShellProps {
    initialServices: SerializedService[]
}

const ServicesClientShell = ({ initialServices }: ServicesClientShellProps) => {
    const [searchQuery, setSearchQuery] = useState('')

    return (
        <div className="space-y-6">
            <ServicesHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />
            <ServiceList
                services={initialServices}
                searchQuery={searchQuery}
            />
        </div>
    )
}

export default ServicesClientShell
