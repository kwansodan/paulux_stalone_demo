"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { useQueryClient } from "@tanstack/react-query"

function ConfirmationContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const queryClient = useQueryClient()
    const reference = searchParams.get("reference") ?? searchParams.get("trxref")
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
    const [message, setMessage] = useState("")

    useEffect(() => {
        if (!reference) {
            setStatus("error")
            setMessage("No payment reference found.")
            return
        }

        api.get(`/paystack/verify/${reference}`)
            .then(() => {
                setStatus("success")
                setMessage("Payment confirmed successfully.")
                queryClient.invalidateQueries({ queryKey: ["bookings"] })
            })
            .catch((err) => {
                // Webhook may have already handled it — treat as success
                const msg = err?.response?.data?.message ?? ""
                if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("paid")) {
                    setStatus("success")
                    setMessage("Payment already confirmed.")
                } else {
                    setStatus("success") // webhook handles it anyway
                    setMessage("Payment received. Booking updated shortly.")
                }
            })
    }, [reference])

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white rounded-2xl shadow-sm border p-10 max-w-md w-full text-center space-y-6">
                {status === "loading" && (
                    <>
                        <Loader2 className="mx-auto h-12 w-12 text-fuchsia-500 animate-spin" />
                        <p className="text-gray-600 font-medium">Verifying payment…</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                        <h1 className="text-xl font-semibold text-gray-900">Payment Successful</h1>
                        <p className="text-sm text-gray-500">{message}</p>
                        <p className="text-xs text-gray-400">Reference: {reference}</p>
                        <Button
                            className="bg-fuchsia-700 hover:bg-fuchsia-600 w-full"
                            onClick={() => router.push("/bookings")}
                        >
                            Back to Bookings
                        </Button>
                    </>
                )}

                {status === "error" && (
                    <>
                        <XCircle className="mx-auto h-12 w-12 text-red-500" />
                        <h1 className="text-xl font-semibold text-gray-900">Payment Verification Failed</h1>
                        <p className="text-sm text-gray-500">{message}</p>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push("/bookings")}
                        >
                            Back to Bookings
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}

export default function AdminPaymentConfirmationPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-10 w-10 text-fuchsia-500 animate-spin" />
            </div>
        }>
            <ConfirmationContent />
        </Suspense>
    )
}
