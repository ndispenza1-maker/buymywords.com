import crypto from "crypto";
import { getSQL } from "@/lib/db";

/**
 * Hash a founders code using SHA-256.
 * Codes are high-entropy random values so SHA-256 is secure
 * (no dictionary/rainbow table risk like passwords).
 */
export function hashCode(code: string): string {
  const normalized = code.trim().toUpperCase();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Generate a random founders code in MALL-XXXX-XXXX format.
 * ~2.8 billion combinations — unguessable with rate limiting.
 */
export function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 confusion
  const segment = (len: number) => {
    const bytes = crypto.randomBytes(len);
    return Array.from(bytes)
      .map((b) => chars[b % chars.length])
      .join("");
  };
  return `MALL-${segment(4)}-${segment(4)}`;
}

interface RedeemResult {
  ok: boolean;
  error?: string;
  tier?: string;
  expiresAt?: Date;
}

/**
 * Validate and redeem a founders code for a user.
 * Returns the tier and expiration date on success.
 */
export async function redeemCode(
  code: string,
  userId: string
): Promise<RedeemResult> {
  const sql = getSQL();
  const hash = hashCode(code);

  // Look up code by hash
  const codes = await sql`
    SELECT id, tier, max_uses, uses_count, duration_days, code_expires_at, active
    FROM founders_codes WHERE code_hash = ${hash} LIMIT 1
  `;

  if (codes.length === 0) {
    return { ok: false, error: "Invalid founders code" };
  }

  const fc = codes[0];

  if (!fc.active) {
    return { ok: false, error: "This code has been deactivated" };
  }

  // Check if code itself has expired
  if (fc.code_expires_at && new Date(fc.code_expires_at as string) < new Date()) {
    return { ok: false, error: "This code has expired" };
  }

  // Check max uses
  if ((fc.uses_count as number) >= (fc.max_uses as number)) {
    return { ok: false, error: "This code has already been used" };
  }

  // Check if user already redeemed any code
  const existing = await sql`
    SELECT id FROM founders_redemptions WHERE user_id = ${userId} LIMIT 1
  `;
  if (existing.length > 0) {
    return { ok: false, error: "You've already redeemed a founders code" };
  }

  // Redeem it
  const durationDays = fc.duration_days as number;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  // Increment uses
  await sql`
    UPDATE founders_codes SET uses_count = uses_count + 1 WHERE id = ${fc.id}
  `;

  // Log redemption
  await sql`
    INSERT INTO founders_redemptions (code_id, user_id, access_expires_at)
    VALUES (${fc.id}, ${userId}, ${expiresAt.toISOString()})
  `;

  // Grant access on user
  await sql`
    UPDATE users
    SET subscription_status = 'active',
        subscription_tier = 'founders',
        founders_expires_at = ${expiresAt.toISOString()}
    WHERE id = ${userId}
  `;

  return { ok: true, tier: fc.tier as string, expiresAt };
}
