import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// GET messages in a conversation
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId } = await params;
  const sql = getSQL();

  // Verify user is a member
  const member = await sql`
    SELECT 1 FROM conversation_members
    WHERE conversation_id = ${conversationId} AND user_id = ${user.id}
  `;
  if (member.length === 0) {
    return NextResponse.json({ error: "Not a member" }, { status: 403 });
  }

  const messages = await sql`
    SELECT m.*, u.handle, u.display_name, u.avatar_url
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.conversation_id = ${conversationId}
    ORDER BY m.created_at ASC
  `;

  return NextResponse.json({ messages });
}
