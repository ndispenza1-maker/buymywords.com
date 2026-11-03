import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { verifyPassword, setAuthCookie } from "@/lib/auth";
import { isRateLimited } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // H-2: Rate limit login — 10 attempts per IP per 15 minutes
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(`login:${ip}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
    }

    // 5 attempts per email per 15 minutes
    if (isRateLimited(`login:${email.toLowerCase()}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
    }

    const sql = getSQL();
    const rows = await sql`
      SELECT id, password_hash, auth_provider FROM users WHERE email = ${email} LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Google-only user trying to password login
    if (!rows[0].password_hash && rows[0].auth_provider === "google") {
      return NextResponse.json(
        { error: "This account uses Google sign-in. Click 'Continue with Google' above." },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, rows[0].password_hash as string);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await setAuthCookie(rows[0].id as string);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
