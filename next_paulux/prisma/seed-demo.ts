// Demo dataset for client-facing walkthroughs.
//
// Self-contained on purpose, for the same reason as create-admin.ts: this runs
// inside the production runner image via `npx tsx prisma/seed-demo.ts`, which
// only has .next/standalone's tree-shaken node_modules, prisma/ and generated/
// — no src/, no tsconfig.json, so no `@/...` path aliases and no dotenv.
// Talks to Postgres directly via `pg` instead of going through Prisma Client.
//
// Differs from seed.ts in two ways that matter:
//   1. It never touches the `users` table, so an admin created with
//      create-admin.ts survives. Stylist accounts are additive.
//   2. All dates are relative to today, so the calendar always looks current
//      rather than pointing at whenever the script was written.
//
// Safe by default: refuses to run if demo data already exists. Set RESEED=1 to
// wipe the demo tables (again, never `users`) and rebuild from scratch.

import { randomUUID, randomBytes } from "crypto";
import bcrypt from "bcrypt";
import { Client } from "pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DIRECT_URL/DATABASE_URL environment variable is not defined");
}

const client = new Client({ connectionString });
const now = new Date();

// ─── helpers ────────────────────────────────────────────────────────────────

/** Generic insert. Untyped params let Postgres coerce to the column type, so
 *  enums and jsonb work without explicit casts. */
async function ins(table: string, row: Record<string, unknown>): Promise<void> {
  const keys = Object.keys(row);
  const cols = keys.map((k) => `"${k}"`).join(", ");
  const ph = keys.map((_, i) => `$${i + 1}`).join(", ");
  await client.query(
    `INSERT INTO "${table}" (${cols}) VALUES (${ph})`,
    keys.map((k) => row[k])
  );
}

const DAY = 86_400_000;
/** Date N days from today (negative = past). */
const day = (offset: number) => new Date(now.getTime() + offset * DAY);
/** "YYYY-MM-DD" — the format bookings.bookingDate stores. */
const ymd = (d: Date) => d.toISOString().slice(0, 10);

const id = () => randomUUID();
const money = (n: number) => n.toFixed(2);

// Reserved by RFC 2606, so demo bookings can never email a real person.
const DEMO_DOMAIN = "example.com";

// ─── reference data ─────────────────────────────────────────────────────────

const serviceCategories = [
  { name: "Hair", capacity: 4 },
  { name: "Nails", capacity: 3 },
  { name: "Skincare", capacity: 2 },
  { name: "Spa & Massage", capacity: 2 },
  { name: "Barber", capacity: 2 },
];

const services = [
  // name, category, minutes, price, deposit
  ["Wash, Blow-Dry & Style", "Hair", 60, 150, 0],
  ["Full Weave Installation", "Hair", 180, 450, 150],
  ["Knotless Braids (Medium)", "Hair", 240, 400, 120],
  ["Relaxer & Treatment", "Hair", 90, 220, 60],
  ["Silk Press", "Hair", 75, 180, 0],
  ["Classic Manicure", "Nails", 45, 80, 0],
  ["Gel Manicure", "Nails", 60, 130, 40],
  ["Classic Pedicure", "Nails", 60, 110, 0],
  ["Acrylic Full Set", "Nails", 90, 250, 80],
  ["Deep Cleansing Facial", "Skincare", 60, 200, 50],
  ["Anti-Ageing Facial", "Skincare", 75, 320, 100],
  ["Classic Lash Extensions", "Skincare", 90, 280, 80],
  ["Deep Tissue Massage", "Spa & Massage", 60, 300, 100],
  ["Swedish Full Body Massage", "Spa & Massage", 90, 380, 120],
  ["Executive Haircut", "Barber", 45, 70, 0],
  ["Beard Trim & Line-Up", "Barber", 30, 45, 0],
] as const;

const productCategories = ["Hair Care", "Nail Care", "Skincare Retail"];

