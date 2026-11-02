import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { checkAccess } from "@/lib/subscription";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Subscription gate — shoppers need active sub to follow
  const access = await checkAccess(user.id);
  if (!access.canFollow) {
    return NextResponse.json({ error: access.reason, gated: true }, { status: 403 });
  }

  const { user_id } = await request.json();

  if (!user_id || user_id === user.id) {
    return NextResponse.json({ error: "Invalid follow target" }, { status: 400 });
  }

  const sql = getSQL();

  // Toggle follow
  const existing = await sql`
    SELECT id FROM follows WHERE follower_id = ${user.id} AND following_id = ${user_id}
  `;

  if (existing.length > 0) {
    await sql`DELETE FROM follows WHERE follower_id = ${user.id} AND following_id = ${user_id}`;
    return NextResponse.json({ following: false });
  } else {
    await sql`INSERT INTO follows (follower_id, following_id) VALUES (${user.id}, ${user_id})`;

    // Notify
    await sql`
      INSERT INTO notifications (user_id, actor_id, type)
      VALUES (${user_id}, ${user.id}, 'follow')
    `;

    return NextResponse.json({ following: true });
  }
}
