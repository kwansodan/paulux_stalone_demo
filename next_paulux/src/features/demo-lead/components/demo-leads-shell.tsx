"use client"

import { useMemo, useState } from "react"
import Pagination from "@/components/pagination"

export type DemoLeadRow = {
  id: string
  name: string
  phone: string
  email: string | null
  business: string | null
  message: string | null
  createdAt: string
  verifiedAt: string | null
  viewCount: number
  lastSeenAt: string | null
  recentPaths: string[]
}

const PAGE_SIZE = 20

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—"

/** "/gift-card-orders" -> "Gift card orders" */
const prettyPath = (path: string) => {
  const segment = path.split("/").filter(Boolean)[0] ?? path
  const words = segment.replace(/-/g, " ")
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** Sections they visited, most-visited first. */
const topSections = (paths: string[]) => {
  const counts = new Map<string, number>()
  for (const p of paths) {
    const label = prettyPath(p)
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([label]) => label)
}

export default function DemoLeadsShell({
  leads,
  unverifiedCount,
}: {
  leads: DemoLeadRow[]
  unverifiedCount: number
}) {
  const [page, setPage] = useState(1)

  const pageCount = Math.max(1, Math.ceil(leads.length / PAGE_SIZE))
  const visible = useMemo(
    () => leads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [leads, page]
  )

  const engaged = leads.filter((l) => l.viewCount > 0).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Verified leads" value={leads.length} />
        <Stat
          label="Actually used the demo"
          value={engaged}
          hint={leads.length ? `${Math.round((engaged / leads.length) * 100)}% of verified` : undefined}
        />
        <Stat
          label="Started but never verified"
          value={unverifiedCount}
          hint="Requested a code, never entered it"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <Th>Lead</Th>
                <Th>Mobile</Th>
                <Th>Verified</Th>
                <Th className="text-right">Views</Th>
                <Th>Last seen</Th>
                <Th>Looked at</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                    No verified leads yet.
                  </td>
                </tr>
              )}

              {visible.map((lead) => {
                const sections = topSections(lead.recentPaths)
                return (
                  <tr key={lead.id} className="align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{lead.name}</p>
                      {lead.business && <p className="text-gray-500">{lead.business}</p>}
                      {lead.email && <p className="text-gray-400 text-xs">{lead.email}</p>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900">
                      <a href={`tel:${lead.phone}`} className="hover:underline">
                        {lead.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {formatDate(lead.verifiedAt)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-900">
                      {lead.viewCount}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {formatDate(lead.lastSeenAt)}
                    </td>
                    <td className="px-4 py-3">
                      {sections.length === 0 ? (
                        <span className="text-gray-400">Never signed in</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {sections.slice(0, 4).map((s) => (
                            <span
                              key={s}
                              className="inline-flex items-center rounded-full bg-fuchsia-50 px-2 py-0.5 text-xs text-fuchsia-700"
                            >
                              {s}
                            </span>
                          ))}
                          {sections.length > 4 && (
                            <span className="text-xs text-gray-400">
                              +{sections.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="px-4 pb-4">
          <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
        </div>
      </div>
    </div>
  )
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 font-medium ${className}`}>{children}</th>
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}
