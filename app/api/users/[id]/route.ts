import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getAuthUser();
  const { id: userId } = await params;
  const sql = getSQL();

  const users = await sql`
    SELECT id, display_name, bio, avatar_url, cover_url, created_at
    FROM users WHERE id = ${userId}
  `;

  if (users.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const profile = users[0];
  const currentId = currentUser?.id || null;

  const [followerCount, followingCount, isFollowing, posts] = await Promise.all([
    sql`SELECT COUNT(*)::int AS count FROM follows WHERE following_id = ${profile.id}`,
    sql`SELECT COUNT(*)::int AS count FROM follows WHERE follower_id = ${profile.id}`,
    currentId
      ? sql`SELECT 1 FROM follows WHERE follower_id = ${currentId} AND following_id = ${profile.id}`
      : Promise.resolve([]),
    currentId
      ? sql`
          SELECT p.*, u.display_name, u.avatar_url,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id)::int AS like_count,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id)::int AS comment_count,
            EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = ${currentId}) AS liked
          FROM posts p
          JOIN users u ON p.user_id = u.id
          WHERE p.user_id = ${profile.id}
          ORDER BY p.created_at DESC
          LIMIT 50
        `
      : sql`
          SELECT p.*, u.display_name, u.avatar_url,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id)::int AS like_count,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id)::int AS comment_count,
            false AS liked
          FROM posts p
          JOIN users u ON p.user_id = u.id
          WHERE p.user_id = ${profile.id}
          ORDER BY p.created_at DESC
          LIMIT 50
        `,
  ]);

  return NextResponse.json({
    profile: {
      ...profile,
      follower_count: followerCount[0].count,
      following_count: followingCount[0].count,
      is_following: isFollowing.length > 0,
      is_self: currentId ? profile.id === currentId : false,
    },
    posts,
  });
}
