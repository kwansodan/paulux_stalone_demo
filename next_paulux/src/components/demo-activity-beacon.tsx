'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Reports the current admin page to /api/demo-activity on every navigation.
 *
 * Renders nothing. The server ignores anyone without the signed demo cookie,
 * so staff browsing the admin generate no rows — only prospects who came
 * through the demo gate are recorded.
 *
 * Deliberately not middleware: middleware runs on the Edge runtime by default,
 * where Prisma can't run, and Node middleware is still experimental.
 */
export default function DemoActivityBeacon() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return

    // keepalive lets the request outlive the navigation that triggered it.
    // Failures are swallowed: measurement must never break the page.
    fetch('/api/demo-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {})
  }, [pathname])

  return null
}
