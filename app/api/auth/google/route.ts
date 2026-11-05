import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;

const REDIRECT_URI = "https://themallofprojects.com/api/auth/google/callback";

export async function GET(request: NextRequest) {
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: "Google OAuth not configured" }, { status: 500 });
  }

  // CSRF protection: generate state token
  const csrfToken = crypto.randomBytes(32).toString("hex");

  // Read founders code from query param (set by signup page)
  const foundersCode = request.nextUrl.searchParams.get("founders_code") || "";

  // Encode CSRF + optional founders code into state: "csrf" or "csrf:MALL-XXXX-XXXX"
  const state = foundersCode ? `${csrfToken}:${foundersCode}` : csrfToken;

  const response = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  })}`);

  // Store ONLY the CSRF token in the cookie (for verification on callback)
  response.cookies.set("google_oauth_state", csrfToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return response;
}
