// Self-contained on purpose: this runs inside the production runner image via
// `npx tsx prisma/create-admin.ts`, which only has .next/standalone's
// tree-shaken node_modules, prisma/, and generated/ — no src/, no
// tsconfig.json, so no `@/...` path aliases, no dotenv (Next.js loads its own
// env), and no @prisma/adapter-pg (not traced into the standalone build).
// Talks to Postgres directly via `pg` instead of going through Prisma Client.
import { randomBytes, randomUUID } from "crypto";
import bcrypt from "bcrypt";
import { Client } from "pg";

const SALTROUNDS = 10;

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DIRECT_URL/DATABASE_URL environment variable is not defined");
}

const username = process.env.ADMIN_USERNAME || "Clint";
const email = (process.env.ADMIN_EMAIL || "cdanso@service4gh.com").toLowerCase();
const password = process.env.ADMIN_PASSWORD || randomBytes(18).toString("base64url");

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    const existing = await client.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      console.log(`A user with email ${email} already exists (id: ${existing.rows[0].id}). Nothing created.`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALTROUNDS);
    const id = randomUUID();

    const result = await client.query(
      `INSERT INTO users (id, username, email, "passwordHash", role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, 'ADMIN', now(), now())
       RETURNING id, username, email, role, "createdAt"`,
      [id, username, email, passwordHash]
    );

    console.log("Admin user created:");
    console.log(result.rows[0]);
    console.log("");
    console.log(`Password: ${password}`);
    console.log("Save this now — it is not stored anywhere and cannot be shown again. Change it after first login.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Failed to create admin user:", error);
  process.exitCode = 1;
});
