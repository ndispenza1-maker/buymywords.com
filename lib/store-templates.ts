/**
 * Store archetypes — starter templates for the Mall Assistant.
 *
 * The template controls STRUCTURE. The assistant personalizes color, copy,
 * photos and fonts. Never let the model invent structure from scratch.
 *
 * Keep this file free of imports so it can be unit-tested with plain node.
 */

export type StoreArchetype = "service" | "product" | "donation" | "blank";

export type ArchetypeMeta = {
  key: Exclude<StoreArchetype, "blank">;
  label: string;
  emoji: string;
  blurb: string;
};

export const ARCHETYPES: ArchetypeMeta[] = [
  {
    key: "service",
    label: "I do a service",
    emoji: "🔧",
    blurb: "Repairs, installs, detailing, hauling, lessons — anything you show up to do.",
  },
  {
    key: "product",
    label: "I sell a product",
    emoji: "📦",
    blurb: "One thing, one price, one buy button. Shipped or handed over.",
  },
  {
    key: "donation",
    label: "I take support",
    emoji: "🤝",
    blurb: "Tips, donations, memberships — people giving you money for what you make.",
  },
];

export function normalizeArchetype(value: unknown): StoreArchetype {
  const v = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (v === "service" || v === "product" || v === "donation") return v;
  return "blank";
}

export function isArchetype(value: unknown): value is StoreArchetype {
  return ["service", "product", "donation", "blank"].includes(
    typeof value === "string" ? value.trim().toLowerCase() : ""
  );
}

/* ── per-archetype instructions injected into the system prompt ─ */

const COMMON = `STRUCTURE RULES (non-negotiable):
- Start from the CURRENT PAGE HTML. Improve it. Do not replace it with a different layout unless the owner explicitly asks.
- Keep the page to one screen of scrolling. This is a storefront, not a website.
- One primary action above the fold. Everything else supports it.
- Plain words. No "solutions", "empower", "leverage", "elevate". Write like a person talking to a neighbor.
- Replace obvious placeholder blocks (dashed boxes that say YOUR ... ) as soon as you learn the real value.
- Always output the complete page from <!DOCTYPE html> to </html>.`;

const SERVICE_PROMPT = `TEMPLATE: SERVICE BUSINESS (this store sells the owner's time and skill).
The page has this required structure — preserve it:
1. HEADER: business name + one-line what-they-do + service area (city/county).
2. HERO: a plain promise ("Furnace out? I can be there today.") and TWO buttons: CALL and TEXT (tel: and sms: links).
3. PRICE BLOCK: flat rate or starting price and what it includes. If they use a deposit, the buy button goes here.
4. PROOF: three short bullets — years doing it, licensed/insured if true, one real detail (brands serviced, response time).
5. HOURS + SERVICE AREA.
6. FOOTER: phone number repeated, name, city.
Rules specific to service:
- Phone and text buttons are more important than the buy button. Never remove them.
- Never invent a license number, years of experience, a price, or a service area. Ask, or leave the placeholder block.
- Buy buttons must be anchors to a full https:// Stripe Payment Link. Until the owner supplies one, keep the placeholder block.
- If they have no photos, do not invent image URLs. Use a colored block or a styled quote instead.`;

const PRODUCT_PROMPT = `TEMPLATE: SINGLE PRODUCT (this store sells one physical or digital thing).
The page has this required structure — preserve it:
1. HEADER: store name + one line.
2. HERO IMAGE: large, above the fold, with the product name and price right under it.
3. BUY BUTTON: one, large, unmissable. Anchor to a full https:// Stripe Payment Link.
4. THREE BULLETS: what it is, what it fits / who it's for, what's in the box.
5. SHIPPING + RETURNS line (or "instant download" for digital).
6. CONTACT: email or phone.
Rules specific to product:
- Never invent a price. Ask.
- Never invent or modify an image URL. Use only Cloudinary URLs the owner actually shared.
- If the buy link is missing, keep the placeholder block rather than a dead href.
- No carousels, no grids of related products, no reviews. One product, one page.`;

