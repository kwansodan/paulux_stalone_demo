import { differenceInDays } from "date-fns";

/**
 * Hubtel Safeguards Utility
 */

/**
 * Checks if a transaction is eligible for a refund via API.
 * 
 * Rules:
 * 1. Transaction must be within the last 45 days.
 * 2. Amount must be at least 1 GHS.
 */
export function isEligibleForRefund(createdAt: Date, amount: number): { eligible: boolean; reason?: string } {
    const daysOld = differenceInDays(new Date(), createdAt);

    if (daysOld > 45) {
        return { eligible: false, reason: "Transaction is older than 45 days. Please contact Hubtel support for manual refund." };
    }

    if (amount < 1) {
        return { eligible: false, reason: "Refunds for amounts less than 1 GHS are not supported by the API." };
    }

    return { eligible: true };
}
