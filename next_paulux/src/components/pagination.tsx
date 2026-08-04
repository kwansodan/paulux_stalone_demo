"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

type Props = {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}

/**
 * Client-side pagination control. Renders nothing for a single page.
 * Shows Prev / "Page X of Y" / Next with disabled end states.
 */
export default function Pagination({ page, pageCount, onPageChange }: Props) {
  if (pageCount <= 1) return null

  const btn =
    "inline-flex items-center gap-1 px-3 h-9 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 " +
    "hover:bg-fuchsia-50 hover:text-fuchsia-700 hover:border-fuchsia-200 transition-colors " +
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-gray-200"

  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <button
        type="button"
        className={btn}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeft className="w-4 h-4" />
        Prev
      </button>

      <span className="text-sm text-gray-500">
        Page <span className="font-semibold text-gray-900">{page}</span> of {pageCount}
      </span>

      <button
        type="button"
        className={btn}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
