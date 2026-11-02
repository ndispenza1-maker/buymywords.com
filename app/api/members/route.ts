import { NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Log in to see members" }, { status: 401 });
  }

  const sql = getSQL();

  const members = await sql`
    SELECT id, display_name, account_type, avatar_url
    FROM users
    WHERE profile_complete = true
    ORDER BY created_at ASC
  `;

  return NextResponse.json({ members });
}
