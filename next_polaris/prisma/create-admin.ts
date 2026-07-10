import 'dotenv/config';
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/utils/helpers";
import { UserRole } from "@generated/prisma/enums";

const username = process.env.ADMIN_USERNAME || "Clint";
const email = (process.env.ADMIN_EMAIL || "cdanso@service4gh.com").toLowerCase();
const password = process.env.ADMIN_PASSWORD || randomBytes(18).toString("base64url");

async function main() {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`A user with email ${email} already exists (id: ${existing.id}). Nothing created.`);
    return;
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      role: UserRole.ADMIN,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  console.log("Admin user created:");
  console.log(user);
  console.log("");
  console.log(`Password: ${password}`);
  console.log("Save this now — it is not stored anywhere and cannot be shown again. Change it after first login.");
}

main()
  .catch((error) => {
    console.error("Failed to create admin user:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
