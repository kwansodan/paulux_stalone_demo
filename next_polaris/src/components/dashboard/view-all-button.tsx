'use client'


import { bookingsPath } from '@/app/paths'
import Link from 'next/link'
import React from 'react'

const ViewAllButton = () => {
  return (
    <Link href={bookingsPath()} className="text-sm text-purple-600">
      View all
    </Link>
  )
}

export default ViewAllButton
