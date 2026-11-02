import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { hashPassword, setAuthCookie } from "@/lib/auth";
import { checkUserAgent, isRateLimited, isHoneypotTriggered } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    // Security: block bots
    const uaBlock = checkUserAgent(request);
    if (uaBlock) return NextResponse.json({ error: uaBlock }, { status: 403 });

    // Security: rate limit — max 5 signups per hour per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(`signup:${ip}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many signups. Try again later." }, { status: 429 });
    }

    const body = await request.json();
    const { email, password, display_name } = body;

    // Security: honeypot check
    if (isHoneypotTriggered(body)) {
      // Fake success — don't tip off the bot
      return NextResponse.json({ ok: true });
    }

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
