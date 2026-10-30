import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { hashPassword, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password, display_name } = await request.json();

    if (!email || !password || !display_name) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const sql = getSQL();

    const existing = await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
    if (existing.length > 0) {
      return NextResponse.json({ error: "Email already taken" }, { status: 409 });
    }

    const password_hash = await hashPassword(password);

    const rows = await sql`
      INSERT INTO users (email, password_hash, display_name)
      VALUES (${email}, ${password_hash}, ${display_name.trim()})
      RETURNING id
    `;

    await setAuthCookie(rows[0].id as string);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
