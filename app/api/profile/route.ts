import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { isRateLimited } from "@/lib/security";

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000; // ~180 days

/**
 * PATCH /api/profile — Update own profile fields (bio, display_name)
 *
 * Name change rules:
 * - First change is always free (name_changed_at is NULL)
 * - After that, 6-month cooldown before the next change
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

  // Bio update — no restrictions
  if (body.bio !== undefined) {
    const bio = typeof body.bio === "string" ? body.bio.trim().slice(0, 300) : "";
    await sql`UPDATE users SET bio = ${bio}, updated_at = now() WHERE id = ${user.id}`;
    updates.push("bio");
  }

  // Display name update — cooldown enforced
  if (body.display_name !== undefined) {
    const name = typeof body.display_name === "string" ? body.display_name.trim().slice(0, 50) : "";
    if (name.length < 1) {
      return NextResponse.json({ error: "Name can't be empty" }, { status: 400 });
    }

    // If name is the same as current, skip (no cooldown consumed)
    if (name === user.display_name) {
      // No-op — don't count it as a change
    } else {
      // Check cooldown
      const rows = await sql`SELECT name_changed_at FROM users WHERE id = ${user.id}`;
      const lastChanged = rows[0]?.name_changed_at ? new Date(rows[0].name_changed_at as string) : null;

      if (lastChanged) {
        const elapsed = Date.now() - lastChanged.getTime();
        if (elapsed < SIX_MONTHS_MS) {
          const remaining = SIX_MONTHS_MS - elapsed;
          const daysLeft = Math.ceil(remaining / (24 * 60 * 60 * 1000));
          return NextResponse.json(
            { error: `You can change your name again in ${daysLeft} days.` },
            { status: 429 }
          );
        }
      }

      // Apply the change + stamp the cooldown
      await sql`
        UPDATE users
        SET display_name = ${name}, name_changed_at = now(), updated_at = now()
        WHERE id = ${user.id}
      `;
      updates.push("display_name");
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, updated: updates });
}

/**
 * GET /api/profile — Get own profile metadata (name change eligibility, etc.)
 */
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const sql = getSQL();
  const rows = await sql`SELECT name_changed_at FROM users WHERE id = ${user.id}`;
  const lastChanged = rows[0]?.name_changed_at ? new Date(rows[0].name_changed_at as string) : null;

  let canChangeName = true;
  let nameChangeDaysLeft = 0;

  if (lastChanged) {
    const elapsed = Date.now() - lastChanged.getTime();
    if (elapsed < SIX_MONTHS_MS) {
      canChangeName = false;
      nameChangeDaysLeft = Math.ceil((SIX_MONTHS_MS - elapsed) / (24 * 60 * 60 * 1000));
    }
  }

  return NextResponse.json({
    canChangeName,
    nameChangeDaysLeft,
    nameChangedAt: lastChanged?.toISOString() || null,
  });
}
