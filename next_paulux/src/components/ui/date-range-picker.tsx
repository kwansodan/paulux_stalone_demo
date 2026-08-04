"use client"

import { useState, useRef, useEffect } from "react"
import { CalendarDays, ChevronDown } from "lucide-react"

// ── Date helpers ─────────────────────────────────────────────────────────────

function fmt(d: Date) {
  return d.toISOString().split("T")[0]
}

function startOfWeek(d: Date) {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff)
  mon.setHours(0, 0, 0, 0)
  return mon
}

export function buildDatePresets() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  const weekStart = startOfWeek(today)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const lastWeekStart = new Date(weekStart)
  lastWeekStart.setDate(weekStart.getDate() - 7)
  const lastWeekEnd = new Date(weekStart)
  lastWeekEnd.setDate(weekStart.getDate() - 1)

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

  const yearStart = new Date(today.getFullYear(), 0, 1)
  const yearEnd = new Date(today.getFullYear(), 11, 31)

  const lastYearStart = new Date(today.getFullYear() - 1, 0, 1)
  const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31)

  return [
    { label: "Today",      from: fmt(today),         to: fmt(today) },
    { label: "Yesterday",  from: fmt(yesterday),      to: fmt(yesterday) },
    { label: "This week",  from: fmt(weekStart),      to: fmt(weekEnd) },
    { label: "This month", from: fmt(monthStart),     to: fmt(monthEnd) },
    { label: "This year",  from: fmt(yearStart),      to: fmt(yearEnd) },
    { label: "Last week",  from: fmt(lastWeekStart),  to: fmt(lastWeekEnd) },
    { label: "Last month", from: fmt(lastMonthStart), to: fmt(lastMonthEnd) },
    { label: "Last year",  from: fmt(lastYearStart),  to: fmt(lastYearEnd) },
  ]
}

export function getDateRangeLabel(from: string, to: string): string {
  const presets = buildDatePresets()
  const match = presets.find(p => p.from === from && p.to === to)
  if (match) return match.label

  if (from === to) {
    return new Date(from + "T00:00:00").toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    })
  }

  const f = new Date(from + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })
  const t = new Date(to + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  return `${f} – ${t}`
}

// ── Component ─────────────────────────────────────────────────────────────────

type Props = {
  from: string
  to: string
  onChange: (from: string, to: string) => void
  placeholder?: string
}

export default function DateRangePicker({ from, to, onChange, placeholder = "Select period" }: Props) {
  const [open, setOpen] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [customFrom, setCustomFrom] = useState(from)
  const [customTo, setCustomTo] = useState(to)
  const ref = useRef<HTMLDivElement>(null)

  const presets = buildDatePresets()
  const label = from && to ? getDateRangeLabel(from, to) : placeholder

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setShowCustom(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  function apply(f: string, t: string) {
    onChange(f, t)
    setOpen(false)
    setShowCustom(false)
  }

  function applyCustom() {
    if (customFrom && customTo && customFrom <= customTo) {
      apply(customFrom, customTo)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 h-12 rounded-lg border border-[#E2E8F0] bg-white hover:bg-gray-50 transition-colors w-full min-w-[180px]"
      >
        <CalendarDays className="w-4 h-4 text-fuchsia-500 flex-shrink-0" />
        <span className="text-sm text-gray-700 flex-1 text-left whitespace-nowrap">{label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-14 z-50 bg-white border border-gray-200 rounded-xl shadow-lg w-56 py-1.5">
          {presets.map(p => (
            <button
              key={p.label}
              type="button"
              onClick={() => apply(p.from, p.to)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors
                ${from === p.from && to === p.to
                  ? "bg-fuchsia-50 text-fuchsia-700 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
                }`}
            >
              {p.label}
            </button>
          ))}

          <div className="border-t border-gray-100 my-1.5" />

          {!showCustom ? (
            <button
              type="button"
              onClick={() => { setShowCustom(true); setCustomFrom(from); setCustomTo(to) }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Custom period…
            </button>
          ) : (
            <div className="px-3 pb-2 space-y-2">
              <p className="text-xs font-medium text-gray-500 pt-1">Custom period</p>
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
              />
              <input
                type="date"
                value={customTo}
                min={customFrom}
                onChange={e => setCustomTo(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
              />
              <div className="flex gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowCustom(false)}
                  className="flex-1 text-xs py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyCustom}
                  disabled={!customFrom || !customTo || customFrom > customTo}
                  className="flex-1 text-xs py-1.5 rounded-lg bg-fuchsia-600 text-white hover:bg-fuchsia-700 disabled:opacity-40"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
