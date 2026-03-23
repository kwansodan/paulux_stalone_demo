import { BookingWithServiceAndPayment } from "../types"

export function exportBookingsToCSV(bookings: BookingWithServiceAndPayment[], filename = "bookings-export.csv") {
  const headers = [
    "Booking Ref",
    "Customer Name",
    "Customer Email",
    "Customer Phone",
    "Service",
    "Date",
    "Time",
    "Status",
    "Payment Status",
    "Amount (GHS)",
  ]

  // Convert bookings to CSV rows
  const rows = bookings.map(booking => {
    const payment = booking.payments?.[0]

    return [
      booking.bookingReference || "",
      booking.clientName || "",
      booking.clientEmail || "",
      booking.clientPhone || "",
      booking.services.map(s => s.service.name).join("; ") || "",
      booking.bookingDate || "",
      booking.bookingTime || "",
      booking.status || "",
      payment?.status || "No payment",
      booking.services.reduce((sum, s) => sum + Number(s.priceAtBooking), 0).toFixed(2),
    ]
  })

  const csvContent = [
    headers.join(","),
    ...rows.map(row =>
      row.map(cell => {
        const cellStr = String(cell)
        if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      }).join(",")
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

export function getExportFilename() {
  const now = new Date()
  const dateStr = now.toISOString().split("T")[0] // YYYY-MM-DD
  const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-") // HH-MM-SS
  return `bookings-export-${dateStr}-${timeStr}.csv`
}