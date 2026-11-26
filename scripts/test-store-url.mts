/**
 * Tests for lib/store-url.ts
 * Run: node --experimental-strip-types scripts/test-store-url.mts
 */
import { parseExternalUrl } from "../lib/store-url.ts";

let pass = 0;
const failures: string[] = [];

function ok(cond: unknown, label: string) {
  if (cond) { pass++; } else { failures.push(label); }
}

function failureOf(value: unknown): string {
  const r = parseExternalUrl(value);
  return r.ok ? "" : r.error;
}

/* ── accepts good https URLs ── */
{
  const r = parseExternalUrl("https://example.com");
  ok(r.ok === true, "accepts https url");
  ok(r.ok && r.url === "https://example.com/", "normalizes to URL.toString()");
}
{
  const r = parseExternalUrl("  https://example.com/path?a=1#x  ");
  ok(r.ok === true, "accepts https with whitespace");
  ok(r.ok && r.url === "https://example.com/path?a=1#x", "trims and preserves path/query/hash");
}
{
  const r = parseExternalUrl("HTTPS://Example.COM");
  ok(r.ok === true && r.url === "https://example.com/", "lowercases scheme+host");
}
{
  const r = parseExternalUrl("https://sub.example.co.uk:8443/deep/link");
  ok(r.ok === true && r.url === "https://sub.example.co.uk:8443/deep/link", "model accepts port and deep path");
}

/* ── requires https ── */
ok(failureOf("http://example.com").includes("https") === true, "rejects http");
ok(failureOf("ftp://example.com").includes("https") === true, "rejects ftp");
ok(failureOf("javascript:alert(1)").includes("https") === true, "rejects javascript scheme");
ok(failureOf("data:text/html,<h1>x</h1>").includes("https") === true, "rejects data scheme");
ok(failureOf("file:///etc/passwd").includes("https") === true, "rejects file scheme");

/* ── requires a full URL ── */
ok(failureOf("example.com").includes("full URL") === true, "rejects bare domain");
ok(failureOf("www.example.com/store").includes("full URL") === true, "rejects www without scheme");
ok(failureOf("just some words").includes("full URL") === true, "rejects prose");

/* ── rejects empty/missing ── */
ok(failureOf("").length > 0 === true, "rejects empty string");
ok(failureOf("   ").length > 0 === true, "rejects whitespace only");
ok(failureOf(null).length > 0 === true, "rejects null");
ok(failureOf(undefined).length > 0 === true, "rejects undefined");
ok(failureOf(42).length > 0 === true, "rejects number");
ok(failureOf({}).length > 0 === true, "rejects object");

/* ── rejects credentialed URLs ── */
ok(failureOf("https://user:pass@example.com").length > 0 === true, "rejects userinfo");

/* ── rejects oversized ── */
{
  const long = "https://example.com/" + "a".repeat(3000);
  ok(failureOf(long).length > 0 === true, "rejects url over 2048 chars");
}

/* ── never throws ── */
{
  const weird = [Symbol("x"), () => {}, [], NaN, Infinity];
  let threw = false;
  for (const w of weird) {
    try { parseExternalUrl(w); } catch { threw = true; }
  }
  ok(threw === false, "never throws on odd input types");
}

console.log("");
console.log("passed:", pass, "failed:", failures.length);
if (failures.length) {
  console.log("\nFAILURES:");
  for (const f of failures) console.log("  - " + f);
  process.exit(1);
}
console.log("ALL PASS");