const products = [
  // name, category, price, stock, threshold, description
  ["Argan Oil Hair Serum 100ml", "Hair Care", 95, 24, 6, "Lightweight finishing oil for shine and frizz control"],
  ["Sulphate-Free Shampoo 300ml", "Hair Care", 120, 18, 6, "Gentle daily cleanser, safe for treated hair"],
  ["Deep Conditioning Mask 250ml", "Hair Care", 140, 4, 6, "Weekly protein and moisture treatment"],
  ["Cuticle Oil Pen", "Nail Care", 45, 30, 10, "Jojoba and vitamin E, twist-to-dispense"],
  ["Gel Top Coat", "Nail Care", 60, 15, 5, "High-shine, chip-resistant LED top coat"],
  ["Vitamin C Serum 30ml", "Skincare Retail", 210, 9, 4, "Brightening antioxidant serum"],
  ["SPF 50 Daily Moisturiser", "Skincare Retail", 165, 20, 5, "Broad-spectrum, non-greasy finish"],
] as const;

const sections = ["Hair", "Nails", "Barber", "Spa & Skincare"];

const materialCategories = ["Chemicals", "Disposables", "Tools"];

const materials = [
  // name, category, unit, unitCost, stock, threshold
  ["Relaxer Cream", "Chemicals", "g", 0.45, 4000, 800],
  ["Developer 20 Vol", "Chemicals", "ml", 0.08, 6000, 1500],
  ["Bulk Shampoo", "Chemicals", "ml", 0.05, 10000, 2000],
  ["Acetone", "Chemicals", "ml", 0.03, 5000, 1000],
  ["Massage Oil", "Chemicals", "ml", 0.12, 2400, 600],
  ["Nail Tips", "Disposables", "pcs", 0.6, 1200, 300],
  ["Disposable Towels", "Disposables", "pcs", 1.2, 380, 400],
  ["Latex Gloves", "Disposables", "pcs", 0.9, 800, 200],
  ["Clipper Blades", "Tools", "pcs", 45.0, 12, 4],
] as const;

const manualPaymentMethods = [
  "Cash",
  "Mobile Money (MTN)",
  "Mobile Money (Telecel)",
  "Bank Transfer",
  "POS / Card",
];

const stylists = [
  { username: "Ama Boateng", email: `ama.boateng@${DEMO_DOMAIN}` },
  { username: "Kwesi Mensah", email: `kwesi.mensah@${DEMO_DOMAIN}` },
  { username: "Efua Sarpong", email: `efua.sarpong@${DEMO_DOMAIN}` },
  { username: "Yaw Owusu", email: `yaw.owusu@${DEMO_DOMAIN}` },
];

