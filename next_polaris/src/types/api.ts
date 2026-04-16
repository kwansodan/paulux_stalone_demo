/**
 * Standard shape returned by all API routes on error.
 * Every NextResponse.json({ success: false, message: "..." }) conforms to this.
 */
export interface ApiError {
  message: string
  error?: string
  statusCode?: number
}
