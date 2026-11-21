import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { hashPassword, setAuthCookie } from "@/lib/auth";
import { isRateLimited } from "@/lib/security";
import { consumeResetToken } from "@/lib/password-reset";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(`reset:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let body: { token?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const token = (body.token || "").trim();
  const password = body.password || "";

  if (!token) {
    return NextResponse.json({ error: "Reset link is missing its token" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  try {
    const userId = await consumeResetToken(token);
    if (!userId) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Request a new one." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const sql = getSQL();
    await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${userId}`;

    // Sign them straight in — they just proved control of the mailbox.
    await setAuthCookie(userId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
