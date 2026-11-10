#!/usr/bin/env node
/**
 * Set the Spotlight Store for the current (or specified) month.
 *
 * Usage:
 *   node scripts/set-spotlight.js "Store Name"
 *   node scripts/set-spotlight.js "Store Name" --note "Amazing first store!"
 *   node scripts/set-spotlight.js "Store Name" --month 2026-12
 */

const { neon } = require("@neondatabase/serverless");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

const args = process.argv.slice(2);
let storeName = null;
let note = null;
let month = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--note" && args[i + 1]) { note = args[++i]; }
  else if (args[i] === "--month" && args[i + 1]) { month = args[++i]; }
  else if (!args[i].startsWith("--")) { storeName = args[i]; }
}

if (!storeName) {
  console.error("Usage: node scripts/set-spotlight.js \"Store Name\" [--note \"text\"] [--month YYYY-MM]");
  process.exit(1);
}

async function main() {
  // Fuzzy match
  const stores = await sql`
    SELECT s.id, s.store_name, s.user_id, u.display_name AS owner_name
    FROM stores s
    JOIN users u ON u.id = s.user_id
    WHERE LOWER(s.store_name) LIKE ${`%${storeName.toLowerCase().trim()}%`}
    LIMIT 5
  `;

  if (stores.length === 0) {
    console.error(`❌ No store found matching "${storeName}"`);
    process.exit(1);
  }

  if (stores.length > 1) {
    console.error(`Multiple matches — be more specific:`);
    stores.forEach((s) => console.log(`  • ${s.store_name} (by ${s.owner_name})`));
    process.exit(1);
  }

  const store = stores[0];
  const now = new Date();
  const targetMonth = month || `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  await sql`
    INSERT INTO spotlight_stores (store_id, user_id, month, note)
    VALUES (${store.id}, ${store.user_id}, ${targetMonth}, ${note || null})
    ON CONFLICT (month) DO UPDATE SET
      store_id = ${store.id},
      user_id = ${store.user_id},
      note = ${note || null},
      created_at = now()
  `;

  console.log(`\n⭐ Spotlight set!\n`);
  console.log(`  Month: ${targetMonth}`);
  console.log(`  Store: ${store.store_name}`);
  console.log(`  Owner: ${store.owner_name}`);
  if (note) console.log(`  Note:  ${note}`);
  console.log();
}

main().catch((e) => { console.error(e); process.exit(1); });
