import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// GET — chronological feed
export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");
  const limit = 20;

  const sql = getSQL();

  const posts = cursor
    ? await sql`
        SELECT p.*, u.display_name, u.avatar_url,
          (SELECT COUNT(*) FROM likes WHERE post_id = p.id)::int AS like_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = p.id)::int AS comment_count,
          EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ${user.id}) AS liked
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
          EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ${user.id}) AS liked
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
        LIMIT ${limit}
      `;

  return NextResponse.json({ posts });
}

// POST — create a post
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content, image_url } = await request.json();

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
