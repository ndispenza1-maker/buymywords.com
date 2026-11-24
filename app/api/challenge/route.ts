import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { checkUserAgent, isRateLimited } from "@/lib/security";
import {
  MAX_IDEA_CHARS,
  MAX_SESSION_TURNS,
  appendTurn,
  callLetty,
  countFreeAttemptsFromIp,
  createChallengeRow,
  getChallengeRow,
  getChallengeState,
  getCounters,
  hashIp,
  ipFreeMax,
  refundAttempt,
  resolveIdentity,
  spendAttempt,
} from "@/lib/letty-challenge";
import type { ThreadItem } from "@/lib/letty-rules";

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
    maxTurns: MAX_SESSION_TURNS,
  });
}

export async function POST(request: NextRequest) {
  const uaBlock = checkUserAgent(request);
  if (uaBlock) return NextResponse.json({ error: uaBlock }, { status: 403 });

  const user = await getAuthUser();
  const body = await request.json().catch(() => ({}));
  const idea = typeof body.idea === "string" ? body.idea.trim() : "";
  const challengeId = typeof body.challenge_id === "string" ? body.challenge_id : "";
  const identity = resolveIdentity(user?.id ?? null, typeof body.visitor_id === "string" ? body.visitor_id : null);

  if (idea.length < 3) {
    return NextResponse.json({ error: "Give me something to swing at." }, { status: 400 });
  }
  if (idea.length > MAX_IDEA_CHARS) {
    return NextResponse.json({ error: `Keep it under ${MAX_IDEA_CHARS} characters.` }, { status: 400 });
  }

  if (isRateLimited(`letty:${identity.key}`, 8, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Slow down. Letty needs a minute." }, { status: 429 });
  }

  // Continuation of an open session: no new credit, thread comes from the row.
  const existing = challengeId ? await getChallengeRow(challengeId, identity.key) : null;
  if (challengeId && !existing) {
    return NextResponse.json({ error: "That session is gone." }, { status: 404 });
  }
  if (existing && (existing.turns >= MAX_SESSION_TURNS || existing.posted_post_id)) {
    return NextResponse.json(
      {
        error: "Session closed. Post it or start a new challenge.",
        sessionOver: true,
        challenge: existing,
        state: await getChallengeState(identity.key),
      },
      { status: 409 }
    );
  }

  let spent: "free" | "paid" | null = null;

  if (!existing) {
    const state = await getChallengeState(identity.key);
    if (!state.canPlay) {
      return NextResponse.json({ error: "Challenge unavailable", state }, { status: 429 });
    }

    const ipHash = hashIp(clientIp(request));

    // Soft device wall: anonymous throwers get a few per IP per day even if they clear cookies.
    if (!user && ipHash) {
      const used = await countFreeAttemptsFromIp(ipHash);
      if (used >= ipFreeMax()) {
        return NextResponse.json(
          {
            error: "That device has hit today's limit. Log in to buy another try.",
            state: { ...state, canPlay: false, reason: "ip_limit" },
          },
          { status: 429 }
        );
      }
    }

    spent = await spendAttempt(identity.key);
    if (!spent) {
      return NextResponse.json(
        { error: "No attempt available", state: await getChallengeState(identity.key) },
        { status: 429 }
      );
    }
  }

  const prior: ThreadItem[] = existing?.thread ?? [];
  const answer = await callLetty(idea, prior);

  if (!answer) {
    if (spent) await refundAttempt(identity.key, spent);
    return NextResponse.json(
      { error: "Letty's not answering right now. That one's on the house — try again." },
      { status: 503 }
    );
  }

  const thread: ThreadItem[] = [
    ...prior,
    { role: "user", text: idea },
    { role: "letty", text: answer.reply },
  ];

  let id = existing?.id ?? "";
  let turns = 1;

  if (existing) {
    turns = await appendTurn({
      id: existing.id,
      thread,
      reply: answer.reply,
      result: answer.result,
      inputTokens: answer.inputTokens,
      outputTokens: answer.outputTokens,
    });
  } else {
    id = await createChallengeRow({
      identityKey: identity.key,
      userId: identity.userId,
      visitorId: identity.visitorId,
      ipHash: hashIp(clientIp(request)),
      idea,
      response: answer.reply,
      result: answer.result,
      inputTokens: answer.inputTokens,
      outputTokens: answer.outputTokens,
      thread,
      turns: 1,
    });
  }

  const [nextState, counters] = await Promise.all([getChallengeState(identity.key), getCounters()]);

  return NextResponse.json({
    challenge: { id, idea, reply: answer.reply, result: answer.result, turns, thread },
    sessionOver: turns >= MAX_SESSION_TURNS,
    maxTurns: MAX_SESSION_TURNS,
    state: nextState,
    counters,
    signedIn: Boolean(user),
  });
}