// Booking specs. dayOffset is relative to today so the calendar always has
// recent history, something happening now, and a filling-up future.
const bookingSpecs = [
  // past — completed and settled
  { d: -21, t: "10:00", who: "Emma Wilson", svc: ["Full Weave Installation"], status: "COMPLETED", pay: "PAID", provider: "PRIMARY_PAYSTACK", stylist: 0 },
  { d: -18, t: "14:30", who: "David Lee", svc: ["Executive Haircut", "Beard Trim & Line-Up"], status: "COMPLETED", pay: "PAID", provider: "MANUAL", manual: "Cash", stylist: 3 },
  { d: -14, t: "09:00", who: "Sophia Adams", svc: ["Gel Manicure", "Classic Pedicure"], status: "COMPLETED", pay: "PAID", provider: "MANUAL", manual: "Mobile Money (MTN)", stylist: 1, prods: [["Cuticle Oil Pen", 1]] },
  { d: -11, t: "11:00", who: "Akosua Danso", svc: ["Deep Cleansing Facial"], status: "COMPLETED", pay: "PAID", provider: "PRIMARY_PAYSTACK", stylist: 2, prods: [["Vitamin C Serum 30ml", 1]] },
  { d: -8, t: "16:00", who: "Michael Osei", svc: ["Deep Tissue Massage"], status: "COMPLETED", pay: "PAID", provider: "PRIMARY_PAYSTACK", stylist: 2 },
  { d: -6, t: "13:00", who: "Nana Ama Kufuor", svc: ["Knotless Braids (Medium)"], status: "COMPLETED", pay: "PAID", provider: "MANUAL", manual: "Bank Transfer", stylist: 0, promo: "WELCOME10" },
  { d: -4, t: "10:30", who: "Grace Mensimah", svc: ["Silk Press"], status: "CANCELLED", pay: "REFUNDED", provider: "PRIMARY_PAYSTACK", cancel: "Client rescheduled to next month" },
  { d: -2, t: "15:00", who: "Kofi Adjei", svc: ["Executive Haircut"], status: "COMPLETED", pay: "PAID", provider: "MANUAL", manual: "Cash", stylist: 3, walkin: true },

  // today
  { d: 0, t: "09:30", who: "Linda Amankwah", svc: ["Wash, Blow-Dry & Style"], status: "CONFIRMED", pay: "PAID", provider: "PRIMARY_PAYSTACK", stylist: 0 },
  { d: 0, t: "12:00", who: "Priscilla Boadu", svc: ["Acrylic Full Set"], status: "CONFIRMED", pay: "PARTIAL", provider: "PRIMARY_PAYSTACK", deposit: 80, stylist: 1 },
  { d: 0, t: "16:30", who: "Samuel Tetteh", svc: ["Beard Trim & Line-Up"], status: "PENDING", pay: "PENDING", stylist: 3 },

  // upcoming
  { d: 1, t: "11:00", who: "Abena Owusu", svc: ["Anti-Ageing Facial"], status: "CONFIRMED", pay: "PARTIAL", provider: "PRIMARY_PAYSTACK", deposit: 100, stylist: 2 },
  { d: 2, t: "10:00", who: "Yaa Asantewaa", svc: ["Full Weave Installation"], status: "CONFIRMED", pay: "PARTIAL", provider: "PRIMARY_PAYSTACK", deposit: 150, stylist: 0 },
  { d: 3, t: "14:00", who: "Rebecca Quaye", svc: ["Classic Lash Extensions"], status: "CONFIRMED", pay: "PAID", provider: "PRIMARY_PAYSTACK", stylist: 2, promo: "FESTIVE50" },
  { d: 5, t: "09:00", who: "Joyce Appiah", svc: ["Relaxer & Treatment", "Classic Manicure"], status: "PENDING", pay: "PENDING", stylist: 0 },
  { d: 6, t: "15:30", who: "Daniel Boateng", svc: ["Swedish Full Body Massage"], status: "CONFIRMED", pay: "PARTIAL", provider: "PRIMARY_PAYSTACK", deposit: 120 },
  { d: 9, t: "12:30", who: "Comfort Nyarko", svc: ["Gel Manicure"], status: "PENDING", pay: "PENDING", stylist: 1 },
  { d: 13, t: "10:00", who: "Esi Baidoo", svc: ["Knotless Braids (Medium)"], status: "CONFIRMED", pay: "PARTIAL", provider: "PRIMARY_PAYSTACK", deposit: 120, stylist: 0 },
] as const;

// ─── main ───────────────────────────────────────────────────────────────────

async function alreadySeeded(): Promise<boolean> {
  const { rows } = await client.query(
    `SELECT (SELECT count(*) FROM services)::int AS s,
            (SELECT count(*) FROM bookings)::int AS b`
  );
  return rows[0].s > 0 || rows[0].b > 0;
}

/** Wipes demo content. `users` is deliberately absent — CASCADE only follows
 *  FKs pointing *at* these tables, and nothing here is referenced by users.
 *
 *  `demo_leads` is deliberately absent too: leads are real sales data that
 *  happen to live in the demo database. Resetting the sample salon must never
 *  destroy the record of who asked to see it. */
async function wipe(): Promise<void> {
  await client.query(`
    TRUNCATE TABLE
      bookings, services, service_categories,
      products, product_categories,
      materials, material_categories, sections,
      promo_codes, manual_payment_methods,
      business_hours, blocked_dates,
      gift_cards, system_settings
    CASCADE
  `);
}

