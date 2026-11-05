import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getSQL } from "@/lib/db";
import { decryptOrPassthrough } from "@/lib/crypto";
import { isRateLimited } from "@/lib/security";
import { translateProviderError } from "@/lib/llm-errors";

// Increase serverless function timeout for LLM calls
export const maxDuration = 60;

const JWT_SECRET = process.env.JWT_SECRET!;

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

You are building their store. Make it look good.

CRITICAL RULES FOR LINKS AND BUTTONS:
- Add <base target="_blank"> inside the <head> tag — the page renders in a sandboxed iframe
- For placeholder/coming-soon buttons, use <button onclick="alert('Coming Soon!')" ...> NOT <a href="/"> or <a href="#">
- Never use href="/" or href="#" or any relative URL — these will break inside the iframe
- Real external links (Stripe, PayPal, etc.) use full https:// URLs with target="_blank"
- Placeholder links that aren't ready yet: use button elements, not anchor tags`;

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
    return NextResponse.json({ error: "Connect your AI first — click the ⚙️ button to add your API key." }, { status: 400 });
  }

  // H-3: Rate limit LLM chat — 30 requests per user per 15 minutes
  if (isRateLimited(`llm:${userId}`, 30, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a few minutes." }, { status: 429 });
  }

  // Decrypt stored API key
  const apiKey = decryptOrPassthrough(store.llm_api_key as string);

  // Build context-aware system prompt
  const contextPrompt = `${SYSTEM_PROMPT}\n\nStore name: "${store.store_name}"\n${store.store_description ? `Store description: "${store.store_description}"` : ""}`;

  try {
    if (store.llm_provider === "openai") {
      return await callOpenAI(apiKey, contextPrompt, messages);
    } else if (store.llm_provider === "anthropic") {
      return await callAnthropic(apiKey, contextPrompt, messages);
    } else if (store.llm_provider === "google") {
      return await callGoogle(apiKey, contextPrompt, messages);
    } else if (store.llm_provider === "grok") {
      return await callGrok(apiKey, contextPrompt, messages);
    } else {
      return NextResponse.json({ error: "Pick a provider in ⚙️ settings first." }, { status: 400 });
    }
  } catch (e: unknown) {
    console.error("LLM call failed:", e);
    // Parse provider + status from the structured error message
    const msg = e instanceof Error ? e.message : "";
    const providerMatch = msg.match(/^(OpenAI|Anthropic|Google AI|Grok) error/i);
    const statusMatch = msg.match(/status:\s*(\d{3})/);
    if (providerMatch || statusMatch) {
      const providerMap: Record<string, "openai" | "anthropic" | "google" | "grok"> = {
        openai: "openai", anthropic: "anthropic", "google ai": "google", grok: "grok",
      };
      const p = providerMap[(providerMatch?.[1] || store.llm_provider || "").toLowerCase()] || (store.llm_provider as "openai");
      const s = statusMatch ? parseInt(statusMatch[1], 10) : 502;
      return NextResponse.json(
        { error: translateProviderError(p, s, msg) },
        { status: 502 }
      );
    }
    // Network / timeout fallback
    if (msg.includes("fetch") || msg.includes("ETIMEDOUT") || msg.includes("ECONNREFUSED")) {
      return NextResponse.json(
        { error: "Couldn't reach your AI provider. Check your internet and try again." },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: "Something went wrong talking to your AI. Try again — if it keeps failing, check your API key in ⚙️ settings." },
      { status: 502 }
    );
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
      model: "gpt-6-luna",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 8000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error status: ${res.status} ${err}`);
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
      model: "claude-haiku-5-5",  // Current as of Oct 2026
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
    throw new Error(`Anthropic error status: ${res.status} ${err}`);
  }

  const data = await res.json();
  // Anthropic may return multiple content blocks — concatenate all text blocks
  let content = "";
  if (Array.isArray(data.content)) {
    content = data.content
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("\n");
  }
  if (!content && data.content?.[0]?.text) {
    content = data.content[0].text;
  }
  console.log("Anthropic response length:", content.length, "stop_reason:", data.stop_reason);
  return NextResponse.json({ content, provider: "anthropic" });
}

async function callGoogle(apiKey: string, systemPrompt: string, messages: Array<{ role: string; content: string }>) {
  const contents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 8000 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google AI error status: ${res.status} ${err}`);
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
      model: "grok-4.3",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 8000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Grok error status: ${res.status} ${err}`);
  }

  const data = await res.json();
  return NextResponse.json({
    content: data.choices[0]?.message?.content || "",
    provider: "grok",
  });
}
