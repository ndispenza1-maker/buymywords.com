/**
 * Smoke tests for lib/store-templates.ts
 * Run: node --experimental-strip-types scripts/test-store-templates.mts
 */
import {
  ARCHETYPES,
  normalizeArchetype,
  isArchetype,
  getArchetypePrompt,
  getStarterHTML,
} from "../lib/store-templates.ts";

let pass = 0;
const failures: string[] = [];

function ok(cond: unknown, label: string) {
  if (cond) { pass++; } else { failures.push(label); }
}

/* ── picker metadata ── */
ok(ARCHETYPES.length === 3, "three archetypes offered");
ok(
  ARCHETYPES.map((a) => a.key).join(",") === "service,product,donation",
  "archetype order is service,product,donation"
);
ok(ARCHETYPES.every((a) => a.label && a.emoji && a.blurb), "every archetype has label/emoji/blurb");

/* ── normalize ── */
ok(normalizeArchetype("service") === "service", "normalize service");
ok(normalizeArchetype(" PRODUCT ") === "product", "normalize product with whitespace/case");
ok(normalizeArchetype("donation") === "donation", "normalize donation");
ok(normalizeArchetype("blank") === "blank", "normalize blank");
ok(normalizeArchetype("garbage") === "blank", "unknown -> blank");
ok(normalizeArchetype(null) === "blank", "null -> blank");
ok(normalizeArchetype(undefined) === "blank", "undefined -> blank");
ok(normalizeArchetype(42) === "blank", "number -> blank");
ok(normalizeArchetype("") === "blank", "empty -> blank");
ok(isArchetype("service") === true, "isArchetype service");
ok(isArchetype("nope") === false, "isArchetype rejects unknown");

/* ── prompt guidance ── */
const sp = getArchetypePrompt("service");
const pp = getArchetypePrompt("product");
const dp = getArchetypePrompt("donation");
const bp = getArchetypePrompt("blank");
ok(/phone|call|text/i.test(sp), "service prompt mentions phone/call/text");
ok(sp.includes("Never invent a license number"), "service prompt forbids invented license");
ok(/Payment Link/i.test(pp), "product prompt mentions Payment Link");
ok(/Never invent a price/i.test(pp), "product prompt forbids invented price");
ok(/tier/i.test(dp), "donation prompt mentions tiers");
ok(/nonprofit/i.test(dp), "donation prompt handles nonprofit wording");
ok(!bp.includes("TEMPLATE:"), "blank prompt has no archetype template");

/* ── starter HTML ── */
const cases = ["service", "product", "donation"] as const;

for (const a of cases) {
  const html = getStarterHTML(a, "Nick's HVAC", "Furnace repair in Tampa");
  ok(html.startsWith("<!DOCTYPE html>"), a + ": starts with doctype");
  ok(html.trimEnd().endsWith("</html>"), a + ": ends with </html>");
  ok(html.includes('<base target="_blank">'), a + ": has base target");
  ok(!html.includes('href="#"'), a + ": no dead href=#");
  ok(!html.includes('href="/'), a + ": no root-relative href");
  ok(!html.includes("{" + "{"), a + ": no unreplaced placeholders");
  ok(html.includes("Nick&#39;s HVAC"), a + ": escaped store name injected");
  ok(html.includes("Furnace repair in Tampa"), a + ": description injected");
  ok(!/<script src=/i.test(html), a + ": no external scripts");
  ok(!/[\u{1F300}-\u{1FAFF}]/u.test(html), a + ": no pictographic emoji (tofu risk)");
  ok(html.split("<html").length === 2, a + ": exactly one html tag (no nested doc)");
}

/* ── escaping ── */
const evil = getStarterHTML("service", '<script>alert("x")</script>', "a & b");
ok(!evil.includes("<script>alert"), "script tag in name is escaped");
ok(evil.includes("&lt;script&gt;"), "escaped script entity present");
ok(evil.includes("a &amp; b"), "ampersand in description escaped");

/* ── blank ── */
ok(getStarterHTML("blank", "X") === "", "blank archetype has no starter");
ok(getStarterHTML("donation", "", null).includes("Your Store"), "empty name falls back");

/* ── report ── */
console.log("");
console.log("passed:", pass, "failed:", failures.length);
if (failures.length) {
  console.log("\nFAILURES:");
  for (const f of failures) console.log("  - " + f);
  process.exit(1);
}
console.log("ALL PASS");
