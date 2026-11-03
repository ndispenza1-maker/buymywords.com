import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { redeemCode } from "@/lib/founders";
import { isRateLimited } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: max 5 attempts per IP per 15 minutes
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(`founders:${ip}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many attempts. Try again later." },
        { status: 429 }
      );
    }

    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const { code } = await request.json();
    if (!code || typeof code !== "string" || code.trim().length < 5) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const result = await redeemCode(code, user.id);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      tier: result.tier,
      expiresAt: result.expiresAt?.toISOString(),
    });
  } catch (err) {
    console.error("Founders redeem error:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