async function main() {
  await client.connect();

  try {
    // Everything, including the RESEED wipe, runs in one transaction: a failure
    // part-way through must not leave the database emptied.
    await client.query("BEGIN");

    if (await alreadySeeded()) {
      if (process.env.RESEED !== "1") {
        console.log("Demo data already present. Re-run with RESEED=1 to rebuild it.");
        console.log("(RESEED=1 clears bookings, services, products and settings. User accounts are never touched.)");
        await client.query("ROLLBACK");
        return;
      }
      console.log("RESEED=1 — clearing existing demo data (users preserved)...");
      await wipe();
    }

    // ── stylists ────────────────────────────────────────────────────────────
    // One shared random password so the stylist portal can be demonstrated.
    // Printed once, never stored.
    const stylistPassword = randomBytes(12).toString("base64url");
    const stylistHash = await bcrypt.hash(stylistPassword, 10);
    const stylistIds: string[] = [];

    for (const s of stylists) {
      const existing = await client.query("SELECT id FROM users WHERE email = $1", [s.email]);
      if (existing.rows.length > 0) {
        stylistIds.push(existing.rows[0].id);
        continue;
      }
      const uid = id();
      await ins("users", {
        id: uid,
        username: s.username,
        email: s.email,
        passwordHash: stylistHash,
        role: "STAFF",
        isStylist: true,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      stylistIds.push(uid);
    }
    console.log(`Stylists: ${stylistIds.length}`);

    // ── service categories + services ───────────────────────────────────────
    const catIds = new Map<string, string>();
    for (const c of serviceCategories) {
      const cid = id();
      catIds.set(c.name, cid);
      await ins("service_categories", {
        id: cid, name: c.name, capacity: c.capacity, createdAt: now, updatedAt: now,
      });
    }

    const serviceIds = new Map<string, { id: string; price: number; minutes: number }>();
    for (const [name, cat, minutes, price, deposit] of services) {
      const sid = id();
      serviceIds.set(name, { id: sid, price, minutes });
      await ins("services", {
        id: sid,
        name,
        description: null,
        durationMinutes: minutes,
        price: money(price),
        currency: "GHS",
        categoryId: catIds.get(cat) ?? null,
        minDepositFixed: money(deposit),
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(`Services: ${serviceIds.size} across ${catIds.size} categories`);

    // ── products ────────────────────────────────────────────────────────────
    const prodCatIds = new Map<string, string>();
    for (const name of productCategories) {
      const pid = id();
      prodCatIds.set(name, pid);
      await ins("product_categories", { id: pid, name, createdAt: now, updatedAt: now });
    }

    const productIds = new Map<string, { id: string; price: number }>();
    for (const [name, cat, price, stock, threshold, description] of products) {
      const pid = id();
      productIds.set(name, { id: pid, price });
      await ins("products", {
        id: pid,
        name,
        description,
        price: money(price),
        currency: "GHS",
        isActive: true,
        stockQuantity: stock,
        lowStockThreshold: threshold,
        trackStock: true,
        categoryId: prodCatIds.get(cat) ?? null,
        createdAt: now,
        updatedAt: now,
      });
      // Opening stock movement so the stock ledger isn't empty.
      await ins("product_stock_movements", {
        id: id(),
        productId: pid,
        type: "IN",
        quantity: stock,
        notes: "Opening stock",
        createdAt: day(-30),
      });
    }
    console.log(`Products: ${productIds.size} (one deliberately below its low-stock threshold)`);

    // ── sections, material categories, materials ────────────────────────────
    const sectionIds = new Map<string, string>();
    for (const [i, name] of sections.entries()) {
      const sid = id();
      sectionIds.set(name, sid);
      await ins("sections", {
        id: sid, name, isActive: true, sortOrder: i, createdAt: now, updatedAt: now,
      });
    }

    const matCatIds = new Map<string, string>();
    for (const name of materialCategories) {
      const mid = id();
      matCatIds.set(name, mid);
      await ins("material_categories", { id: mid, name, createdAt: now, updatedAt: now });
    }

    for (const [name, cat, unit, unitCost, stock, threshold] of materials) {
      const mid = id();
      await ins("materials", {
        id: mid,
        name,
        unit,
        unitCost: money(unitCost),
        currency: "GHS",
        stockQuantity: money(stock),
        lowStockThreshold: money(threshold),
        trackStock: true,
        isActive: true,
        categoryId: matCatIds.get(cat) ?? null,
        createdAt: now,
        updatedAt: now,
      });
      // Restock in, then a couple of issuances out to sections.
      await ins("material_movements", {
        id: id(), materialId: mid, type: "IN", quantity: money(stock),
        unitCostAtMovement: money(unitCost), notes: "Opening stock", createdAt: day(-30),
      });
      const target = cat === "Chemicals" ? "Hair" : cat === "Disposables" ? "Nails" : "Barber";
      await ins("material_movements", {
        id: id(), materialId: mid, type: "OUT", quantity: money(Math.max(1, Math.round(stock * 0.05))),
        sectionId: sectionIds.get(target) ?? null, unitCostAtMovement: money(unitCost),
        notes: `Issued to ${target}`, createdAt: day(-7),
      });
    }
    console.log(`Materials: ${materials.length} across ${sectionIds.size} sections, with movement history`);

    // ── manual payment methods ──────────────────────────────────────────────
    const manualIds = new Map<string, string>();
    for (const [i, name] of manualPaymentMethods.entries()) {
      const mid = id();
      manualIds.set(name, mid);
      await ins("manual_payment_methods", {
        id: mid, name, isActive: true, sortOrder: i, createdAt: now, updatedAt: now,
      });
    }

    // ── promo codes ─────────────────────────────────────────────────────────
    const promoIds = new Map<string, string>();
    const promos = [
      { code: "WELCOME10", description: "10% off a first visit", discountType: "PERCENTAGE", discountValue: 10, maxUses: 100, minBookingAmount: 100, expires: 90 },
      { code: "FESTIVE50", description: "GHS 50 off bookings over GHS 250", discountType: "FIXED", discountValue: 50, maxUses: 50, minBookingAmount: 250, expires: 45 },
      { code: "VIP20", description: "20% off for VIP clients", discountType: "PERCENTAGE", discountValue: 20, maxUses: 20, minBookingAmount: null, expires: 30 },
    ];
    for (const p of promos) {
      const pid = id();
      promoIds.set(p.code, pid);
      await ins("promo_codes", {
        id: pid,
        code: p.code,
        description: p.description,
        discountType: p.discountType,
        discountValue: money(p.discountValue),
        maxUses: p.maxUses,
        usedCount: 0,
        expiresAt: day(p.expires),
        isActive: true,
        minBookingAmount: p.minBookingAmount === null ? null : money(p.minBookingAmount),
        createdAt: now,
        updatedAt: now,
      });
    }
    console.log(`Promo codes: ${promoIds.size}`);

    // ── business hours + a blocked date ─────────────────────────────────────
    const hours = [
      { dayOfWeek: 0, startTime: "09:00", endTime: "17:00", isOpen: false, max: 4 },
      { dayOfWeek: 1, startTime: "09:00", endTime: "19:00", isOpen: true, max: 6 },
      { dayOfWeek: 2, startTime: "09:00", endTime: "19:00", isOpen: true, max: 6 },
      { dayOfWeek: 3, startTime: "09:00", endTime: "19:00", isOpen: true, max: 6 },
      { dayOfWeek: 4, startTime: "09:00", endTime: "19:00", isOpen: true, max: 6 },
      { dayOfWeek: 5, startTime: "09:00", endTime: "20:00", isOpen: true, max: 8 },
      { dayOfWeek: 6, startTime: "09:00", endTime: "17:00", isOpen: true, max: 8 },
    ];
    for (const h of hours) {
      await ins("business_hours", {
        id: id(), dayOfWeek: h.dayOfWeek, startTime: h.startTime, endTime: h.endTime,
        isOpen: h.isOpen, maxConcurrentBookings: h.max, updatedAt: now,
      });
    }
    await ins("blocked_dates", {
      id: id(), date: ymd(day(12)), reason: "Staff training day", createdAt: now,
    });

    // ── system settings ─────────────────────────────────────────────────────
    await ins("system_settings", {
      id: id(), key: "processing_fee_rate", value: "0.0195", createdAt: now, updatedAt: now,
    });
    await ins("system_settings", {
      id: id(), key: "walkin_email", value: `walkins@${DEMO_DOMAIN}`, createdAt: now, updatedAt: now,
    });

    // ── bookings, with services, products, payments ─────────────────────────
    let refCounter = 1000;
    let bookingCount = 0;
    let paymentCount = 0;

    for (const b of bookingSpecs) {
      const bookingId = id();
      const bookingDate = day(b.d);
      const createdAt = day(b.d - 3);

      // Widened out of the `as const` tuple types: mapping over a union of
      // readonly tuples isn't callable, so pin the element type first.
      const svcNames: readonly string[] = b.svc;
      const chosen = svcNames.map((n) => {
        const s = serviceIds.get(n);
        if (!s) throw new Error(`Unknown service in booking spec: ${n}`);
        return { name: n, ...s };
      });
      const servicesTotal = chosen.reduce((sum, s) => sum + s.price, 0);

      const prodSpecs: ReadonlyArray<readonly [string, number]> =
        "prods" in b && b.prods ? (b.prods as ReadonlyArray<readonly [string, number]>) : [];
      const chosenProducts = prodSpecs.map(([n, qty]) => {
        const p = productIds.get(n);
        if (!p) throw new Error(`Unknown product in booking spec: ${n}`);
        return { id: p.id, price: p.price, qty };
      });
      const productsTotal = chosenProducts.reduce((sum, p) => sum + p.price * p.qty, 0);

      const gross = servicesTotal + productsTotal;

      // Discount, if the spec attached a promo code.
      let discount = 0;
      let promoId: string | null = null;
      if ("promo" in b && b.promo) {
        promoId = promoIds.get(b.promo) ?? null;
        const promo = promos.find((p) => p.code === b.promo)!;
        discount = promo.discountType === "PERCENTAGE"
          ? Math.round(gross * (promo.discountValue / 100) * 100) / 100
          : promo.discountValue;
        if (promoId) {
          await client.query(
            `UPDATE promo_codes SET "usedCount" = "usedCount" + 1 WHERE id = $1`,
            [promoId]
          );
        }
      }
      const net = Math.max(0, gross - discount);

      const stylistId = "stylist" in b && b.stylist !== undefined ? stylistIds[b.stylist] : null;

      await ins("bookings", {
        id: bookingId,
        bookingReference: `PLB-${refCounter++}`,
        clientName: b.who,
        clientEmail: `${b.who.toLowerCase().replace(/[^a-z]+/g, ".")}@${DEMO_DOMAIN}`,
        clientPhone: `02${Math.floor(10_000_000 + Math.random() * 89_999_999)}`,
        bookingDate: ymd(bookingDate),
        bookingTime: b.t,
        status: b.status,
        paymentStatus: b.pay,
        bookingType: "walkin" in b && b.walkin ? "WALKIN" : "SCHEDULED",
        promoCodeId: promoId,
        discountAmount: discount > 0 ? money(discount) : null,
        assignedToId: stylistId,
        cancelReason: "cancel" in b && b.cancel ? b.cancel : null,
        termsAcceptedAt: createdAt,
        createdAt,
      });

      for (const s of chosen) {
        await ins("booking_services", {
          bookingId,
          serviceId: s.id,
          priceAtBooking: money(s.price),
          durationAtBooking: s.minutes,
          quantity: 1,
          assignedToId: stylistId,
        });
      }

      for (const p of chosenProducts) {
        await ins("booking_products", {
          bookingId, productId: p.id, priceAtBooking: money(p.price), quantity: p.qty,
        });
        // Sale movement + matching stock decrement, so the ledger reconciles.
        await ins("product_stock_movements", {
          id: id(), productId: p.id, type: "SALE", quantity: p.qty,
          notes: "Sold with booking", bookingId, createdAt,
        });
        await client.query(
          `UPDATE products SET "stockQuantity" = "stockQuantity" - $1 WHERE id = $2`,
          [p.qty, p.id]
        );
      }

      // Payment, where the spec says one exists.
      if (b.pay !== "PENDING") {
        const provider = "provider" in b && b.provider ? b.provider : "MANUAL";
        const amount = b.pay === "PARTIAL" && "deposit" in b && b.deposit ? b.deposit : net;
        const isGateway = provider !== "MANUAL";
        // Gateway payments carry the 1.95% surcharge the fee setting describes.
        const fee = isGateway ? Math.round(amount * 0.0195 * 100) / 100 : 0;

        await ins("payments", {
          id: id(),
          bookingId,
          provider,
          providerRef: isGateway
            ? `ps_demo_${randomBytes(6).toString("hex")}`
            : `MANUAL-${refCounter}`,
          amount: money(amount),
          feeAmount: money(fee),
          currency: "GHS",
          status: b.pay === "REFUNDED" ? "REFUNDED" : "PAID",
          manualMethodId: !isGateway && "manual" in b && b.manual
            ? manualIds.get(b.manual) ?? null
            : null,
          rawPayload: { source: "seed-demo", note: "Demo payment, not a real transaction" },
          createdAt,
          updatedAt: createdAt,
        });
        paymentCount++;
      }

      bookingCount++;
    }
    console.log(`Bookings: ${bookingCount} (past, today and upcoming) with ${paymentCount} payments`);

    // ── gift cards ──────────────────────────────────────────────────────────
    const facial = serviceIds.get("Deep Cleansing Facial")!;
    const massage = serviceIds.get("Swedish Full Body Massage")!;

    const gc1 = id();
    await ins("gift_cards", {
      id: gc1, code: "GFT-DEMO0001",
      senderName: "Kwame Asare", senderEmail: `kwame.asare@${DEMO_DOMAIN}`, senderPhone: "0244000111",
      recipientName: "Adwoa Asare", recipientEmail: `adwoa.asare@${DEMO_DOMAIN}`, recipientPhone: "0244000222",
      message: "Happy birthday! Enjoy a day of pampering.",
      deliveryMethod: "EMAIL", deliveredAt: day(-9),
      totalAmount: money(500), balance: money(500), feeAmount: money(9.75), currency: "GHS",
      status: "ACTIVE", expiresAt: day(180),
      paymentStatus: "PAID", paymentProvider: "PRIMARY_PAYSTACK",
      paymentRef: `ps_demo_${randomBytes(6).toString("hex")}`,
      createdAt: day(-10), updatedAt: day(-9),
    });
    await ins("gift_card_items", {
      id: id(), giftCardId: gc1, itemType: "SERVICE", serviceId: massage.id,
      name: "Swedish Full Body Massage", unitPrice: money(massage.price), quantity: 1,
    });

    const gc2 = id();
    await ins("gift_cards", {
      id: gc2, code: "GFT-DEMO0002",
      senderName: "Nana Yaw", senderEmail: `nana.yaw@${DEMO_DOMAIN}`, senderPhone: "0201234567",
      recipientName: "Akua Serwaa", recipientEmail: `akua.serwaa@${DEMO_DOMAIN}`, recipientPhone: "0209876543",
      message: "Thank you for everything.",
      deliveryMethod: "BOTH", deliveredAt: day(-20),
      totalAmount: money(300), balance: money(100), feeAmount: money(5.85), currency: "GHS",
      status: "PARTIALLY_REDEEMED", expiresAt: day(160),
      paymentStatus: "PAID", paymentProvider: "PRIMARY_PAYSTACK",
      paymentRef: `ps_demo_${randomBytes(6).toString("hex")}`,
      createdAt: day(-21), updatedAt: day(-11),
    });
    await ins("gift_card_items", {
      id: id(), giftCardId: gc2, itemType: "SERVICE", serviceId: facial.id,
      name: "Deep Cleansing Facial", unitPrice: money(facial.price), quantity: 1,
    });
    await ins("gift_card_redemptions", {
      id: id(), giftCardId: gc2, amountApplied: money(200), createdAt: day(-11),
    });

    await ins("gift_cards", {
      id: id(), code: "GFT-DEMO0003",
      senderName: "Selorm Agbo", senderEmail: `selorm.agbo@${DEMO_DOMAIN}`, senderPhone: "0277654321",
      recipientName: "Dela Agbo", recipientEmail: `dela.agbo@${DEMO_DOMAIN}`, recipientPhone: null,
      message: null,
      deliveryMethod: "EMAIL", deliveredAt: null,
      totalAmount: money(250), balance: money(250), feeAmount: money(0), currency: "GHS",
      status: "PENDING_PAYMENT", expiresAt: null,
      paymentStatus: "PENDING", paymentProvider: null, paymentRef: null,
      createdAt: day(-1), updatedAt: day(-1),
    });
    console.log("Gift cards: 3 (active, partially redeemed, awaiting payment)");

    await client.query("COMMIT");

    console.log("");
    console.log("Demo data seeded.");
    console.log("");
    console.log("Stylist logins (role STAFF, for the stylist portal):");
    for (const s of stylists) console.log(`  ${s.email}`);
    console.log(`  password: ${stylistPassword}`);
    console.log("Save this now — it is not stored anywhere and cannot be shown again.");
    console.log("");
    console.log("Your admin account was not modified.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Failed to seed demo data:", error);
  process.exitCode = 1;
});
