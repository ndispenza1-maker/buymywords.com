import { createHash } from "crypto";

/**
 * Pure rules for Letty's Challenge. No database, no network, no Next runtime —
 * this file is what the test script exercises.
 */

export const LETTY_USER_ID = "11111111-1111-1111-1111-111111111111";
export const LETTY_DISPLAY_NAME = "Letty";
export const LETTY_EMAIL = "letty@themallofprojects.com";
export const LETTY_AVATAR = "/letty-avatar.svg";

export const LETTY_PRICE_CENTS = 199;
export const MAX_IDEA_CHARS = 1000;
export const FREE_WINDOW_MS = 24 * 60 * 60 * 1000;
export const FREE_PER_IP_MAX = 3;

export type ChallengeResult = "held" | "conceded";

export interface Identity {
  key: string;
  userId: string | null;
  visitorId: string | null;
}

/** A visitor id must look like a UUID-ish token: 8-64 chars, url-safe. */
export function normalizeVisitorId(raw: string | null | undefined): string | null {
  const vid = (raw || "").trim();
  return /^[A-Za-z0-9_-]{8,64}$/.test(vid) ? vid : null;
}

export function resolveIdentity(userId: string | null, visitorId: string | null): Identity {
  if (userId) return { key: `user:${userId}`, userId, visitorId: null };
  const vid = normalizeVisitorId(visitorId);
  if (!vid) return { key: "visitor:anon", userId: null, visitorId: null };
  return { key: `visitor:${vid}`, userId: null, visitorId: vid };
}

export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  return createHash("sha256").update(`letty:${ip}`).digest("hex").slice(0, 32);
}

export function msUntilFree(nextFreeAt: string | null, nowMs: number): number {
  if (!nextFreeAt) return 0;
  const at = new Date(nextFreeAt).getTime();
  if (Number.isNaN(at)) return 0;
  return at > nowMs ? at - nowMs : 0;
}

/** Letty ends every reply with one marker line. Strip it, read it, default to held. */
export function splitResultMarker(text: string): { reply: string; result: ChallengeResult } {
  const match = text.match(/\[\[(HELD|CONCEDED)\]\]/i);
  const result: ChallengeResult =
    match && match[1].toUpperCase() === "CONCEDED" ? "conceded" : "held";
  const reply = sanitizeReply(text.replace(/\[\[(HELD|CONCEDED)\]\]/gi, ""));
  return { reply, result };
}

/** The feed is plain text. Strip the markdown she reaches for anyway. */
export function sanitizeReply(text: string): string {
  return text
    .replace(/^\s*[-*_]{3,}\s*$/gm, "")          // horizontal rules
    .replace(/^\s*#{1,6}\s*/gm, "")              // heading marks
    .replace(/\*\*([^*]+)\*\*/g, "$1")           // bold
    .replace(/__([^_]+)__/g, "$1")                  // bold alt
    .replace(/(^|\s)\*([^*\n]+)\*(?=\s|$)/g, "$1$2") // italics
    .replace(/`([^`]+)`/g, "$1")                    // inline code
    .replace(/\n{3,}/g, "\n\n")                    // runaway blank lines
    .trim();
}

const POST_LIMIT = 2000;

export function formatChallengePost(idea: string, reply: string, result: ChallengeResult): string {
  const verdict =
    result === "conceded"
      ? "CONCEDED. The framework met its edge."
      : "HELD. Love, Fear, and Hunger still cover it.";
  const body = `CHALLENGE — "${idea.trim()}"\n\n${reply.trim()}\n\n${verdict}`;
  return body.length > POST_LIMIT ? `${body.slice(0, POST_LIMIT - 1)}…` : body;
}

/** Human countdown used by the box and the modal. */
export function countdownLabel(ms: number): string {
  if (ms <= 0) return "now";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}