const DONATION_PROMPT = `TEMPLATE: SUPPORT / DONATION PAGE (people give money for what the owner makes).
The page has this required structure — preserve it:
1. HEADER: who this is and what they make.
2. STORY BLOCK: 3-5 sentences in the owner's own words. Ask them why they do it. Use their phrasing, not marketing language.
3. TIERS: three buttons ($5 / $15 / $50 or whatever they choose), plus a "choose your own amount" link where possible. Each is an anchor to a full https:// Stripe Payment Link or Buy Button URL.
4. WHAT IT SUPPORTS: one short list of concrete things the money does.
5. CONTACT / thank-you line.
Rules specific to donation:
- Never guarantee tax deductibility or call it a charity unless they say they are a registered nonprofit. Ask before using the word "donation receipt".
- Never invent tier amounts. Ask.
- Keep it warm and specific. No stock nonprofit language.`;

export function getArchetypePrompt(archetype: StoreArchetype): string {
  switch (archetype) {
    case "service":
      return `${SERVICE_PROMPT}\n\n${COMMON}`;
    case "product":
      return `${PRODUCT_PROMPT}\n\n${COMMON}`;
    case "donation":
      return `${DONATION_PROMPT}\n\n${COMMON}`;
    default:
      return COMMON;
  }
}

/* ── starter HTML ─────────────────────────────────────────── */

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const BASE_CSS = `*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;background:#fdf8f3;color:#2d2424;line-height:1.55;-webkit-font-smoothing:antialiased}
.wrap{max-width:680px;margin:0 auto;padding:0 20px}
.todo{border:2px dashed #d9a58a;background:#fff4ec;color:#a2481f;border-radius:12px;padding:14px 16px;font-size:14px;font-weight:600;margin:14px 0}
header{padding:28px 0 18px;border-bottom:1px solid #ecdfd4}
h1{font-size:30px;line-height:1.15;letter-spacing:-0.02em}
.sub{color:#7a6a63;font-size:15px;margin-top:6px}
h2{font-size:19px;margin-bottom:10px;letter-spacing:-0.01em}
section{padding:22px 0;border-bottom:1px solid #f0e6dd}
.btn{display:block;width:100%;text-align:center;text-decoration:none;font-weight:700;font-size:16px;padding:15px 20px;border-radius:12px;margin:10px 0;border:0;font-family:inherit;cursor:pointer;appearance:none}
.btn.primary{background:#c2551f;color:#fff}
.btn.secondary{background:#fff;color:#c2551f;border:2px solid #c2551f}
.btn.buy{background:#1f7a4d;color:#fff;font-size:17px;padding:17px 20px}
.small{font-size:13px;color:#7a6a63}
ul{list-style:none}
li{padding:7px 0 7px 24px;position:relative;font-size:15px}
li:before{content:"✓";position:absolute;left:0;color:#1f7a4d;font-weight:700}
footer{padding:26px 0 40px;font-size:13px;color:#7a6a63}
@media(min-width:600px){h1{font-size:36px} .wrap{padding:0 28px}}`;

