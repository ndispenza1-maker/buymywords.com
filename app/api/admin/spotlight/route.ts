import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// Admin-only: only the first user (Nick) can set the spotlight
const ADMIN_EMAILS = [process.env.ADMIN_EMAIL || ""];

/**
 * POST /api/admin/spotlight
 * Body: { store_name: string, note?: string, month?: "YYYY-MM" }
 *
 * Looks up the store by name (fuzzy match), sets it as the spotlight
 * for the given month (defaults to current month).
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { store_name, note, month } = body;

  if (!store_name) {
    return NextResponse.json({ error: "store_name is required" }, { status: 400 });
  }

  const sql = getSQL();

  // Fuzzy match store by name (case-insensitive)
  const stores = await sql`
    SELECT s.id, s.store_name, s.user_id, u.display_name AS owner_name
    FROM stores s
    JOIN users u ON u.id = s.user_id
    WHERE LOWER(s.store_name) LIKE ${`%${store_name.toLowerCase().trim()}%`}
    LIMIT 5
  `;

  if (stores.length === 0) {
    return NextResponse.json({ error: `No store found matching "${store_name}"` }, { status: 404 });
  }

  if (stores.length > 1) {
    // Return matches so we can pick the right one
    return NextResponse.json({
      error: "Multiple stores match — be more specific",
      matches: stores.map((s) => ({ id: s.id, name: s.store_name, owner: s.owner_name })),
    }, { status: 400 });
  }

  const store = stores[0];

  // Determine month
  const now = new Date();
  const targetMonth = month || `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  // Upsert spotlight
  await sql`
    INSERT INTO spotlight_stores (store_id, user_id, month, note)
    VALUES (${store.id}, ${store.user_id}, ${targetMonth}, ${note || null})
    ON CONFLICT (month) DO UPDATE SET
      store_id = ${store.id},
      user_id = ${store.user_id},
      note = ${note || null},
      created_at = now()
  `;

  return NextResponse.json({
    ok: true,
    spotlight: {
      month: targetMonth,
      store_name: store.store_name,
      owner_name: store.owner_name,
      note: note || null,
    },
  });
}

/**
 * GET /api/admin/spotlight — List all spotlights (admin only)
 */
export async function GET() {
  const user = await getAuthUser();
  if (!user || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const sql = getSQL();
  const spotlights = await sql`
    SELECT sp.month, sp.note, sp.created_at, s.store_name, u.display_name AS owner_name
    FROM spotlight_stores sp
    JOIN stores s ON s.id = sp.store_id
    JOIN users u ON u.id = sp.user_id
    ORDER BY sp.month DESC
    LIMIT 12
  `;

  return NextResponse.json({ spotlights });
}
