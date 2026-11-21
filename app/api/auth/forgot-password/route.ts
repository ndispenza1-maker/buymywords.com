import { NextRequest, NextResponse } from "next/server";
import { getSQL } from "@/lib/db";
import { isRateLimited } from "@/lib/security";
import { createResetToken } from "@/lib/password-reset";

export const runtime = "nodejs";

// Fixed base — never derive the emailed link from a request header, or an
// attacker can set Origin/Host and have the victim click a token to their host.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.themallofprojects.com";
const EMAIL_FROM =
  process.env.EMAIL_FROM || "The Mall of Projects <noreply@themallofprojects.com>";

async function sendResetEmail(to: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // No mail provider configured. Log for manual delivery; never echo in responses.
    console.log(`\n⚠️  PASSWORD RESET (no RESEND_API_KEY set)\n   To: ${to}\n   Link: ${resetUrl}\n`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to,
      subject: "Reset your password — The Mall of Projects",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background: #1a1412; color: #e8ddd3;">
          <h2 style="font-size: 18px; font-weight: 600; margin: 0 0 8px;">The Mall of Projects</h2>
          <p style="font-size: 14px; color: rgba(232,221,211,0.6); margin: 0 0 24px;">
            Someone asked to reset the password for this address. If that was you, set a new one below.
            The link works once and expires in one hour.
          </p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 28px; background: #E89B6B; color: #1a1412; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600;">
            Choose a new password
          </a>
          <p style="font-size: 12px; color: rgba(232,221,211,0.45); margin: 24px 0 0;">
            If you didn't request this, ignore this email — your password stays the same.
          </p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Resend rejected password reset email:", res.status, body);
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (isRateLimited(`forgot:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  if (isRateLimited(`forgot:email:${email}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json(
      { ok: true, message: "If that email has an account, a reset link is on its way." },
      { status: 200 }
    );
  }

  try {
    const sql = getSQL();
    const rows = await sql`SELECT id FROM users WHERE lower(email) = ${email} LIMIT 1`;

    // Always behave the same whether or not the account exists.
    if (rows[0]) {
      const token = await createResetToken(rows[0].id as string);
      const resetUrl = `${SITE_URL}/reset-password?token=${token}`;
      try {
        await sendResetEmail(email, resetUrl);
      } catch (mailErr) {
        console.error("Password reset email failed:", mailErr);
      }
    }

    return NextResponse.json({
      ok: true,
      message: "If that email has an account, a reset link is on its way.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
