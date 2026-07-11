// Self-contained on purpose, same reasoning as create-admin.ts: this runs
// inside the production runner image via `npx tsx prisma/import-services.ts`,
// which only has .next/standalone's tree-shaken node_modules, prisma/, and
// generated/ — no src/, no tsconfig.json (no `@/...` aliases), and no
// @prisma/adapter-pg. Talks to Postgres directly via `pg`.
//
// Reads prisma/services-import-data.json (generated from the price list
// spreadsheet) and creates any ServiceCategory rows that don't already exist,
// then any Service rows that don't already exist (matched by name + category,
// so re-running this is safe — it only fills in what's missing).
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { Client } from "pg";

type ImportRow = {
  category: string;
  name: string;
  price: number;
  durationMinutes: number;
  description: string | null;
};

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DIRECT_URL/DATABASE_URL environment variable is not defined");
}

// Always invoked as `npx tsx prisma/import-services.ts` from /app (matching
// how create-admin.ts is run), so this is relative to the working directory.
const rows: ImportRow[] = JSON.parse(readFileSync("prisma/services-import-data.json", "utf-8"));

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query("BEGIN");

    const categoryIds = new Map<string, string>();
    const categoryNames = [...new Set(rows.map((r) => r.category))];

    let categoriesCreated = 0;
    for (const name of categoryNames) {
      const existing = await client.query("SELECT id FROM service_categories WHERE name = $1", [name]);
      if (existing.rows.length > 0) {
        categoryIds.set(name, existing.rows[0].id);
        continue;
      }
      const id = randomUUID();
      await client.query(
        `INSERT INTO service_categories (id, name, capacity, "createdAt", "updatedAt")
         VALUES ($1, $2, 1, now(), now())`,
        [id, name]
      );
      categoryIds.set(name, id);
      categoriesCreated++;
    }

    let servicesCreated = 0;
    let servicesSkipped = 0;
    for (const row of rows) {
      const categoryId = categoryIds.get(row.category)!;
      const existing = await client.query(
        'SELECT id FROM services WHERE name = $1 AND "categoryId" = $2',
        [row.name, categoryId]
      );
      if (existing.rows.length > 0) {
        servicesSkipped++;
        continue;
      }

      const id = randomUUID();
      await client.query(
        `INSERT INTO services (id, name, description, "durationMinutes", price, currency, "categoryId", "minDepositFixed", "isActive", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, 'GHS', $6, 0, true, now(), now())`,
        [id, row.name, row.description, row.durationMinutes, row.price, categoryId]
      );
      servicesCreated++;
    }

    await client.query("COMMIT");

    console.log(`Categories created: ${categoriesCreated} (of ${categoryNames.length} total)`);
    console.log(`Services created: ${servicesCreated}`);
    console.log(`Services skipped (already existed): ${servicesSkipped}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Failed to import services:", error);
  process.exitCode = 1;
});
