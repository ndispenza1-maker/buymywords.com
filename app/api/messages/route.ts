import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { checkAccess } from "@/lib/subscription";
import { isRateLimited } from "@/lib/security";

// GET — list conversations
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sql = getSQL();
  const conversations = await sql`
    SELECT c.id, c.updated_at,
      (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
      (SELECT sender_id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_sender_id
    FROM conversations c
    JOIN conversation_members cm ON cm.conversation_id = c.id
    WHERE cm.user_id = ${user.id}
    ORDER BY c.updated_at DESC
  `;

  // Get the other user in each conversation
  const enriched = await Promise.all(
    conversations.map(async (conv) => {
      const others = await sql`
        SELECT u.id, u.display_name, u.avatar_url
        FROM conversation_members cm
        JOIN users u ON u.id = cm.user_id
        WHERE cm.conversation_id = ${conv.id} AND cm.user_id != ${user.id}
      `;
      return { ...conv, other_user: others[0] || null };
    })
  );

  return NextResponse.json({ conversations: enriched });
}

// POST — start a conversation or send a message
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Subscription gate — shoppers need active sub to message
  const access = await checkAccess(user.id);
  if (!access.canMessage) {
    return NextResponse.json({ error: access.reason, gated: true }, { status: 403 });
  }

  // H-4: Rate limit messaging — 30 messages per user per 15 minutes
  if (isRateLimited(`msg:${user.id}`, 30, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many messages. Please wait a few minutes." }, { status: 429 });
  }

  const { to_user_id, conversation_id, content } = await request.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
  }

  const sql = getSQL();

  let convoId = conversation_id;

  // Start new conversation
  if (!convoId && to_user_id) {
    // Check if conversation already exists between these two users
    const existing = await sql`
      SELECT cm1.conversation_id
      FROM conversation_members cm1
      JOIN conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
      WHERE cm1.user_id = ${user.id} AND cm2.user_id = ${to_user_id}
      LIMIT 1
    `;

    if (existing.length > 0) {
      convoId = existing[0].conversation_id;
    } else {
      const newConvo = await sql`INSERT INTO conversations DEFAULT VALUES RETURNING id`;
      convoId = newConvo[0].id;
      await sql`INSERT INTO conversation_members (conversation_id, user_id) VALUES (${convoId}, ${user.id})`;
      await sql`INSERT INTO conversation_members (conversation_id, user_id) VALUES (${convoId}, ${to_user_id})`;
    }
  }

  if (!convoId) {
    return NextResponse.json({ error: "No conversation target" }, { status: 400 });
  }

  // Send message
  const msg = await sql`
    INSERT INTO messages (conversation_id, sender_id, content)
    VALUES (${convoId}, ${user.id}, ${content.trim()})
    RETURNING *
  `;

  await sql`UPDATE conversations SET updated_at = now() WHERE id = ${convoId}`;

  return NextResponse.json({ message: msg[0], conversation_id: convoId });
}
