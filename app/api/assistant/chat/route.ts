import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getSQL } from "@/lib/db";
import { isRateLimited } from "@/lib/security";
import { getArchetypePrompt, getStarterHTML, normalizeArchetype } from "@/lib/store-templates";

// LLM calls can be slow
export const maxDuration = 60;

const JWT_SECRET = process.env.JWT_SECRET!;

// The Mall's own Claude API key — server-side only, never exposed
const MALL_CLAUDE_KEY = process.env.MALL_CLAUDE_API_KEY;
const BUILDER_MODEL = "claude-haiku-5-5";

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

/* ── System prompt ─────────────────────────────────────────── */

const SYSTEM_PROMPT = `You are the Mall Assistant — the friendly, smart AI that helps store owners build and manage their store page on The Mall of Projects.

YOU ARE BOTH THE GUIDE AND THE BUILDER. You do everything: chat, advise, AND generate the actual store HTML.

YOUR PERSONALITY:
- Warm, encouraging, and patient. These are people who might be nervous about starting their first online store.
- Direct and clear. No jargon. If you have to use a technical term, explain it in plain English.
- Celebrate small wins. "Nice! Your page is live — check the preview."
- Keep messages short and actionable. One step at a time. Never overwhelm.

HOW THE STORE BUILDER WORKS:
The store page lives at themallofprojects.com/store/[user-id]. When the owner visits their store, they see:
- A split-screen layout: LIVE PREVIEW on the left, CHAT PANEL (you) on the right
- They talk to you in the chat. You can both guide them AND generate their store page.
- When you generate HTML, it auto-publishes to the preview. Visitors see the latest version immediately.

WHEN TO GENERATE HTML:
- When the user asks you to build, create, update, or change their store page
- When you think a visual would help (e.g., "Let me build you a starting page")
- On the very first conversation, PROACTIVELY offer to build a starter page based on their store name/description

WHEN TO JUST CHAT:
- When the user asks questions about how things work
- When they want advice on pricing, layout, branding, copy
- When they want help connecting external services (Stripe, etc.)
- When they're describing what they want before you build it

HTML GENERATION RULES:
- Generate a COMPLETE, self-contained HTML page with inline CSS and inline JS
- Use modern, clean, responsive design
- Include the full <!DOCTYPE html> through </html>
- All styles must be inline in a <style> tag, all scripts in a <script> tag
- No external dependencies, CDNs, or imports — everything self-contained
- When the user asks to modify something, output the FULL updated page, not just the changes
- If the user mentions payment links (Stripe, PayPal, etc.), add them as regular <a> links/buttons
- Keep it simple, clean, and fast-loading
- Use a modern color palette unless the user specifies colors
- Make text readable, spacing generous, buttons clear

CRITICAL RULES FOR LINKS AND BUTTONS:
- Add <base target="_blank"> inside the <head> tag — the page renders in a sandboxed iframe
- For placeholder/coming-soon buttons, use <button onclick="alert('Coming Soon!')" ...> NOT <a href="/"> or <a href="#">
- Never use href="/" or href="#" or any relative URL — these will break inside the iframe
- Real external links (Stripe, PayPal, etc.) use full https:// URLs with target="_blank"
- Placeholder links that aren't ready yet: use button elements, not anchor tags

IMAGE HANDLING — CRITICAL:
When the user shares an image in the chat, you will receive it as a vision attachment. The image has ALREADY been uploaded and has a permanent Cloudinary URL. You will also see the image URL provided as text (starting with https://res.cloudinary.com/).

RULES FOR PLACING IMAGES:
- Use the EXACT Cloudinary URL provided — never modify it, never make up URLs
- Place the image using a standard <img> tag with the full URL
- Always add descriptive alt text based on what you see in the image
- Make images responsive: style="max-width: 100%; height: auto;"
- If the user says "hero image" or "banner": make it full-width at the top
- If the user says "product image": size it appropriately in a product card/grid
- If the user says "logo": place it in the header, keep it small (max-height ~60px)
- If the user says "gallery" or "add to gallery": create/extend a grid of images
- If the user just shares an image with no instruction: ASK where they want it
- When regenerating the full page, PRESERVE all previously placed images and their URLs
- Multiple images: the user can share several. Each gets its own Cloudinary URL. Keep all of them.

YOUTUBE / VIDEO EMBEDS:
- YouTube CHANNEL links (youtube.com/@handle, youtube.com/c/name, youtube.com/channel/ID) CANNOT be embedded as a video player — YouTube only allows individual videos to be embedded.
- When a user gives you a channel link: EXPLAIN this to them in plain language. Say something like: "YouTube doesn't allow channel pages to be embedded on other sites — only individual videos. I can add a YouTube button that links to your channel, or if you give me a specific video link I can embed that as a player on your page. What would you prefer?"
- For individual video links (youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID): embed as <iframe src="https://www.youtube.com/embed/VIDEO_ID" width="100%" height="315" frameborder="0" allowfullscreen style="border-radius:12px;"></iframe>
- When adding a channel as a link/button, make it look good — styled button with a 🎬 or ▶️ icon, matches the page design
- When in doubt, use a link/button — it always works

CONNECTING SERVICES (guide them step by step):
- Stripe: Create account → make a Payment Link → tell you: "Add a buy button with this link: [paste Stripe link]"
- Beehiiv: Create free account → get embed code → tell you: "Add an email signup using this: [paste code]"
- Other services: help them figure out the integration

FIRST INTERACTION:
When there's no chat history yet, greet them warmly and offer to build a starter page:
"Hey! 👋 I'm your Mall Assistant. I'll help you build your store page right here in this chat — no coding needed. Want me to put together a starter page for [store name]? Just tell me what you're selling and the vibe you want, and I'll build it."`;

