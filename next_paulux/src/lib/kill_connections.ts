import { prisma } from "@/lib/prisma";

async function kill() {
    console.log("Killing other connections...");
    try {
        // Only works if the user has permission to view pg_stat_activity and terminate backends
        // Usually postgres user (supadmin) has this.
        const result = await prisma.$executeRawUnsafe(`
            SELECT pg_terminate_backend(pid) 
            FROM pg_stat_activity 
            WHERE pid <> pg_backend_pid() 
            AND datname = current_database()
            AND state = 'idle in transaction'; -- Only kill idle transactions usually holding locks
        `);
        console.log(`Terminated ${result} connections.`);

        // Also checks count of active connections
        const active = await prisma.$queryRawUnsafe(`
            SELECT count(*) as count FROM pg_stat_activity WHERE datname = current_database();
        `);
        console.log("Active connections:", active);

    } catch (e) {
        console.error("Error killing connections:", e);
    } finally {
        await prisma.$disconnect();
    }
}
kill();
