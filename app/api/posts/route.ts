import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { checkUserAgent, isRateLimited, checkAccountAge, isHoneypotTriggered } from "@/lib/security";

// GET — chronological feed (open to everyone)
export async function GET(request: NextRequest) {
  const user = await getAuthUser();

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const limit = 20;

  const sql = getSQL();

  // If logged in, include per-user "liked" status; otherwise default false
  const userId = user?.id || null;

  const posts = cursor
    ? await sql`
        SELECT p.*, u.display_name, u.avatar_url,
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id)::int AS like_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id)::int AS comment_count,
          CASE WHEN ${userId}::uuid IS NOT NULL
            THEN EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ${userId})
            ELSE false
          END AS liked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.created_at < ${cursor}
        ORDER BY p.created_at DESC
        LIMIT ${limit}
      `
    : await sql`
        SELECT p.*, u.display_name, u.avatar_url,
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id)::int AS like_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id)::int AS comment_count,
          CASE WHEN ${userId}::uuid IS NOT NULL
            THEN EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ${userId})
            ELSE false
          END AS liked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT ${limit}
      `;

  return NextResponse.json({ posts });
}

// POST — create a post (auth required)
export async function POST(request: NextRequest) {
  // Security: block bots
  const uaBlock = checkUserAgent(request);
  if (uaBlock) return NextResponse.json({ error: uaBlock }, { status: 403 });

  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Security: rate limit — max 10 posts per 15 minutes per user
  if (isRateLimited(`post:${user.id}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Slow down — you're posting too fast" }, { status: 429 });
  }

  // Security: account age gate — must be 15 min old
  const minutesLeft = await checkAccountAge(user.id);
  if (minutesLeft !== null) {
    return NextResponse.json(
      { error: `Your account is brand new. You can post in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.` },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { content, image_url } = body;

  // Security: honeypot check
  if (isHoneypotTriggered(body)) {
    // Silently accept but don't actually post (don't tip off the bot)
    return NextResponse.json({ post: { id: 'ok' } });
  }

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "Post cannot be empty" }, { status: 400 });
  }

  if (content.length > 2000) {
    return NextResponse.json({ error: "Post too long (max 2000 characters)" }, { status: 400 });
  }

  const sql = getSQL();
  const rows = await sql`
    INSERT INTO posts (user_id, content, image_url)
    VALUES (${user.id}, ${content.trim()}, ${image_url || null})
    RETURNING *
  `;

  return NextResponse.json({
    post: {
      ...rows[0],
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      like_count: 0,
      comment_count: 0,
      liked: false,
    },
  });
}
