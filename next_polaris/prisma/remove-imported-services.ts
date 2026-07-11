// Reverses import-services.ts. Self-contained for the same reason as
// create-admin.ts / import-services.ts (no @/ aliases, no Prisma Client, no
// tsconfig — the production runner image doesn't have them). Talks to
// Postgres directly via `pg`.
//
// Deletes exactly the (name, category) pairs recorded in
// services-import-data.json — nothing else. A service is skipped (not
// deleted) if it already has bookings referencing it, since the DB's foreign
// key has no cascade there on purpose. A category is only deleted if it ends
// up with zero remaining services, so anything added to it since the import
// (manually, outside this script) is left untouched.
import { readFileSync } from "fs";
import { Client } from "pg";

type ImportRow = {
  category: string;
  name: string;
};

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DIRECT_URL/DATABASE_URL environment variable is not defined");
}

const rows: ImportRow[] = JSON.parse(readFileSync("prisma/services-import-data.json", "utf-8"));

async function main() {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query("BEGIN");

    const categoryNames = [...new Set(rows.map((r) => r.category))];
    const categoryIds = new Map<string, string>();
    for (const name of categoryNames) {
      const res = await client.query("SELECT id FROM service_categories WHERE name = $1", [name]);
      if (res.rows.length > 0) categoryIds.set(name, res.rows[0].id);
    }

    let servicesDeleted = 0;
    let servicesSkippedHasBookings = 0;
    let servicesNotFound = 0;

    for (const row of rows) {
      const categoryId = categoryIds.get(row.category);
      if (!categoryId) continue;

      const svc = await client.query(
        'SELECT id FROM services WHERE name = $1 AND "categoryId" = $2',
        [row.name, categoryId]
      );
      if (svc.rows.length === 0) {
        servicesNotFound++;
        continue;
      }
      const serviceId = svc.rows[0].id;

      const bookingRef = await client.query(
        'SELECT 1 FROM booking_services WHERE "serviceId" = $1 LIMIT 1',
        [serviceId]
      );
      if (bookingRef.rows.length > 0) {
        servicesSkippedHasBookings++;
        continue;
      }

      await client.query("DELETE FROM services WHERE id = $1", [serviceId]);
      servicesDeleted++;
    }

    let categoriesDeleted = 0;
    let categoriesKept = 0;
    for (const [name, id] of categoryIds) {
      const remaining = await client.query('SELECT 1 FROM services WHERE "categoryId" = $1 LIMIT 1', [id]);
      if (remaining.rows.length === 0) {
        await client.query("DELETE FROM service_categories WHERE id = $1", [id]);
        categoriesDeleted++;
      } else {
        categoriesKept++;
        console.log(`Category "${name}" still has services left (not from this import) — not deleted.`);
      }
    }

    await client.query("COMMIT");

    console.log(`Services deleted: ${servicesDeleted}`);
    console.log(`Services skipped (already have bookings): ${servicesSkippedHasBookings}`);
    console.log(`Services not found (already gone): ${servicesNotFound}`);
    console.log(`Categories deleted: ${categoriesDeleted}`);
    console.log(`Categories kept (still had other services): ${categoriesKept}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Failed to remove imported services:", error);
  process.exitCode = 1;
});
