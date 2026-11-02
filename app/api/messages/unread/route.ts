import { NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ hasUnread: false });

  const sql = getSQL();

  // Get when this user last read their messages
  const userRow = await sql`SELECT messages_last_read FROM users WHERE id = ${user.id}`;
  const lastRead = userRow[0]?.messages_last_read || new Date(0);

  // Check if any message exists in their conversations that's newer than lastRead
  // and wasn't sent by them
  const unread = await sql`
    SELECT 1 FROM messages m
    JOIN conversation_members cm ON cm.conversation_id = m.conversation_id
    WHERE cm.user_id = ${user.id}
      AND m.sender_id != ${user.id}
      AND m.created_at > ${lastRead}
    LIMIT 1
  `;

  return NextResponse.json({ hasUnread: unread.length > 0 });
}

// POST — mark messages as read
export async function POST() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sql = getSQL();
  await sql`UPDATE users SET messages_last_read = NOW() WHERE id = ${user.id}`;

  return NextResponse.json({ ok: true });
}
