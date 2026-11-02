import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

// PATCH — edit a post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: postId } = await params;
  const { content } = await request.json();

  if (!content || content.trim().length === 0) {
    return NextResponse.json({ error: "Post cannot be empty" }, { status: 400 });
  }

  if (content.length > 2000) {
    return NextResponse.json({ error: "Post too long (max 2000 characters)" }, { status: 400 });
  }

  const sql = getSQL();

  // Verify ownership
  const post = await sql`SELECT id FROM posts WHERE id = ${postId} AND user_id = ${user.id}`;
  if (post.length === 0) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  await sql`UPDATE posts SET content = ${content.trim()} WHERE id = ${postId}`;

  return NextResponse.json({ ok: true });
}

// DELETE — delete a post
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: postId } = await params;
  const sql = getSQL();

  // Verify ownership
  const post = await sql`SELECT id FROM posts WHERE id = ${postId} AND user_id = ${user.id}`;
  if (post.length === 0) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  await sql`DELETE FROM posts WHERE id = ${postId}`;

  return NextResponse.json({ ok: true });
}
