import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Allow re-entry if profile isn't complete yet (e.g. store owner backed out of subscribe)
  if (user.profile_complete) {
    return NextResponse.json({ error: "Profile already built" }, { status: 400 });
  }

  const { account_type, bio, pending } = await request.json();

  if (!account_type || !["shopper", "store_owner"].includes(account_type)) {
    return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
  }

  const sql = getSQL();

  // pending = true: store owner pre-subscribe. Set type but don't complete profile yet.
  const markComplete = !pending;

  await sql`
    UPDATE users
    SET account_type = ${account_type},
        bio = ${(bio || "").slice(0, 300)},
        profile_complete = ${markComplete},
        updated_at = now()
    WHERE id = ${user.id}
  `;

  return NextResponse.json({ ok: true });
}
