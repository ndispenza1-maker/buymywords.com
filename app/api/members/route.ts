import { NextResponse } from "next/server";
import { getSQL } from "@/lib/db";

export async function GET() {
  const sql = getSQL();

  const members = await sql`
    SELECT id, display_name, account_type, avatar_url
    FROM users
    WHERE profile_complete = true
    ORDER BY created_at ASC
  `;

  return NextResponse.json({ members });
}
