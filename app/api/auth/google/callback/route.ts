import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSQL } from "@/lib/db";
import { setAuthCookie } from "@/lib/auth";
import { redeemCode } from "@/lib/founders";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

function getRedirectUri(request: NextRequest) {
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("host") || "themallofprojects.com";
  return `${proto}://${host}/api/auth/google/callback`;
}

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

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // User cancelled or error from Google
  if (error) {
    return NextResponse.redirect(new URL("/signup?error=google_cancelled", request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/signup?error=google_invalid", request.url));
  }

  // Verify CSRF state
  const cookieStore = await cookies();
  const savedState = cookieStore.get("google_oauth_state")?.value;
  cookieStore.set("google_oauth_state", "", { maxAge: 0, path: "/" });

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(new URL("/signup?error=google_state_mismatch", request.url));
  }

  try {
    // Exchange code for tokens
    const redirectUri = getRedirectUri(request);
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
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

    // Check if user exists by google_id
    let rows = await sql`
      SELECT id FROM users WHERE google_id = ${googleUser.sub} LIMIT 1
    `;

    if (rows.length > 0) {
      // Existing Google user — log them in
      await setAuthCookie(rows[0].id as string);
      return NextResponse.redirect(new URL("/feed", request.url));
    }

    // Check if email already exists (email/password account)
    rows = await sql`
      SELECT id, auth_provider FROM users WHERE email = ${googleUser.email} LIMIT 1
    `;

    if (rows.length > 0) {
      // Link Google to existing email account
      await sql`
        UPDATE users
        SET google_id = ${googleUser.sub},
            auth_provider = CASE WHEN auth_provider = 'email' THEN 'email' ELSE auth_provider END
        WHERE id = ${rows[0].id}
      `;
      await setAuthCookie(rows[0].id as string);
      return NextResponse.redirect(new URL("/feed", request.url));
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
    await setAuthCookie(newUserId);

    // Check for founders code in cookie (set before Google redirect)
    const foundersCode = cookieStore.get("founders_code")?.value;
    if (foundersCode) {
      cookieStore.set("founders_code", "", { maxAge: 0, path: "/" });
      const foundersResult = await redeemCode(foundersCode, newUserId);
      if (foundersResult.ok) {
        return NextResponse.redirect(new URL("/build-profile", request.url));
      }
    }

    return NextResponse.redirect(new URL("/feed", request.url));

  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(new URL("/signup?error=google_server_error", request.url));
  }
}