export function getStarterHTML(
  archetype: StoreArchetype,
  storeName: string,
  storeDescription?: string | null
): string {
  if (archetype === "blank") return "";

  const name = esc((storeName || "Your Store").trim());
  const desc = esc((storeDescription || "").trim());

  if (archetype === "service") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<base target="_blank">
<title>${name}</title>
<style>${BASE_CSS}</style>
</head>
<body>
<div class="wrap">
<header>
<h1>${name}</h1>
<p class="sub">${desc || "Tell me what you fix or build and where you work, and I'll write this line for you."}</p>
</header>

<section>
<div class="todo">YOUR PHONE NUMBER — tell me your number and the towns you serve, and I'll wire the call and text buttons.</div>
<a class="btn primary" href="tel:">Call</a>
<a class="btn secondary" href="sms:">Text</a>
<p class="small">Fastest way to reach me. If I miss you, I text back the same day.</p>
</section>

<section>
<h2>What it costs</h2>
<div class="todo">YOUR PRICE — flat rate, starting price, or deposit. Tell me the number and what it covers.</div>
<button class="btn buy" onclick="alert('Add your Stripe Payment Link in chat and I will wire this button.');return false;">Pay deposit</button>
<p class="small">Balance due when the job is done. Cash, card, or transfer.</p>
</section>

<section>
<h2>Why me</h2>
<ul>
<li>Years in the trade — tell me how many and I'll put the real number here.</li>
<li>Licensed and insured — only if that's true; tell me and I'll add it.</li>
<li>I show up when I say I will and I tell you the price before I start.</li>
</ul>
</section>

<section>
<h2>Hours &amp; area</h2>
<div class="todo">YOUR HOURS AND SERVICE AREA — tell me the days, times, and towns.</div>
</section>

<footer>
${name} · <span class="small">Tell me your city and I'll add it here.</span>
</footer>
</div>
</body>
</html>`;
  }

  if (archetype === "product") {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<base target="_blank">
<title>${name}</title>
<style>${BASE_CSS}</style>
</head>
<body>
<div class="wrap">
<header>
<h1>${name}</h1>
<p class="sub">${desc || "Tell me what you sell and I'll write this line for you."}</p>
</header>

<section>
<div class="todo">YOUR PRODUCT PHOTO — send it in chat (paste or drag) and I'll place it here full width.</div>
<div style="background:#f2e7dd;border-radius:16px;height:260px;display:flex;align-items:center;justify-content:center;color:#a2938b;font-size:14px;">Product photo goes here</div>
<h2 style="margin-top:18px">Your product name</h2>
<div class="todo">YOUR PRICE — tell me the number.</div>
<button class="btn buy" onclick="alert('Add your Stripe Payment Link in chat and I will wire this button.');return false;">Buy now</button>
</section>

<section>
<h2>What you get</h2>
<ul>
<li>What it is, in one plain sentence.</li>
<li>Who it's for or what it fits.</li>
<li>What's in the box.</li>
</ul>
</section>

<section>
<h2>Shipping &amp; returns</h2>
<p class="small">Tell me how you ship and your return rule and I'll write it here.</p>
</section>

<section>
<h2>Questions</h2>
<p class="small">Tell me your email or phone and I'll put a contact button here.</p>
</section>

<footer>${name}</footer>
</div>
</body>
</html>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<base target="_blank">
<title>${name}</title>
<style>${BASE_CSS}</style>
</head>
<body>
<div class="wrap">
<header>
<h1>${name}</h1>
<p class="sub">${desc || "Tell me who you are and what you make, and I'll write this line for you."}</p>
</header>

<section>
<h2>Why I do this</h2>
<div class="todo">YOUR WORDS — tell me in 3-5 sentences why you make this and why it matters. I'll use your phrasing, not mine.</div>
</section>

<section>
<h2>Support the work</h2>
<div class="todo">YOUR AMOUNTS — pick three, then create one Stripe Payment Link per amount and I'll wire these buttons.</div>
<button class="btn primary" onclick="alert(\'Add your $5 Stripe Payment Link in chat.\');return false;">$5 — one time</button>
<button class="btn primary" onclick="alert(\'Add your $15 Stripe Payment Link in chat.\');return false;">$15 — one time</button>
<button class="btn primary" onclick="alert(\'Add your $50 Stripe Payment Link in chat.\');return false;">$50 — one time</button>
<p class="small">Monthly support available — tell me and I'll add a subscription link.</p>
</section>

<section>
<h2>What it pays for</h2>
<ul>
<li>One concrete thing the money buys.</li>
<li>Another concrete thing.</li>
<li>Where the work goes next.</li>
</ul>
</section>

<footer>Thank you. · ${name}</footer>
</div>
</body>
</html>`;
}
