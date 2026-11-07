import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSQL } from "@/lib/db";
import { createToken } from "@/lib/auth";
import { redeemCode } from "@/lib/founders";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

const REDIRECT_URI = "https://themallofprojects.com/api/auth/google/callback";

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
}

interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}

/**
 * Return an HTML page that sets the auth cookie and navigates to the destination.
 * This avoids the unreliable Set-Cookie-on-redirect behavior in Next.js/Vercel.
 */
function authAndNavigate(userId: string, destination: string): NextResponse {
  const token = createToken(userId);
  const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="1;url=${destination}">
<style>body{display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#1a1412;color:#e8ddd3;font-family:system-ui;}</style>
</head><body><p>Signing you in…</p>
<script>window.location.replace("${destination}");</script>
</body></html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Set-Cookie": `auth_token=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`,
    },
  });
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // User cancelled or error from Google
  if (error) {
    return NextResponse.redirect(new URL("/signup?error=google_cancelled", request.url));
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(new URL("/signup?error=google_invalid", request.url));
  }

  // Parse state: "csrfToken" or "csrfToken:foundersCode"
  const stateParts = stateParam.split(":");
  const csrfState = stateParts[0];
  const foundersCodeFromState = stateParts.length > 1 ? stateParts.slice(1).join(":") : null;

  // Verify CSRF state
  const cookieStore = await cookies();
  const savedState = cookieStore.get("google_oauth_state")?.value;

  if (!savedState || savedState !== csrfState) {
    return NextResponse.redirect(new URL("/signup?error=google_state_mismatch", request.url));
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      console.error("Google token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(new URL("/signup?error=google_token_failed", request.url));
    }

    const tokens: GoogleTokenResponse = await tokenRes.json();

    // Get user info
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoRes.ok) {
      console.error("Google userinfo failed:", await userInfoRes.text());
      return NextResponse.redirect(new URL("/signup?error=google_userinfo_failed", request.url));
    }

    const googleUser: GoogleUserInfo = await userInfoRes.json();

    if (!googleUser.email || !googleUser.email_verified) {
      return NextResponse.redirect(new URL("/signup?error=google_email_unverified", request.url));
    }

    const sql = getSQL();

    // Helper: try to redeem founders code for any user (new or existing)
    // Wrapped in try/catch so a redemption failure never kills the OAuth flow
    async function tryRedeemFounders(userId: string): Promise<string> {
      if (!foundersCodeFromState) return "/";
      try {
        // Check if user already has active subscription
        const userCheck = await sql`
          SELECT subscription_status FROM users WHERE id = ${userId} LIMIT 1
        `;
        if (userCheck.length > 0 && userCheck[0].subscription_status === 'active') {
          return "/"; // Already has access, skip
        }
        const foundersResult = await redeemCode(foundersCodeFromState, userId);
        if (foundersResult.ok) {
          return "/build-profile";
        }
        console.error("Founders redemption failed:", foundersResult.error);
        return "/";
      } catch (err) {
        console.error("Founders redemption exception:", err);
        return "/"; // Still log them in — don't blow up the whole OAuth
      }
    }

    // Check if user exists by google_id — log them in
    let rows = await sql`
      SELECT id FROM users WHERE google_id = ${googleUser.sub} LIMIT 1
    `;
    if (rows.length > 0) {
      const dest = await tryRedeemFounders(rows[0].id as string);
      return authAndNavigate(rows[0].id as string, dest);
    }

    // Check if email already exists (email/password account) — link Google
    rows = await sql`
      SELECT id, auth_provider FROM users WHERE email = ${googleUser.email} LIMIT 1
    `;
    if (rows.length > 0) {
      await sql`
        UPDATE users
        SET google_id = ${googleUser.sub},
            auth_provider = CASE WHEN auth_provider = 'email' THEN 'email' ELSE auth_provider END
        WHERE id = ${rows[0].id}
      `;
      const dest = await tryRedeemFounders(rows[0].id as string);
      return authAndNavigate(rows[0].id as string, dest);
    }

    // New user — create account
    const newRows = await sql`
      INSERT INTO users (email, display_name, avatar_url, google_id, auth_provider, password_hash)
      VALUES (
        ${googleUser.email},
        ${googleUser.name || googleUser.email.split("@")[0]},
        ${googleUser.picture || null},
        ${googleUser.sub},
        'google',
        NULL
      )
      RETURNING id
    `;

    const newUserId = newRows[0].id as string;
    const destination = await tryRedeemFounders(newUserId);

    return authAndNavigate(newUserId, destination);

  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(new URL("/signup?error=google_server_error", request.url));
  }
}
