import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  "https://buymywords.com",
  "https://www.buymywords.com",
  "https://themallofprojects.com",
  "https://www.themallofprojects.com",
];

// In development, also allow localhost
if (process.env.NODE_ENV !== "production") {
  ALLOWED_ORIGINS.push("http://localhost:3000", "http://localhost:3001");
}

export function middleware(request: NextRequest) {
  // H-5: Origin validation for CSRF protection on state-changing requests
  if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
    const origin = request.headers.get("origin");

    // Allow requests with no Origin header (same-origin form posts, server-side)
    if (origin && !ALLOWED_ORIGINS.includes(origin)) {
      return NextResponse.json(
        { error: "Forbidden — origin not allowed" },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
