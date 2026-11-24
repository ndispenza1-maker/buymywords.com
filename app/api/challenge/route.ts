import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { checkUserAgent, isRateLimited } from "@/lib/security";
import {
  MAX_IDEA_CHARS,
  callLetty,
  countFreeAttemptsFromIp,
  createChallengeRow,
  getChallengeState,
  getCounters,
  hashIp,
  ipFreeMax,
  refundAttempt,
  resolveIdentity,
  spendAttempt,
} from "@/lib/letty-challenge";

export const runtime = "nodejs";

function clientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  const url = new URL(request.url);
  const identity = resolveIdentity(user?.id ?? null, url.searchParams.get("vid"));

  const [state, counters] = await Promise.all([getChallengeState(identity.key), getCounters()]);

  return NextResponse.json({
    state,
    counters,
    priceCents: 199,
    signedIn: Boolean(user),
  });
}

export async function POST(request: NextRequest) {
  const uaBlock = checkUserAgent(request);
  if (uaBlock) return NextResponse.json({ error: uaBlock }, { status: 403 });

  const user = await getAuthUser();
  const body = await request.json().catch(() => ({}));
  const idea = typeof body.idea === "string" ? body.idea.trim() : "";
  const identity = resolveIdentity(user?.id ?? null, typeof body.visitor_id === "string" ? body.visitor_id : null);

  if (idea.length < 3) {
    return NextResponse.json({ error: "Give me something to swing at." }, { status: 400 });
  }
  if (idea.length > MAX_IDEA_CHARS) {
    return NextResponse.json({ error: `Keep it under ${MAX_IDEA_CHARS} characters.` }, { status: 400 });
  }

  if (isRateLimited(`letty:${identity.key}`, 6, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Slow down. Letty needs a minute." }, { status: 429 });
  }

  const state = await getChallengeState(identity.key);
  if (!state.canPlay) {
    return NextResponse.json(
      { error: "Challenge unavailable", state },
      { status: 429 }
    );
  }

  const ipHash = hashIp(clientIp(request));

  // Soft device wall: anonymous throwers get a few per IP per day even if they clear cookies.
  if (!user && ipHash) {
    const used = await countFreeAttemptsFromIp(ipHash);
    if (used >= ipFreeMax()) {
      return NextResponse.json(
        { error: "That device has hit today's limit. Log in to buy another try.", state: { ...state, canPlay: false, reason: "ip_limit" } },
        { status: 429 }
      );
    }
  }

  const spent = await spendAttempt(identity.key);
  if (!spent) {
    return NextResponse.json({ error: "No attempt available", state: await getChallengeState(identity.key) }, { status: 429 });
  }

  const answer = await callLetty(idea);
  if (!answer) {
    await refundAttempt(identity.key, spent);
    return NextResponse.json(
      { error: "Letty's not answering right now. That one's on the house — try again." },
      { status: 503 }
    );
  }

  const id = await createChallengeRow({
    identityKey: identity.key,
    userId: identity.userId,
    visitorId: identity.visitorId,
    ipHash,
    idea,
    response: answer.reply,
    result: answer.result,
    inputTokens: answer.inputTokens,
    outputTokens: answer.outputTokens,
  });

  const [nextState, counters] = await Promise.all([getChallengeState(identity.key), getCounters()]);

  return NextResponse.json({
    challenge: { id, idea, reply: answer.reply, result: answer.result },
    state: nextState,
    counters,
    signedIn: Boolean(user),
  });
}
