import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getSQL } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

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

const SYSTEM_PROMPT = `You are a store builder assistant. The user owns a storefront page and wants you to build or update it.

RULES:
- Generate a COMPLETE, self-contained HTML page with inline CSS and inline JS
- Use modern, clean, responsive design
- The page should look professional and work on mobile
- Include the full <!DOCTYPE html> through </html>
- All styles must be inline in a <style> tag, all scripts in a <script> tag
- No external dependencies, CDNs, or imports — everything self-contained
- When the user asks to modify something, output the FULL updated page, not just the changes
- If the user mentions payment links (Stripe, PayPal, etc.), add them as regular <a> links/buttons
- Keep it simple, clean, and fast-loading
- Use a modern color palette unless the user specifies colors
- Make text readable, spacing generous, buttons clear

You are building their store. Make it look good.`;

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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

  // Verify this user owns this store
  const stores = await sql`
    SELECT id, llm_provider, llm_api_key, store_name, store_description 
    FROM stores WHERE id = ${store_id} AND user_id = ${userId}
  `;

  if (!stores[0]) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const store = stores[0];

  if (!store.llm_provider || !store.llm_api_key) {
    return NextResponse.json({ error: "LLM not configured. Add your API key first." }, { status: 400 });
  }

  // Build context-aware system prompt
  const contextPrompt = `${SYSTEM_PROMPT}\n\nStore name: "${store.store_name}"\n${store.store_description ? `Store description: "${store.store_description}"` : ""}`;

  try {
    if (store.llm_provider === "openai") {
      return await callOpenAI(store.llm_api_key, contextPrompt, messages);
    } else if (store.llm_provider === "anthropic") {
      return await callAnthropic(store.llm_api_key, contextPrompt, messages);
    } else if (store.llm_provider === "google") {
      return await callGoogle(store.llm_api_key, contextPrompt, messages);
    } else if (store.llm_provider === "grok") {
      return await callGrok(store.llm_api_key, contextPrompt, messages);
    } else {
      return NextResponse.json({ error: "Unsupported LLM provider" }, { status: 400 });
    }
  } catch (e: unknown) {
    console.error("LLM call failed:", e);
    const msg = e instanceof Error ? e.message : "LLM call failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

async function callOpenAI(apiKey: string, systemPrompt: string, messages: Array<{ role: string; content: string }>) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 8000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${err}`);
  }

  const data = await res.json();
  return NextResponse.json({
    content: data.choices[0]?.message?.content || "",
    provider: "openai",
  });
}

async function callAnthropic(apiKey: string, systemPrompt: string, messages: Array<{ role: string; content: string }>) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role === "system" ? "user" : m.role,
        content: m.content,
      })),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic error: ${err}`);
  }

  const data = await res.json();
  const content = data.content?.[0]?.text || "";
  return NextResponse.json({ content, provider: "anthropic" });
}

async function callGoogle(apiKey: string, systemPrompt: string, messages: Array<{ role: string; content: string }>) {
  const contents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 8000 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google AI error: ${err}`);
  }

  const data = await res.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return NextResponse.json({ content, provider: "google" });
}

async function callGrok(apiKey: string, systemPrompt: string, messages: Array<{ role: string; content: string }>) {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-3-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 8000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Grok error: ${err}`);
  }

  const data = await res.json();
  return NextResponse.json({
    content: data.choices[0]?.message?.content || "",
    provider: "grok",
  });
}
