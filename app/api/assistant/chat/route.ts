import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getSQL } from "@/lib/db";

// LLM calls can be slow
export const maxDuration = 60;

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

// The Mall's own Claude API key — server-side only, never exposed
const MALL_CLAUDE_KEY = process.env.MALL_CLAUDE_API_KEY;
const ASSISTANT_MODEL = "claude-haiku-4-20250414";

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

YOUR JOB:
1. Help them get a FREE LLM API key so they can use the Store Builder (the chat panel on the left that generates their store page)
2. Walk them through building their store page using the Store Builder
3. Guide them through connecting external services (Stripe for payments, Beehiiv for mailing lists, Resend for email, etc.)
4. Answer any questions they have along the way

GETTING STARTED FLOW:
- First, help them get an API key. Recommend FREE options:
  • Google AI Studio (Gemini) — completely free, generous limits, great for beginners
  • OpenAI — has free trial credits
  • Anthropic — has free trial credits  
  • Grok (xAI) — has free tier
- Walk them through step by step: "Go to [site], click [button], copy the key"
- If the user pastes a screenshot, read what's on their screen and tell them exactly what to click next
- Once they have a key, help them connect it in the Store Builder (the ⚙️ settings button in the chat panel)

BUILDING THEIR STORE:
- Once their AI is connected, guide them on what to tell their AI in the Store Builder chat
- Suggest prompts like: "Build me a landing page for [store name] with a hero section, about section, and a way to contact me"
- Help them iterate: "Ask your AI to change the colors" or "Tell it to add a payment button"

CONNECTING SERVICES:
- Stripe: Walk them through creating a Stripe account, making a Payment Link, and pasting it in their store
- Beehiiv: Help them set up a free mailing list and embed the signup form
- Resend: Help them set up transactional emails if needed
- For each service, give EXACT step-by-step instructions

IMPORTANT RULES:
- You are NOT the Store Builder. You don't generate HTML or build the store page. The Store Builder chat (left panel) does that using their own AI.
- You ARE the guide who sits alongside them and helps them through the process.
- If they ask you to build something, redirect them: "That's what the Store Builder chat is for! Click over there and tell your AI: [suggest a prompt]"
- Keep it conversational. One message, one action. Don't dump a wall of instructions.
- If they seem stuck or frustrated, slow down and simplify.
- When they share a screenshot, be specific: "I can see you're on the API keys page. Click the blue 'Create API Key' button in the top right."

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
