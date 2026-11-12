import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { isRateLimited, checkUserAgent } from "@/lib/security";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Bot check
  const uaBlock = checkUserAgent(request);
  if (uaBlock) return NextResponse.json({ error: uaBlock }, { status: 403 });

  const { id: postId } = await params;
  const sql = getSQL();

  // Try authenticated user first
  const user = await getAuthUser();

  if (user) {
    // ── Logged-in like (existing flow) ──
    if (isRateLimited(`like:${user.id}`, 120, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many likes. Please wait a few minutes." }, { status: 429 });
    }

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

  // ── Anonymous like ──
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Missing visitor_id" }, { status: 400 });
  }

  const visitorId = body.visitor_id;
  if (!visitorId || typeof visitorId !== "string" || visitorId.length < 8 || visitorId.length > 64) {
    return NextResponse.json({ error: "Invalid visitor_id" }, { status: 400 });
  }

  // Rate limit anonymous by IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(`anon-like:${ip}`, 60, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many likes. Please wait a few minutes." }, { status: 429 });
  }

  const existing = await sql`
    SELECT id FROM anonymous_likes WHERE visitor_id = ${visitorId} AND post_id = ${postId}
  `;

  if (existing.length > 0) {
    await sql`DELETE FROM anonymous_likes WHERE visitor_id = ${visitorId} AND post_id = ${postId}`;
    return NextResponse.json({ liked: false });
  } else {
    await sql`INSERT INTO anonymous_likes (visitor_id, post_id) VALUES (${visitorId}, ${postId})`;
    return NextResponse.json({ liked: true });
  }
}
