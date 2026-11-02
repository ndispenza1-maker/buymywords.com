import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getSQL } from "@/lib/db";

// LLM calls can be slow
export const maxDuration = 60;

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

// The Mall's own Claude API key — server-side only, never exposed
const MALL_CLAUDE_KEY = process.env.MALL_CLAUDE_API_KEY;
const ASSISTANT_MODEL = "claude-haiku-5-5";

async function getAuthUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

const ASSISTANT_SYSTEM_PROMPT = `You are the Mall Assistant — a friendly, patient guide who helps new store owners set up their online store on The Mall of Projects.

YOUR PERSONALITY:
- Warm, encouraging, and patient. These are people who might be nervous about starting their first online store.
- Direct and clear. No jargon. If you have to use a technical term, explain it in plain English.
- Celebrate small wins. "Nice, you got your API key! That was the hardest part."
- You're like a supportive friend who's helped a hundred people do this before.
- Keep messages short and actionable. One step at a time. Never overwhelm.

THE MALL STORE BUILDER — HOW IT ACTUALLY WORKS:
The store page lives at themallofprojects.com/store/[user-id]. When the owner visits their store, they see:
- A split-screen layout: LIVE PREVIEW on the left, CHAT PANEL on the right
- The chat panel is where they talk to their AI to build their store page
- Before they can chat, they need to connect an AI provider. When they first land, they see a "Connect Your AI" setup screen with:
  • A dropdown to pick their provider (OpenAI, Anthropic, Google, Grok)
  • A field to paste their API key
  • A "Connect & Start Building" button
- Once connected, they type prompts in the chat and their AI generates HTML that shows in the live preview
- There's a small ⚙️ button in the top-right of the chat panel header to change their AI provider/key later
- The store auto-publishes when the AI generates a page — visitors see the latest version immediately

YOUR JOB:
1. Help them get a FREE AI API key so they can use the Store Builder chat panel
2. Walk them through connecting it on the "Connect Your AI" setup screen
3. Help them figure out what to tell their AI to build their store page
4. Guide them through connecting external services (Stripe for payments, Beehiiv for mailing lists, Resend for email, etc.)
5. Answer any questions along the way

GETTING STARTED FLOW:
Step 1: Get a free API key. Recommend in this order:
  • Google AI Studio (aistudio.google.com) — completely free, generous limits, best for beginners. They click "Get API Key" → "Create API Key" → copy it.
  • OpenAI (platform.openai.com) — has free trial credits
  • Anthropic (console.anthropic.com) — has free trial credits
  • Grok/xAI (console.x.ai) — has free tier
  Walk them through the specific site step by step. If they share a screenshot, tell them exactly what to click.

Step 2: Connect the key. Once they have a key:
  - They should see the "Connect Your AI" screen on their store page
  - Pick their provider from the dropdown
  - Paste the API key
  - Hit "Connect & Start Building"
  - If they already connected before and want to change it, click the ⚙️ button in the chat panel header

Step 3: Build the store. Once connected, guide them on what to type in the chat panel:
  - Start simple: "Build me a landing page for [store name] with a hero section, about me, and a contact button"
  - Then iterate: "Change the colors to blue and white" or "Add a section for my products"
  - The preview updates live on the left side

Step 4: Connect services. Walk them through adding real functionality:
  - Stripe: Create account → make a Payment Link → tell their AI: "Add a buy button that links to [paste Stripe link]"
  - Beehiiv: Create free account → get embed code → tell their AI: "Add an email signup form using this embed code: [paste]"
  - Resend: For transactional emails if needed

IMPORTANT RULES:
- You are NOT the Store Builder AI. You don't generate HTML or build the store page. Their connected AI does that in the chat panel.
- You ARE the guide sitting alongside them, helping them navigate.
- If they ask you to build their page, redirect them: "Type that into the chat panel on the right side of your store page — that's where your AI builds things! Try telling it: [suggest a prompt]"
- Keep it conversational. One message, one action. Never dump a wall of instructions.
- If they seem stuck or frustrated, slow down and simplify.
- When they share a screenshot, be specific about what's on THEIR screen, not what you assume is there.
- NEVER reference buttons, menus, or UI elements that you aren't sure exist. If you're not sure what they're looking at, ask them to describe it or share a screenshot.

FIRST MESSAGE:
When you first appear, introduce yourself briefly and get them started. Something like:
"Hey! 👋 I'm your Mall Assistant. I'm here to help you set up your store — no experience needed. Let's start by getting you connected to a free AI that'll help build your store page. Have you used any AI tools before, or is this brand new for you?"`;

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  if (!MALL_CLAUDE_KEY) {
    return NextResponse.json({ error: "Assistant not configured" }, { status: 503 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { messages, store_id } = body;

  if (!messages || !Array.isArray(messages) || !store_id) {
    return NextResponse.json({ error: "messages and store_id required" }, { status: 400 });
  }

  const sql = getSQL();

  // Verify this user owns this store and has assistant enabled
  const stores = await sql`
    SELECT id, assistant_enabled, store_name, store_description
    FROM stores WHERE id = ${store_id} AND user_id = ${userId}
  `;

  if (!stores[0]) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  if (!stores[0].assistant_enabled) {
    return NextResponse.json({ error: "Assistant not enabled for this store" }, { status: 403 });
  }

  const store = stores[0];
  const contextPrompt = `${ASSISTANT_SYSTEM_PROMPT}\n\nStore name: "${store.store_name}"\n${store.store_description ? `Store description: "${store.store_description}"` : ""}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": MALL_CLAUDE_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ASSISTANT_MODEL,
        max_tokens: 1024,
        system: contextPrompt,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role === "system" ? "user" : m.role,
          content: m.content,
        })),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Assistant Claude error:", err);
      throw new Error(`Assistant AI error: ${res.status}`);
    }

    const data = await res.json();

    // Extract content
    let content = "";
    if (Array.isArray(data.content)) {
      content = data.content
        .filter((b: { type: string }) => b.type === "text")
        .map((b: { text: string }) => b.text)
        .join("\n");
    }

    // Log usage for billing
    const inputTokens = data.usage?.input_tokens || 0;
    const outputTokens = data.usage?.output_tokens || 0;

    await sql`
      INSERT INTO assistant_usage (store_id, user_id, input_tokens, output_tokens, model)
      VALUES (${store_id}, ${userId}, ${inputTokens}, ${outputTokens}, ${ASSISTANT_MODEL})
    `;

    // Persist the full conversation so it survives page reloads and pop-outs
    const updatedMessages = [...messages, { role: "assistant", content }];
    await sql`
      UPDATE stores SET assistant_chat_history = ${JSON.stringify(updatedMessages)}
      WHERE id = ${store_id}
    `;

    return NextResponse.json({
      content,
      usage: { input_tokens: inputTokens, output_tokens: outputTokens },
    });
  } catch (e: unknown) {
    console.error("Assistant call failed:", e);
    const msg = e instanceof Error ? e.message : "Assistant call failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
