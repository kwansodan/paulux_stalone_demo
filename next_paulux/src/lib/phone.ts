/**
 * Ghanaian mobile number normalisation.
 *
 * Extracted from lib/arkesal.ts so the OTP flow and the SMS sender agree on
 * what "the same number" means — otherwise 0244000000 and +233244000000 would
 * be treated as two different leads, and a code sent to one could not be
 * verified against the other.
 */

/** Strip formatting and convert a local 0XXXXXXXXX to international 233XXXXXXXXX. */
export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, "")
  if (cleaned.startsWith("0") && cleaned.length === 10) {
    cleaned = "233" + cleaned.substring(1)
  }
  return cleaned
}

/**
 * True for a plausible Ghanaian mobile number, in local or international form.
 * Deliberately loose about the operator prefix — new ranges get issued, and a
 * demo signup is the wrong place to reject someone over a lookup table.
 */
export function isValidPhone(phone: string): boolean {
  const n = normalizePhone(phone)
  return /^233\d{9}$/.test(n)
}
