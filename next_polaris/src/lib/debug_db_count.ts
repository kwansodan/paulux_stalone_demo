import { prisma } from "@/lib/prisma";

async function count() {
    console.log("Checking DB connection...");
    try {
        const bookings = await prisma.booking.count();
        console.log(`Bookings count: ${bookings}`);
        const users = await prisma.user.count();
        console.log(`Users count: ${users}`);
    } catch (e) {
        console.error("Error connecting/counting:", e);
    } finally {
        await prisma.$disconnect();
    }
}
count();
