// Self-contained on purpose: this runs inside the production runner image via
// `npx tsx prisma/create-admin.ts`, which only has .next/standalone's
// tree-shaken node_modules, prisma/, and generated/ — no src/, no
// tsconfig.json, so no `@/...` path aliases and no dotenv (Next.js loads its
// own env, nothing in the compiled server imports the dotenv package).
import { randomBytes } from "crypto";
import bcrypt from "bcrypt";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const SALTROUNDS = 10;

const connectionString = process.env.DIRECT_URL;
if (!connectionString) {
  throw new Error("DIRECT_URL environment variable is not defined");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const username = process.env.ADMIN_USERNAME || "Clint";
const email = (process.env.ADMIN_EMAIL || "cdanso@service4gh.com").toLowerCase();
const password = process.env.ADMIN_PASSWORD || randomBytes(18).toString("base64url");

async function main() {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`A user with email ${email} already exists (id: ${existing.id}). Nothing created.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALTROUNDS);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      role: "ADMIN",
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
