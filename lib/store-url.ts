/**
 * Validation for "Connect Existing" project URLs.
 *
 * Used by the founders onboarding route, the paid store creation route, and
 * the store update route so all three enforce identical rules. A connected
 * store is rendered as an iframe/link, so only plain https origins are safe.
 */

export type ExternalUrlResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

const MAX_URL_LENGTH = 2048;

const MISSING = "Paste your project URL";
const NOT_FULL = "That doesn't look like a full URL. Include https:// at the start.";
const NOT_HTTPS = "Store links must start with https://";
const TOO_LONG = "That URL is too long.";

export function parseExternalUrl(value: unknown): ExternalUrlResult {
  if (typeof value !== "string") return { ok: false, error: MISSING };

  const trimmed = value.trim();
  if (!trimmed) return { ok: false, error: MISSING };
  if (trimmed.length > MAX_URL_LENGTH) return { ok: false, error: TOO_LONG };

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: NOT_FULL };
  }

  if (parsed.protocol !== "https:") return { ok: false, error: NOT_HTTPS };
  if (parsed.username || parsed.password) return { ok: false, error: NOT_HTTPS };
  if (!parsed.hostname) return { ok: false, error: NOT_FULL };

  return { ok: true, url: parsed.toString() };
}
