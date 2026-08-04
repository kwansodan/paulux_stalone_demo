import 'dotenv/config';
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/utils/helpers";
import { UserRole } from "@generated/prisma/enums";

const newAdmins = [
    {
        username: "Paulux Admin",
        email: "hello@pauluxbooking.com",
        password: "AdminPass123!",
        role: UserRole.ADMIN,
    },
    {
        username: "Frimpong",
        email: "Frimpongbk97@gmail.com",
        password: "AdminPass123!",
        role: UserRole.ADMIN,
    },
];

async function seedAdmins() {
    try {
        for (const admin of newAdmins) {
            const passwordHash = await hashPassword(admin.password);
            await prisma.user.upsert({
                where: { email: admin.email },
                update: {
                    passwordHash,
                    role: admin.role,
                    username: admin.username
                },
                create: {
                    email: admin.email,
                    username: admin.username,
                    passwordHash,
                    role: admin.role
                },
            });
            console.log(`Seeded admin: ${admin.email}`);
        }
    } catch (err) {
        console.error("Error seeding admins:", err);
    } finally {
        await prisma.$disconnect();
    }
}

seedAdmins();
