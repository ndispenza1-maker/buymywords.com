import crypto from "crypto";
import { getSQL } from "./db";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

/**
 * Create a single-use reset token for a user.
 * Any outstanding unused tokens for that user are invalidated first.
 * Returns the raw token — only ever send this by email, never store it.
 */
export async function createResetToken(userId: string): Promise<string> {
  const sql = getSQL();
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

  await sql`
    UPDATE password_reset_tokens SET used_at = now()
    WHERE user_id = ${userId} AND used_at IS NULL
  `;

  await sql`
    INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
    VALUES (${userId}, ${tokenHash}, ${expiresAt})
  `;

  return token;
}

/**
 * Validate and burn a reset token.
 * Returns the owning user id, or null if invalid, expired, or already used.
 */
export async function consumeResetToken(token: string): Promise<string | null> {
  if (!token || token.length < 32) return null;

  const sql = getSQL();
  const tokenHash = hashToken(token);

  const rows = await sql`
    SELECT id, user_id, expires_at, used_at
    FROM password_reset_tokens
    WHERE token_hash = ${tokenHash}
    LIMIT 1
  `;

  if (!rows[0]) return null;

  const row = rows[0];
  if (row.used_at) return null;
  if (new Date(row.expires_at as string).getTime() < Date.now()) return null;

  const burned = await sql`
    UPDATE password_reset_tokens SET used_at = now()
    WHERE id = ${row.id} AND used_at IS NULL
    RETURNING user_id
  `;

  return burned[0] ? (burned[0].user_id as string) : null;
}
