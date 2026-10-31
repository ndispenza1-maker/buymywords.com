import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.profile_complete) {
    return NextResponse.json({ error: "Profile already built" }, { status: 400 });
  }

  const { account_type, bio } = await request.json();

  if (!account_type || !["shopper", "store_owner"].includes(account_type)) {
    return NextResponse.json({ error: "Invalid account type" }, { status: 400 });
  }

  const sql = getSQL();
  await sql`
    UPDATE users
    SET account_type = ${account_type},
        bio = ${(bio || "").slice(0, 300)},
        profile_complete = true,
        updated_at = now()
    WHERE id = ${user.id}
  `;

  return NextResponse.json({ ok: true });
}
