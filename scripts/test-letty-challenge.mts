/**
 * Tests for lib/letty-rules.ts — the pure logic behind Letty's Challenge.
 * Run: node --experimental-strip-types scripts/test-letty-challenge.mts
 */
import {
  FREE_PER_IP_MAX,
  FREE_WINDOW_MS,
  LETTY_PRICE_CENTS,
  MAX_IDEA_CHARS,
  countdownLabel,
  formatChallengePost,
  hashIp,
  msUntilFree,
  normalizeVisitorId,
  resolveIdentity,
  sanitizeReply,
  splitResultMarker,
} from "../lib/letty-rules.ts";

let pass = 0;
const failures: string[] = [];

function ok(cond: unknown, label: string) {
  if (cond) { pass++; } else { failures.push(label); }
}

function eq(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  ok(a === e, `${label} (got ${a}, want ${e})`);
}

/* ── constants ── */
eq(LETTY_PRICE_CENTS, 199, "price is $1.99");
eq(FREE_WINDOW_MS, 86_400_000, "free window is 24h");
eq(MAX_IDEA_CHARS, 1000, "idea cap is 1000 chars");
eq(FREE_PER_IP_MAX, 3, "three free throws per IP per day");

/* ── result marker ── */
eq(splitResultMarker("Nice try.\n[[HELD]]"), { reply: "Nice try.", result: "held" }, "held marker parsed");
eq(splitResultMarker("You got me.\n[[CONCEDED]]"), { reply: "You got me.", result: "conceded" }, "conceded parsed");
eq(splitResultMarker("inline [[CONCEDED]] trailing"), { reply: "inline  trailing", result: "conceded" }, "inline marker stripped");
eq(splitResultMarker("no marker at all").result, "held", "missing marker defaults to held");
eq(splitResultMarker("lower [[conceded]]").result, "conceded", "marker is case-insensitive");
eq(splitResultMarker("[[HELD]]").reply, "", "marker-only reply leaves empty text");
eq(splitResultMarker("").result, "held", "empty text defaults to held");

/* ── identity ── */
eq(resolveIdentity("abc-123", "visitorvisitor").key, "user:abc-123", "signed-in user keys off account");
eq(resolveIdentity("abc-123", null).key, "user:abc-123", "user without visitor id still keys off account");
eq(resolveIdentity(null, "abcdefgh").key, "visitor:abcdefgh", "visitor key preserved");
eq(resolveIdentity(null, "abcdefgh").visitorId, "abcdefgh", "visitor id returned");
eq(resolveIdentity(null, null).key, "visitor:anon", "no visitor id falls back to anon");
eq(resolveIdentity(null, "").key, "visitor:anon", "empty visitor id falls back to anon");
eq(resolveIdentity(null, "abc").key, "visitor:anon", "too-short visitor id rejected");
eq(resolveIdentity(null, "has spaces here").key, "visitor:anon", "spaces rejected");
eq(resolveIdentity(null, "drop'; DROP TABLE users;--").key, "visitor:anon", "injection-ish id rejected");
eq(resolveIdentity(null, "a".repeat(65)).key, "visitor:anon", "over-long id rejected");
eq(resolveIdentity(null, "a".repeat(64)).key, `visitor:${"a".repeat(64)}`, "64-char id accepted");
ok(normalizeVisitorId("  abcdefgh  ") === "abcdefgh", "visitor id trimmed");

/* ── ip hashing ── */
ok(hashIp(null) === null, "missing ip hashes to null");
ok(hashIp("1.2.3.4") === hashIp("1.2.3.4"), "ip hash is deterministic");
ok(hashIp("1.2.3.4") !== hashIp("1.2.3.5"), "different ips hash differently");
ok(/^[a-f0-9]{32}$/.test(hashIp("1.2.3.4") as string), "ip hash is 32 hex chars");
ok(!(hashIp("1.2.3.4") as string).includes("1.2.3.4"), "raw ip not recoverable from hash");

/* ── cooldown math ── */
const now = Date.parse("2026-11-24T19:00:00Z");
eq(msUntilFree(null, now), 0, "no window means ready");
eq(msUntilFree("2026-11-24T18:00:00Z", now), 0, "past window means ready");
eq(msUntilFree("2026-11-25T19:00:00Z", now), 86_400_000, "full window remaining");
eq(msUntilFree("not a date", now), 0, "garbage date means ready");

/* ── countdown label ── */
eq(countdownLabel(0), "now", "zero countdown reads now");
eq(countdownLabel(-5000), "now", "negative countdown reads now");
eq(countdownLabel(45_000), "45s", "seconds only");
eq(countdownLabel(125_000), "2m 05s", "minutes and seconds");
eq(countdownLabel(3_600_000), "1h 00m", "one hour");
eq(countdownLabel(86_400_000), "24h 00m", "one day");

/* ── mall post formatting ── */
const held = formatChallengePost("free will", "Free will is Hunger wearing a coat.", "held");
ok(held.startsWith('CHALLENGE — "free will"'), "post opens with the challenge");
ok(held.includes("Free will is Hunger wearing a coat."), "post includes her reply");
ok(held.includes("HELD. Love, Fear, and Hunger still cover it."), "held verdict line");
const conceded = formatChallengePost("x", "y", "conceded");
ok(conceded.includes("CONCEDED. The framework met its edge."), "conceded verdict line");
ok(!conceded.includes("HELD."), "conceded post has no held line");

const longIdea = "i".repeat(900);
const longReply = "r".repeat(1400);
const long = formatChallengePost(longIdea, longReply, "held");
ok(long.length <= 2000, "post never exceeds the 2000-char store limit");
ok(long.endsWith("HELD. Love, Fear, and Hunger still cover it."), "verdict survives truncation of a single exchange");
ok(long.length <= 2000, "single-exchange post capped at 2000");
eq(formatChallengePost("  spaced  ", " reply ", "held").includes('"spaced"'), true, "idea trimmed in post");

/* ── markdown stripping (feed is plain text) ── */
eq(sanitizeReply("**FEAR** — first and fast."), "FEAR — first and fast.", "bold stripped");
eq(sanitizeReply("a\n---\nb"), "a\n\nb", "horizontal rule dropped");
eq(sanitizeReply("## Heading\nbody"), "Heading\nbody", "heading marks dropped");
eq(sanitizeReply("keep *this* word"), "keep this word", "italics stripped");
eq(sanitizeReply("`code`"), "code", "inline code unwrapped");
eq(sanitizeReply("a\n\n\n\nb"), "a\n\nb", "blank lines collapsed");
eq(sanitizeReply("plain shop talk, no styling"), "plain shop talk, no styling", "plain text untouched");
eq(sanitizeReply("  padded  "), "padded", "reply trimmed");
eq(splitResultMarker("**bold** answer [[CONCEDED]]").reply, "bold answer", "marker and markdown cleaned together");

/* ── report ── */
if (failures.length > 0) {
  console.error(`\n${failures.length} FAILED\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error(`\n${pass} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`✓ all ${pass} checks passed`);
