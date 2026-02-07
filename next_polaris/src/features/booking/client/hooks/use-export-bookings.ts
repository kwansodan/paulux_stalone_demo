import { useState } from "react"
import { BookingWithServiceAndPayment } from "../../types"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { exportBookingsToCSV, getExportFilename } from "../../utils/utils"

export function useExportBookings() {
  const [isExporting, setIsExporting] = useState(false)

  const exportBookings = async () => {
    try {
      setIsExporting(true)
      
      const res = await api.get("/bookings")
      const bookings: BookingWithServiceAndPayment[] = res.data.data.bookings

      if (!bookings || bookings.length === 0) {
        toast.error("No bookings to export")
        return
      }

      exportBookingsToCSV(bookings, getExportFilename())
      
      toast.success(`Successfully exported ${bookings.length} bookings`)
    } catch (error: any) {
      console.error("Error exporting bookings:", error)
      toast.error(error.message || "Failed to export bookings")
    } finally {
      setIsExporting(false)
    }
  }

  return {
    exportBookings,
    isExporting,
  }
}
