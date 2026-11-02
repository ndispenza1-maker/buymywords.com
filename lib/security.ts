import { NextRequest } from "next/server";
import { getSQL } from "@/lib/db";

// ── Blocked User-Agents (headless browsers, bots, scrapers) ──
const BLOCKED_UA_PATTERNS = [
  /headlesschrome/i,
  /phantomjs/i,
  /selenium/i,
  /puppeteer/i,
  /playwright/i,
  /webdriver/i,
  /bot\b/i,
  /crawl/i,
  /spider/i,
  /scraper/i,
  /curl\//i,
  /wget\//i,
  /python-requests/i,
  /python-urllib/i,
  /node-fetch/i,
  /axios\//i,
  /go-http-client/i,
  /java\//i,
  /libwww/i,
  /httpie/i,
];

// Allow specific good bots if needed later
const ALLOWED_UA_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
];

/**
 * Check if the request comes from a known bot/headless browser.
 * Returns a reason string if blocked, null if ok.
 */
export function checkUserAgent(req: NextRequest): string | null {
  const ua = req.headers.get("user-agent") || "";

  // No user-agent at all = suspicious
  if (!ua || ua.length < 10) {
    return "Missing or invalid User-Agent";
  }

  // Allow known search engine bots (for SEO on public pages)
  for (const pattern of ALLOWED_UA_PATTERNS) {
    if (pattern.test(ua)) return null;
  }

  // Block known automation tools
  for (const pattern of BLOCKED_UA_PATTERNS) {
    if (pattern.test(ua)) {
      return "Automated request detected";
    }
  }

  return null;
}

// ── Rate Limiting (in-memory, resets on deploy) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple sliding-window rate limiter.
 * Returns true if the request should be BLOCKED.
 */
export function isRateLimited(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return true;
  }

  return false;
}

// ── Account Age Gate ──
const MINIMUM_ACCOUNT_AGE_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Check if an account is old enough to post.
 * Returns minutes remaining if too new, null if ok.
 */
export async function checkAccountAge(userId: string): Promise<number | null> {
  const sql = getSQL();
  const rows = await sql`SELECT created_at FROM users WHERE id = ${userId}`;

  if (!rows[0]) return null;

  const created = new Date(rows[0].created_at).getTime();
  const age = Date.now() - created;

  if (age < MINIMUM_ACCOUNT_AGE_MS) {
    return Math.ceil((MINIMUM_ACCOUNT_AGE_MS - age) / 60000);
  }

  return null;
}

// ── Honeypot Validation ──
/**
 * Check if a honeypot field was filled (bots auto-fill hidden fields).
 * Returns true if the request is from a bot.
 */
export function isHoneypotTriggered(body: Record<string, unknown>): boolean {
  // Check for common honeypot field names
  // These fields should NEVER have values — they're hidden from humans
  const honeypotFields = ["website", "url_confirm", "phone_verify"];

  for (const field of honeypotFields) {
    if (body[field] && String(body[field]).trim().length > 0) {
      return true;
    }
  }

  return false;
}
