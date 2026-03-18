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

    // Format the recipients appropriately
    // They must be strings and preferably in international format (e.g. 233...)
    // Assuming the phone numbers entered align with the documentation
    const formattedRecipients = recipients.map(phone => {
        // Basic cleanup: remove spaces or non-digit characters if any
        let cleaned = phone.replace(/\D/g, '');
        // Ensure starts with 233 if it's a 024 format etc (naive fallback, assume mostly GH)
        if (cleaned.startsWith('0') && cleaned.length === 10) {
            cleaned = '233' + cleaned.substring(1);
        }
        return cleaned;
    });

    try {
        const payload = {
            sender: "Polaris", // Max 11 characters
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

        if (!response.ok) {
            console.error("Failed to send SMS. Status:", response.status, "Data:", data);
            return { success: false, data, status: response.status };
        }

        return { success: true, data };
    } catch (error: any) {
        console.error("SMS Sending Error:", error);
        return {
            success: false,
            error: error.message || "Unknown error",
            stack: error.stack
        };
    }
}
