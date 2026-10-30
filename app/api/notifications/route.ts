import { NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sql = getSQL();
  const notifications = await sql`
    SELECT n.*, u.handle AS actor_handle, u.display_name AS actor_name, u.avatar_url AS actor_avatar
    FROM notifications n
    LEFT JOIN users u ON n.actor_id = u.id
    WHERE n.user_id = ${user.id}
    ORDER BY n.created_at DESC
    LIMIT 50
  `;

  // Mark as read
  await sql`UPDATE notifications SET read = true WHERE user_id = ${user.id} AND read = false`;

  return NextResponse.json({ notifications });
}
