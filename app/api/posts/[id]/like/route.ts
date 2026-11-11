import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { isRateLimited, checkUserAgent } from "@/lib/security";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Bot check
  const uaBlock = checkUserAgent(request);
  if (uaBlock) return NextResponse.json({ error: uaBlock }, { status: 403 });

  // Rate limit: 120 likes per 15 minutes
  if (isRateLimited(`like:${user.id}`, 120, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many likes. Please wait a few minutes." }, { status: 429 });
  }

  const { id: postId } = await params;
  const sql = getSQL();

  // Toggle like
  const existing = await sql`
    SELECT id FROM likes WHERE user_id = ${user.id} AND post_id = ${postId}
  `;

  if (existing.length > 0) {
    await sql`DELETE FROM likes WHERE user_id = ${user.id} AND post_id = ${postId}`;
    return NextResponse.json({ liked: false });
  } else {
    await sql`INSERT INTO likes (user_id, post_id) VALUES (${user.id}, ${postId})`;

    // Notify post author (if not self)
    const post = await sql`SELECT user_id FROM posts WHERE id = ${postId}`;
    if (post.length > 0 && post[0].user_id !== user.id) {
      await sql`
        INSERT INTO notifications (user_id, actor_id, type, post_id)
        VALUES (${post[0].user_id}, ${user.id}, 'like', ${postId})
      `;
    }

    return NextResponse.json({ liked: true });
  }
}
