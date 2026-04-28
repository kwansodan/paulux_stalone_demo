"use client"

import { useState } from "react"
import Link from "next/link"
import { MoreHorizontal, X } from "lucide-react"

const WHATSAPP_URL = "https://wa.me/233504851482"
const INSTAGRAM_URL = "https://ig.me/m/polarisbeautylounge"

export default function FloatingSocialButtons() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3">

      {/* Expandable buttons — slide in from below when open */}
      <div
        className={`flex flex-col items-center gap-3 transition-all duration-300 ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        {/* Instagram */}
        <Link
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Instagram"
          className="group relative flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform duration-200 hover:scale-110 hover:shadow-xl"
          style={{
            background:
              "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)",
          }}
          aria-label="Instagram"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="white" strokeWidth="2" />
            <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="2" />
            <circle cx="17.5" cy="6.5" r="1.2" fill="white" />
          </svg>
          <span className="pointer-events-none absolute right-14 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow transition-opacity duration-150 group-hover:opacity-100">
            Instagram
            <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900" />
          </span>
        </Link>

        {/* WhatsApp */}
        <Link
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          title="Chat on WhatsApp"
          className="group relative flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform duration-200 hover:scale-110 hover:shadow-xl"
          style={{ background: "#25D366" }}
          aria-label="Chat on WhatsApp"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="white"
            aria-hidden="true"
          >
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.974-1.301A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.946 7.946 0 01-4.073-1.117l-.292-.174-3.046.798.813-2.972-.19-.305A7.96 7.96 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8zm4.406-5.908c-.242-.121-1.432-.707-1.654-.787-.222-.08-.384-.121-.545.121-.16.242-.625.787-.766.949-.141.16-.282.18-.524.06-.242-.12-1.021-.376-1.944-1.198-.719-.64-1.204-1.43-1.345-1.672-.141-.242-.015-.373.106-.493.108-.108.242-.282.363-.423.12-.141.16-.242.242-.403.08-.161.04-.302-.02-.423-.06-.12-.545-1.314-.747-1.799-.196-.473-.396-.409-.545-.417l-.464-.008c-.161 0-.423.06-.645.302-.222.242-.847.828-.847 2.02 0 1.192.867 2.344.988 2.505.12.161 1.706 2.605 4.135 3.652.578.249 1.029.398 1.38.51.58.184 1.108.158 1.525.096.465-.069 1.432-.585 1.634-1.15.201-.564.201-1.047.14-1.148-.06-.1-.222-.161-.464-.282z" />
          </svg>
          <span className="pointer-events-none absolute right-14 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow transition-opacity duration-150 group-hover:opacity-100">
            Chat on WhatsApp
            <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-gray-900" />
          </span>
        </Link>
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close social links" : "Open social links"}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 text-gray-600 transition-all duration-200 hover:scale-110 hover:shadow-xl hover:text-gray-900"
      >
        <span
          className={`transition-transform duration-300 ${open ? "rotate-90" : "rotate-0"}`}
        >
          {open ? <X className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
        </span>
      </button>
    </div>
  )
}
