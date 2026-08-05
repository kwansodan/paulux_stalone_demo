import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, BarChart3, CalendarCheck, Package, Wallet } from "lucide-react"
import { DemoAccessForm } from "@/features/demo-lead/components/demo-access-form"
import { homePath, signInPath } from "@/app/paths"

export const metadata = {
  title: "Try the demo — Paulux Booking",
  description:
    "Get instant access to a working Paulux Booking admin account, loaded with sample data.",
}

const HIGHLIGHTS = [
  {
    icon: CalendarCheck,
    title: "Bookings and staff",
    body: "A full diary with today's schedule, stylists assigned to jobs, and clients booking themselves online.",
  },
  {
    icon: Wallet,
    title: "Payments that reconcile",
    body: "Cash, mobile money and card recorded the same way, with deposits and outstanding balances tracked.",
  },
  {
    icon: BarChart3,
    title: "Ten built-in reports",
    body: "Revenue, who still owes you, sales by service, staff performance — no exporting to a spreadsheet.",
  },
  {
    icon: Package,
    title: "Stock and consumables",
    body: "Retail products with low-stock alerts, plus materials issued to each section so you know what it costs to run.",
  },
]

export default function TryDemoPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="mb-8 flex items-center justify-between">
          <Link href={homePath()} className="inline-flex items-center gap-2">
            <Image
              src="/images/pauluxicon.png"
              alt="Paulux Booking"
              width={100}
              height={50}
              priority
            />
          </Link>
          <Link
            href={homePath()}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to the demo site
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Why they'd want in — the login page said none of this. */}
          <div className="lg:pt-4">
            <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl">
              See the admin side, with real data in it
            </h1>
            <p className="mt-4 text-base text-gray-600">
              You&apos;ve been looking at the customer-facing half. Leave your
              number and we&apos;ll text you a code — then you get the same
              dashboard a salon owner uses to run the place.
            </p>

            <ul className="mt-8 space-y-5">
              {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3e2017]/10">
                    <Icon className="h-4.5 w-4.5 text-[#3e2017]" />
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{title}</p>
                    <p className="text-sm text-gray-600">{body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-8 text-sm text-gray-500">
              It&apos;s a shared demo account with sample data — change anything
              you like, it gets reset regularly.
            </p>
          </div>

          {/* The form itself */}
          <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900">Get access</h2>
            <p className="mt-1 mb-6 text-sm text-gray-600">
              Takes about a minute.
            </p>
            <DemoAccessForm />

            <p className="mt-6 border-t border-gray-100 pt-4 text-center text-sm text-gray-500">
              Already have a login?{" "}
              <Link href={signInPath()} className="font-medium text-[#A800B7] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
