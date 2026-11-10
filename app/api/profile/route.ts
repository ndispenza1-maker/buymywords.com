import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { isRateLimited } from "@/lib/security";

/**
 * PATCH /api/profile — Update own profile fields (bio, display_name, etc.)
 * Only authenticated users can update their own profile.
 */
export async function PATCH(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Rate limit: 10 updates per 15 minutes
  if (isRateLimited(`profile:${user.id}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many updates. Please wait a few minutes." }, { status: 429 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const sql = getSQL();
  const updates: string[] = [];

  // Bio update
  if (body.bio !== undefined) {
    const bio = typeof body.bio === "string" ? body.bio.trim().slice(0, 300) : "";
    await sql`UPDATE users SET bio = ${bio}, updated_at = now() WHERE id = ${user.id}`;
    updates.push("bio");
  }

  // Display name update (for future use)
  if (body.display_name !== undefined) {
    const name = typeof body.display_name === "string" ? body.display_name.trim().slice(0, 50) : "";
    if (name.length < 1) {
      return NextResponse.json({ error: "Display name cannot be empty" }, { status: 400 });
    }
    await sql`UPDATE users SET display_name = ${name}, updated_at = now() WHERE id = ${user.id}`;
    updates.push("display_name");
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, updated: updates });
}
