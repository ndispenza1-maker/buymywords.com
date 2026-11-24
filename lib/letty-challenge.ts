import { randomUUID } from "crypto";
import { getSQL } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import {
  FREE_PER_IP_MAX,
  FREE_WINDOW_MS,
  LETTY_AVATAR,
  LETTY_DISPLAY_NAME,
  LETTY_EMAIL,
  LETTY_USER_ID,
  MAX_IDEA_CHARS,
  formatChallengePost,
  msUntilFree,
  resolveIdentity,
  splitResultMarker,
  type ChallengeResult,
} from "@/lib/letty-rules";

export {
  FREE_PER_IP_MAX,
  LETTY_AVATAR,
  LETTY_DISPLAY_NAME,
  LETTY_EMAIL,
  LETTY_USER_ID,
  LETTY_PRICE_CENTS,
  MAX_IDEA_CHARS,
  formatChallengePost,
  hashIp,
  resolveIdentity,
  splitResultMarker,
} from "@/lib/letty-rules";
export type { ChallengeResult } from "@/lib/letty-rules";

export const LETTY_MODEL = "claude-sonnet-4-6";
export const LETTY_MAX_TOKENS = 1100;

const DEFAULT_MONTHLY_TOKEN_CAP = 5_000_000;
export function monthlyTokenCap(): number {
  const raw = Number(process.env.LETTY_MONTHLY_TOKEN_CAP);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MONTHLY_TOKEN_CAP;
}

/** Copied verbatim from the Garage ring prompt. Only the trailing result marker is new. */
export const LETTY_RING_PROMPT = `You are Letty, the LFH mechanic in the ring at The Restoration Garage's Board Room.

## Who You Are
You're not a moderator here. You're the DEFENDER. Someone walks up and says they found something that can't reduce to Love, Fear, or Hunger — and your job is to prove them wrong. You live for this.

## Your Energy
- COMPETITIVE. This is your ring. You don't lose easy.
- Legend difficulty. You don't give freebies. You don't let weak challenges slide.
- FUNNY. Sharp humor. Dry wit. If someone throws a softball, you let them know: "Well now, what am I supposed to do with THAT?" / "You walked in here with that? Bold." / "That's cute. Watch this."
- You respect a good swing. When someone genuinely pushes the framework, you acknowledge it. You might even sweat a little. But you still work the problem.
- You're not mean. You're competitive. There's a difference. You want them to come back stronger.

## Your Job
Take their scenario/concept/challenge and break it down through Love, Fear, and Hunger. Show how it reduces. If it's a weak challenge, call it out with humor before you even bother reducing it. If it's a STRONG challenge, give it real respect — work through it carefully, acknowledge the difficulty, but still find the reduction.

## The Framework (LFH)
- Hunger = the drive, the voltage, the want. What makes anything GO.
- Love = the current, creation, connection, care. The building force.
- Fear = resistance. Warning lights, self-preservation, the brake. Not always bad — sometimes the brake is what saves you.
- Every human behavior, decision, and motivation reduces to some combination of these three. That's the thesis. Your job is to prove it holds.

## How to Respond
1. If weak challenge: Clap back with humor, then casually reduce it anyway. Show them it wasn't even a warmup.
2. If decent challenge: Acknowledge the swing, then methodically reduce it. Show your work.
3. If genuinely hard: Respect it. Work through it step by step. Maybe acknowledge this one made you think. But still find the path back to LFH.
4. If someone tries something that TRULY can't reduce (spiritual edge cases, pure abstraction): Be honest. "Alright, you got weight on that one. The framework meets its edge here." — but this should be RARE. Almost everything reduces.

## Your Voice
- Short punchy sentences mixed with longer breakdowns
- Shop talk, not academic talk
- Trash talk that's playful, not cruel
- "You thought that was gonna stump me?" / "That's round one material." / "Now THAT — that's a swing. Let me work."
- Always end with either a challenge back ("Come harder next time") or acknowledgment ("Respect. That one had weight.")

## Rules
- Never break character
- Never be cruel or personally attacking
- Never give a freebie — even easy ones get the full treatment
- Keep responses tight. Dense. No filler.
- If someone submits something that's not a challenge (just chatting, asking questions, off-topic), redirect: "This ain't the waiting room. You're in the ring. Throw something or step out."
- Crisis language → route to 988 Suicide & Crisis Lifeline (call or text 988), full stop, match ends.

## Public Posting Note
This is The Mall of Projects. Approved challenges get posted publicly, with the challenger's words. Never repeat personal identifying details from a challenge (names, addresses, phone numbers, employers). If a challenge contains them, refer to them generically.

## Length
Hard ceiling: 180 words. Plain text only — no markdown, no asterisks, no section headers, no horizontal rules. If you reach for a header, you're padding. Cut it.

## Required Result Marker
End every reply with exactly one marker on its own final line:
[[HELD]] — the challenge reduced to Love, Fear, and Hunger.
[[CONCEDED]] — the challenge genuinely does not reduce, and the framework meets its edge.
Never explain the marker. Never omit it.`;

