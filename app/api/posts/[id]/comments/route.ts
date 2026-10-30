import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// GET — read comments (open to everyone)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const sql = getSQL();

  const comments = await sql`
    SELECT c.*, u.display_name, u.avatar_url
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ${postId}
    ORDER BY c.created_at ASC
  `;

  return NextResponse.json({ comments });
}

// POST — write comment (auth required)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: postId } = await params;
  const { content } = await request.json();

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
  }

  const sql = getSQL();
  const rows = await sql`
    INSERT INTO comments (user_id, post_id, content)
    VALUES (${user.id}, ${postId}, ${content.trim()})
    RETURNING *
  `;

  const post = await sql`SELECT user_id FROM posts WHERE id = ${postId}`;
  if (post.length > 0 && post[0].user_id !== user.id) {
    await sql`
      INSERT INTO notifications (user_id, actor_id, type, post_id)
      VALUES (${post[0].user_id}, ${user.id}, 'comment', ${postId})
    `;
  }

  return NextResponse.json({
    comment: {
      ...rows[0],
      display_name: user.display_name,
      avatar_url: user.avatar_url,
    },
  });
}
