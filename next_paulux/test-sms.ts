import dotenv from "dotenv";
import path from "path";
import { sendSMS } from "./src/lib/arkesal";

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function test() {
    console.log("Starting SMS Test...");
    console.log("ARKESEL_API_KEY:", process.env.ARKESEL_API_KEY ? "Defined (Starts with " + process.env.ARKESEL_API_KEY.substring(0, 5) + "...)" : "Not Defined");
    console.log("ARKESAL_BASE_URL:", process.env.ARKESAL_BASE_URL || "Using default");

    const testNumber = process.argv[2];
    if (!testNumber) {
        console.error("Please provide a test phone number as an argument.");
        console.log("Usage: npx tsx test-sms.ts 024XXXXXXX");
        process.exit(1);
    }

    console.log(`Sending test SMS to: ${testNumber}`);

    try {
        const result = await sendSMS({
            recipients: [testNumber],
            message: "This is a test message from Paulux Booking. If you received this, your SMS service is working correctly."
        });

        if (result?.success) {
            console.log("✅ SMS sent successfully!");
            console.log("Response data:", JSON.stringify(result.data, null, 2));
        } else {
            console.error("❌ Failed to send SMS.");
            console.error("Error/Data:", JSON.stringify(result, null, 2));

            if (result?.status === 401) {
                console.error("TIP: 401 Unauthorized usually means your API Key is invalid.");
            } else if (result?.data?.message?.includes("Sender")) {
                console.error("TIP: Check if your Sender ID 'Paulux' is approved in Arkesel.");
            }
        }
    } catch (error) {
        console.error("Unhandled error during test:", error);
    }
}

test();