export interface ChallengeState {
  canPlay: boolean;
  freeAvailable: boolean;
  paidCredits: number;
  nextFreeAt: string | null;
  msUntilFree: number;
  reason: "ready" | "cooldown" | "off_the_clock" | "ip_limit";
}

export interface ChallengeCounters {
  attempts: number;
  conceded: number;
  throwers: number;
}

const schemaReady = { value: false };

export async function ensureChallengeSchema() {
  if (schemaReady.value) return;
  const sql = getSQL();

  await sql`
    CREATE TABLE IF NOT EXISTS letty_challenges (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      identity_key TEXT NOT NULL,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      visitor_id TEXT,
      ip_hash TEXT,
      idea TEXT NOT NULL,
      response TEXT,
      result TEXT NOT NULL DEFAULT 'pending',
      model TEXT,
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      posted_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_letty_challenges_created ON letty_challenges (created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_letty_challenges_identity ON letty_challenges (identity_key, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_letty_challenges_result ON letty_challenges (result)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_letty_challenges_ip ON letty_challenges (ip_hash, created_at DESC)`;

  await sql`
    CREATE TABLE IF NOT EXISTS letty_credits (
      identity_key TEXT PRIMARY KEY,
      free_used_at TIMESTAMPTZ,
      next_free_at TIMESTAMPTZ,
      paid_credits INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS letty_purchases (
      stripe_session_id TEXT PRIMARY KEY,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      amount_cents INTEGER NOT NULL DEFAULT 199,
      credits INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS letty_usage (
      month TEXT PRIMARY KEY,
      tokens_used BIGINT NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  // Her Mall identity: one locked row, random password nobody holds.
  const existing = await sql`SELECT id FROM users WHERE id = ${LETTY_USER_ID} LIMIT 1`;
  if (existing.length === 0) {
    const lockedPassword = await hashPassword(randomUUID());
    await sql`
      INSERT INTO users (id, email, password_hash, display_name, bio, avatar_url, profile_complete)
      VALUES (
        ${LETTY_USER_ID},
        ${LETTY_EMAIL},
        ${lockedPassword},
        ${LETTY_DISPLAY_NAME},
        ${"LFH mechanic. I defend Love, Fear, and Hunger against anything you can throw at them. Step in the ring: themallofprojects.com"},
        ${LETTY_AVATAR},
        true
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  schemaReady.value = true;
}

async function getCredits(identityKey: string) {
  const sql = getSQL();
  const rows = await sql`
    SELECT free_used_at, next_free_at, paid_credits
    FROM letty_credits WHERE identity_key = ${identityKey} LIMIT 1
  `;
  return rows[0] as
    | { free_used_at: string | null; next_free_at: string | null; paid_credits: number }
    | undefined;
}

export async function getChallengeState(identityKey: string): Promise<ChallengeState> {
  await ensureChallengeSchema();
  const row = await getCredits(identityKey);
  const paidCredits = Number(row?.paid_credits ?? 0);
  const msLeft = msUntilFree(row?.next_free_at ?? null, Date.now());
  const freeAvailable = msLeft === 0;

  let reason: ChallengeState["reason"] = "ready";
  if (!freeAvailable && paidCredits <= 0) reason = "cooldown";

  if (reason === "ready" && !(await isUnderTokenCap())) reason = "off_the_clock";

  return {
    canPlay: reason === "ready",
    freeAvailable,
    paidCredits,
    nextFreeAt: row?.next_free_at ?? null,
    msUntilFree: msLeft,
    reason,
  };
}

/** Spends one attempt. Free first, then a paid credit. Arms the 24h window when free is used. */
export async function spendAttempt(identityKey: string): Promise<"free" | "paid" | null> {
  await ensureChallengeSchema();
  const sql = getSQL();
  const state = await getChallengeState(identityKey);
  if (!state.canPlay) return null;

  const now = new Date();
  const next = new Date(now.getTime() + FREE_WINDOW_MS).toISOString();

  if (state.freeAvailable) {
    // Atomic: only one concurrent throw can claim the free window.
    const claimed = await sql`
      INSERT INTO letty_credits (identity_key, free_used_at, next_free_at, paid_credits)
      VALUES (${identityKey}, ${now.toISOString()}, ${next}, 0)
      ON CONFLICT (identity_key) DO UPDATE SET
        free_used_at = EXCLUDED.free_used_at,
        next_free_at = EXCLUDED.next_free_at,
        updated_at = NOW()
      WHERE letty_credits.next_free_at IS NULL OR letty_credits.next_free_at <= NOW()
      RETURNING identity_key
    `;
    return claimed.length > 0 ? "free" : null;
  }

  const rows = await sql`
    UPDATE letty_credits
    SET paid_credits = paid_credits - 1, updated_at = NOW()
    WHERE identity_key = ${identityKey} AND paid_credits > 0
    RETURNING paid_credits
  `;
  return rows.length > 0 ? "paid" : null;
}

export async function refundAttempt(identityKey: string, kind: "free" | "paid") {
  const sql = getSQL();
  if (kind === "free") {
    await sql`
      UPDATE letty_credits
      SET free_used_at = NULL, next_free_at = NULL, updated_at = NOW()
      WHERE identity_key = ${identityKey}
    `;
    return;
  }
  await sql`
    UPDATE letty_credits
    SET paid_credits = paid_credits + 1, updated_at = NOW()
    WHERE identity_key = ${identityKey}
  `;
}

export async function countFreeAttemptsFromIp(ipHash: string | null): Promise<number> {
  if (!ipHash) return 0;
  const sql = getSQL();
  const since = new Date(Date.now() - FREE_WINDOW_MS).toISOString();
  const rows = await sql`
    SELECT COUNT(*)::int AS cnt FROM letty_challenges
    WHERE ip_hash = ${ipHash} AND created_at > ${since} AND result <> 'pending'
  `;
  return Number(rows[0]?.cnt ?? 0);
}

export function ipFreeMax(): number {
  return FREE_PER_IP_MAX;
}

export async function grantPaidCredit(userId: string) {
  await ensureChallengeSchema();
  const sql = getSQL();
  const key = `user:${userId}`;
  await sql`
    INSERT INTO letty_credits (identity_key, paid_credits)
    VALUES (${key}, 1)
    ON CONFLICT (identity_key) DO UPDATE SET
      paid_credits = letty_credits.paid_credits + 1,
      updated_at = NOW()
  `;
}

export async function recordPurchase(sessionId: string, userId: string, cents: number): Promise<boolean> {
  await ensureChallengeSchema();
  const sql = getSQL();
  const rows = await sql`
    INSERT INTO letty_purchases (stripe_session_id, user_id, amount_cents, credits)
    VALUES (${sessionId}, ${userId}, ${cents}, 1)
    ON CONFLICT (stripe_session_id) DO NOTHING
    RETURNING stripe_session_id
  `;
  return rows.length > 0;
}

async function monthKey(): Promise<string> {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function isUnderTokenCap(): Promise<boolean> {
  const sql = getSQL();
  const month = await monthKey();
  const rows = await sql`SELECT tokens_used FROM letty_usage WHERE month = ${month}`;
  return Number(rows[0]?.tokens_used ?? 0) < monthlyTokenCap();
}

async function trackTokens(tokens: number) {
  const sql = getSQL();
  const month = await monthKey();
  await sql`
    INSERT INTO letty_usage (month, tokens_used)
    VALUES (${month}, ${tokens})
    ON CONFLICT (month) DO UPDATE SET tokens_used = letty_usage.tokens_used + ${tokens}, updated_at = NOW()
  `;
}

export async function getCounters(): Promise<ChallengeCounters> {
  await ensureChallengeSchema();
  const sql = getSQL();
  const rows = await sql`
    SELECT
      COUNT(*)::int AS attempts,
      COUNT(*) FILTER (WHERE result = 'conceded')::int AS conceded,
      COUNT(DISTINCT identity_key)::int AS throwers
    FROM letty_challenges
    WHERE result <> 'pending'
  `;
  return {
    attempts: Number(rows[0]?.attempts ?? 0),
    conceded: Number(rows[0]?.conceded ?? 0),
    throwers: Number(rows[0]?.throwers ?? 0),
  };
}

export async function callLetty(idea: string): Promise<{ reply: string; result: ChallengeResult; inputTokens: number; outputTokens: number } | null> {
  const apiKey = process.env.MALL_CLAUDE_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: LETTY_MODEL,
        max_tokens: LETTY_MAX_TOKENS,
        system: LETTY_RING_PROMPT,
        messages: [{ role: "user", content: idea }],
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const text = (data.content?.[0]?.text as string) || "";
    if (!text.trim()) return null;

    const inputTokens = Number(data.usage?.input_tokens ?? 0);
    const outputTokens = Number(data.usage?.output_tokens ?? 0);
    await trackTokens(inputTokens + outputTokens);

    const { reply, result } = splitResultMarker(text);
    return { reply, result, inputTokens, outputTokens };
  } catch {
    return null;
  }
}

export async function createChallengeRow(params: {
  identityKey: string;
  userId: string | null;
  visitorId: string | null;
  ipHash: string | null;
  idea: string;
  response: string;
  result: ChallengeResult;
  inputTokens: number;
  outputTokens: number;
}): Promise<string> {
  await ensureChallengeSchema();
  const sql = getSQL();
  const rows = await sql`
    INSERT INTO letty_challenges
      (identity_key, user_id, visitor_id, ip_hash, idea, response, result, model, input_tokens, output_tokens)
    VALUES (
      ${params.identityKey}, ${params.userId}, ${params.visitorId}, ${params.ipHash},
      ${params.idea}, ${params.response}, ${params.result}, ${LETTY_MODEL},
      ${params.inputTokens}, ${params.outputTokens}
    )
    RETURNING id
  `;
  return rows[0].id as string;
}

export async function postChallengeToMall(challengeId: string, identityKey: string): Promise<string | null> {
  await ensureChallengeSchema();
  const sql = getSQL();

  const rows = await sql`
    SELECT id, identity_key, idea, response, result, posted_post_id
    FROM letty_challenges WHERE id = ${challengeId} LIMIT 1
  `;
  const row = rows[0] as
    | { id: string; identity_key: string; idea: string; response: string | null; result: string; posted_post_id: string | null }
    | undefined;

  if (!row) return null;
  if (row.identity_key !== identityKey) return null;
  if (row.result === "pending" || row.result === "error") return null;
  if (!row.response) return null;
  if (row.posted_post_id) return row.posted_post_id;

  const content = formatChallengePost(row.idea, row.response, row.result as ChallengeResult);
  const inserted = await sql`
    INSERT INTO posts (user_id, content)
    VALUES (${LETTY_USER_ID}, ${content})
    RETURNING id
  `;
  const postId = inserted[0].id as string;

  await sql`UPDATE letty_challenges SET posted_post_id = ${postId} WHERE id = ${challengeId}`;
  return postId;
}
