import { normalizePhone } from "@/lib/phone";

export async function sendSMS({
    recipients,
    message,
}: {
    recipients: string[];
    message: string;
}) {
    const apiKey = process.env.ARKESEL_API_KEY;
    const baseUrl = process.env.ARKESAL_BASE_URL || "https://sms.arkesel.com";

    if (!apiKey) {
        console.error("SMS Error: ARKESEL_API_KEY is not defined.");
        return;
    }

    // Arkesel wants international format (233...). Shared with the OTP flow via
    // lib/phone so both agree on what counts as the same number.
    const formattedRecipients = recipients.map(normalizePhone);

    try {
        const payload = {
            sender: "Paulux", // Max 11 characters
            message,
            recipients: formattedRecipients,
            use_case: "transactional"
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`${baseUrl}/api/v2/sms/send`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": apiKey,
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const data = await response.json();
        console.log("Arkesel API Response:", data);

        // Arkesel's v2 API returns HTTP 200 even on logical rejections (unregistered
        // sender ID, insufficient balance, invalid recipient), signalling the real
        // outcome in the body's `status`/`code`. Keying success off `response.ok`
        // alone would record undelivered messages as sent, so check the body too.
        const bodyStatus = String((data as any)?.status ?? "").toLowerCase();
        const delivered = response.ok && (bodyStatus === "success" || bodyStatus === "");

        if (!delivered) {
            console.error(
                "Failed to send SMS. HTTP:", response.status,
                "Arkesel status:", (data as any)?.status,
                "Data:", data
            );
            return { success: false, data, status: response.status };
        }

        return { success: true, data };
    } catch (error: unknown) {
        console.error("SMS Sending Error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined
        };
    }
}