/* ── Build Claude-compatible messages (with vision) ───────── */

type InboundMessage = {
  role: string;
  content: string;
  images?: string[];
};

type ClaudeContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "url"; url: string } };

type ClaudeMessage = {
  role: "user" | "assistant";
  content: string | ClaudeContentBlock[];
};

function buildClaudeMessages(messages: InboundMessage[]): ClaudeMessage[] {
  return messages.map((m) => {
    const role: "user" | "assistant" = m.role === "system" ? "user" : (m.role as "user" | "assistant");
    const hasImages = m.images && m.images.length > 0;

    if (!hasImages) {
      return { role, content: m.content };
    }

    // Build multimodal content blocks
    const blocks: ClaudeContentBlock[] = [];

    // Add images first so Claude sees them
    for (const url of m.images!) {
      blocks.push({ type: "image", source: { type: "url", url } });
    }

    // Add a text block with the user's message AND the URLs for reference
    const urlList = m.images!.map((u) => `Image URL: ${u}`).join("\n");
    const textContent = m.content
      ? `${m.content}\n\n${urlList}`
      : `The user shared image(s) for their store page.\n\n${urlList}`;
    blocks.push({ type: "text", text: textContent });

    return { role, content: blocks };
  });
}

/* ── POST handler ──────────────────────────────────────────── */

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

  // Verify this user owns this store
  const stores = await sql`
    SELECT id, store_name, store_description, store_content, store_archetype
    FROM stores WHERE id = ${store_id} AND user_id = ${userId}
  `;

  if (!stores[0]) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  // Rate limit: 30 requests per user per 15 minutes
  if (isRateLimited(`assistant:${userId}`, 30, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please wait a few minutes." }, { status: 429 });
  }

  const store = stores[0];
  const currentPage = (store.store_content as string) || "";
  const archetype = normalizeArchetype(store.store_archetype);
  const archetypePrompt = getArchetypePrompt(archetype);

  // Fresh store with no page yet: hand the model the archetype's starter template
  // to EDIT, instead of asking it to invent a layout from nothing.
  const starter =
    !currentPage && archetype !== "blank"
      ? getStarterHTML(archetype, store.store_name as string, store.store_description as string | null)
      : "";

  const pageToEdit = currentPage || starter;

  // Build context-aware system prompt
  const pageContext = pageToEdit
    ? `\n\nCURRENT PAGE HTML (this is what visitors see right now — modify this when the user asks for changes):\n\`\`\`html\n${pageToEdit}\n\`\`\`${
        starter
          ? "\n\nThis is your archetype's STARTER TEMPLATE, not the owner's finished page. Personalize it: fill the dashed placeholder blocks with real details from the owner, and replace its example copy with their words. Keep the structure. Never leave a placeholder block in place once you have the real answer."
          : ""
      }`
    : "\n\nThe store page is currently blank. When ready, build the first version.";

  const contextPrompt = `${SYSTEM_PROMPT}\n\n${archetypePrompt}\n\nStore name: "${store.store_name}"\n${store.store_description ? `Store description: "${store.store_description}"` : ""}${pageContext}`;

  // Only send last 6 messages to avoid context bloat — the current page is in the system prompt
  const recentMessages = messages.slice(-6);
  const claudeMessages = buildClaudeMessages(recentMessages);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": MALL_CLAUDE_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: BUILDER_MODEL,
        max_tokens: 16000,
        system: contextPrompt,
        messages: claudeMessages,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Mall Assistant error:", err);

      // Parse status for user-friendly error
      if (res.status === 429) {
        return NextResponse.json(
          { error: "The AI is busy right now. Try again in a moment." },
          { status: 429 }
        );
      }
      if (res.status === 401) {
        return NextResponse.json(
          { error: "AI service configuration issue. Please contact support." },
          { status: 503 }
        );
      }
      throw new Error(`AI error: ${res.status}`);
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
      VALUES (${store_id}, ${userId}, ${inputTokens}, ${outputTokens}, ${BUILDER_MODEL})
    `;

    // Check if the response contains HTML — auto-publish if so
    const html = extractHTML(content);
    if (html && !isTruncated(html)) {
      // Save content + chat history together
      const updatedMessages = [...messages, { role: "assistant", content }];
      await sql`
        UPDATE stores SET
          store_content = ${html},
          assistant_chat_history = ${JSON.stringify(updatedMessages)}
        WHERE id = ${store_id}
      `;
    } else {
      // Save chat history only
      const updatedMessages = [...messages, { role: "assistant", content }];
      await sql`
        UPDATE stores SET assistant_chat_history = ${JSON.stringify(updatedMessages)}
        WHERE id = ${store_id}
      `;
    }

    return NextResponse.json({
      content,
      hasHTML: !!html,
      truncated: html ? isTruncated(html) : false,
      usage: { input_tokens: inputTokens, output_tokens: outputTokens },
    });
  } catch (e: unknown) {
    console.error("Mall Assistant call failed:", e);
    const msg = e instanceof Error ? e.message : "Something went wrong";

    if (msg.includes("abort") || msg.includes("AbortError") || msg.includes("ETIMEDOUT")) {
      return NextResponse.json(
        { error: "The AI took too long. Try a shorter request, or try again in a moment." },
        { status: 504 }
      );
    }

    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

/* ── HTML extraction helpers ───────────────────────────────── */

// Extract HTML from AI response
function extractHTML(content: string): string {
  let html = "";

  // Try markdown code block (closed fence)
  const htmlBlock = content.match(/```html?\s*\n([\s\S]*?)```/);
  if (htmlBlock) {
    html = htmlBlock[1].trim();
  }

  // Handle unclosed code block
  if (!html) {
    const unclosed = content.match(/```html?\s*\n([\s\S]*)/);
    if (unclosed && unclosed[1].includes("<html")) {
      html = unclosed[1].trim();
    }
  }

  // Find <!DOCTYPE or <html directly in content
  if (!html) {
    const docIdx = content.indexOf("<!DOCTYPE");
    const htmlIdx = content.indexOf("<html");
    const startIdx = docIdx >= 0 ? docIdx : htmlIdx;
    if (startIdx >= 0) {
      html = content.substring(startIdx).trim();
    }
  }

  // Strip anything after </html>
  if (html) {
    const closeIdx = html.lastIndexOf("</html>");
    if (closeIdx >= 0) {
      html = html.substring(0, closeIdx + "</html>".length);
    }
  }

  // Sanitize: inject <base target="_blank">
  if (html && !html.includes("<base")) {
    html = html.replace("<head>", '<head><base target="_blank">');
  }

  // Auto-convert YouTube URLs in iframes to embed format
  if (html) {
    html = html.replace(
      /(<iframe[^>]*\ssrc=["'])https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)([^"']*?)(["'])/gi,
      "$1https://www.youtube.com/embed/$2$4"
    );
    html = html.replace(
      /(<iframe[^>]*\ssrc=["'])https?:\/\/(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]+)(["'])/gi,
      "$1https://www.youtube.com/embed/$2$3"
    );
    html = html.replace(
      /(<iframe[^>]*\ssrc=["'])https?:\/\/youtu\.be\/([a-zA-Z0-9_-]+)(["'])/gi,
      "$1https://www.youtube.com/embed/$2$3"
    );
  }

  return html;
}

// Check if HTML was truncated mid-stream
function isTruncated(html: string): boolean {
  return html.includes("<html") && !html.includes("</html");
}
