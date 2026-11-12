import { NextResponse } from "next/server";
import { getSQL } from "@/lib/db";

/**
 * GET /api/stores/leaderboard
 * Returns:
 * - leaderboard: newest 5 stores ("Fresh Stores")
 * - spotlight: the current month's spotlight store (if any)
 */
export async function GET() {
  const sql = getSQL();

  // Fresh Stores: newest 5 stores
  const stores = await sql`
    SELECT
      s.id AS store_id,
      s.store_name,
      s.store_type,
      s.external_url,
      s.user_id,
      s.created_at,
      u.display_name AS owner_name,
      u.avatar_url AS owner_avatar,
      (SELECT COUNT(*)::int FROM follows WHERE following_id = s.user_id) AS follower_count
    FROM stores s
    JOIN users u ON u.id = s.user_id
    WHERE u.profile_complete = true
    ORDER BY s.created_at DESC
    LIMIT 5
  `;

  // Current month spotlight
  const now = new Date();
  const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  const spotlight = await sql`
    SELECT
      sp.note,
      sp.month,
      s.id AS store_id,
      s.store_name,
      s.store_type,
      s.external_url,
      s.user_id,
      u.display_name AS owner_name,
      u.avatar_url AS owner_avatar,
      (SELECT COUNT(*)::int FROM follows WHERE following_id = s.user_id) AS follower_count
    FROM spotlight_stores sp
    JOIN stores s ON s.id = sp.store_id
    JOIN users u ON u.id = s.user_id
    WHERE sp.month = ${currentMonth}
    LIMIT 1
  `;

  return NextResponse.json({
    leaderboard: stores,
    spotlight: spotlight[0] || null,
  });
}
