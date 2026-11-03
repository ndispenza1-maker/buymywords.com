#!/usr/bin/env node
/**
 * Generate founders codes for The Mall.
 *
 * Usage:
 *   node scripts/generate-founders-code.js [count] [--uses N] [--days N] [--note "text"]
 *
 * Examples:
 *   node scripts/generate-founders-code.js              # 1 code, 1 use, 30 days
 *   node scripts/generate-founders-code.js 5             # 5 codes
 *   node scripts/generate-founders-code.js 3 --uses 5    # 3 codes, 5 uses each
 *   node scripts/generate-founders-code.js --days 60 --note "VIP beta"
 */

const crypto = require("crypto");
const { neon } = require("@neondatabase/serverless");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// Parse args
const args = process.argv.slice(2);
let count = 1;
let maxUses = 1;
let durationDays = 30;
let note = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--uses" && args[i + 1]) { maxUses = parseInt(args[++i]); }
  else if (args[i] === "--days" && args[i + 1]) { durationDays = parseInt(args[++i]); }
  else if (args[i] === "--note" && args[i + 1]) { note = args[++i]; }
  else if (!args[i].startsWith("--")) { count = parseInt(args[i]) || 1; }
}

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segment = (len) => {
    const bytes = crypto.randomBytes(len);
    return Array.from(bytes).map((b) => chars[b % chars.length]).join("");
  };
  return `MALL-${segment(4)}-${segment(4)}`;
}

function hashCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

async function main() {
  const codes = [];

  for (let i = 0; i < count; i++) {
    const code = generateCode();
    const hash = hashCode(code);

    await sql`
      INSERT INTO founders_codes (code_hash, max_uses, duration_days, note)
      VALUES (${hash}, ${maxUses}, ${durationDays}, ${note})
    `;

    codes.push(code);
  }

  console.log(`\n✅ Generated ${codes.length} founders code(s):\n`);
  console.log(`  Uses: ${maxUses} | Duration: ${durationDays} days${note ? ` | Note: ${note}` : ""}\n`);
  codes.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
  console.log("\n  Share these with your beta testers. They won't be shown again.\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
