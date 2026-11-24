import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { isRateLimited, checkUserAgent } from "@/lib/security";
import { postChallengeToMall, resolveIdentity, getCounters } from "@/lib/letty-challenge";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const uaBlock = checkUserAgent(request);
  if (uaBlock) return NextResponse.json({ error: uaBlock }, { status: 403 });

  const user = await getAuthUser();
  const body = await request.json().catch(() => ({}));
  const challengeId = typeof body.challenge_id === "string" ? body.challenge_id : "";

  if (!challengeId) {
    return NextResponse.json({ error: "Missing challenge" }, { status: 400 });
  }

  const identity = resolveIdentity(user?.id ?? null, typeof body.visitor_id === "string" ? body.visitor_id : null);

  if (isRateLimited(`letty-post:${identity.key}`, 4, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "You've posted plenty. Give the feed room." }, { status: 429 });
  }

  const postId = await postChallengeToMall(challengeId, identity.key);
  if (!postId) {
    return NextResponse.json({ error: "That challenge can't be posted." }, { status: 400 });
  }

  return NextResponse.json({ postId, counters: await getCounters() });
}
