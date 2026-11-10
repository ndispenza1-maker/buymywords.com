"use client";

import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };

interface StoreBuilderProps {
  storeId: string;
  storeName: string;
  storeDescription: string | null;
  storeType: string;
  externalUrl: string | null;
  storeContent: string | null;
  chatHistory: Message[];
  ownerName: string;
}

export default function StoreBuilder({
  storeId,
  storeName,
  storeType,
  externalUrl,
  storeContent,
  chatHistory: initialHistory,
}: StoreBuilderProps) {
  const [messages, setMessages] = useState<Message[]>(initialHistory);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string>(storeContent || "");
  const [saveMsg, setSaveMsg] = useState("");
  const [greeted, setGreeted] = useState(initialHistory.length > 0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // For connected projects, show a different view
  if (storeType === "existing" && externalUrl) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>{storeName}</h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Connected project</p>
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold no-underline"
            style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
          >
            🔗 Visit Project
          </a>
        </div>
      </main>
    );
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // On mount, extract preview from last assistant HTML message if no published content
  useEffect(() => {
    if (!preview && messages.length > 0) {
      const lastAssistant = [...messages].reverse().find(m => m.role === "assistant" && m.content);
      if (lastAssistant) {
        const html = extractHTML(lastAssistant.content);
        if (html) setPreview(html);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-greet on first visit (no history)
  useEffect(() => {
    if (!greeted && messages.length === 0) {
      setGreeted(true);
      fetchGreeting();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGreeting = async () => {
    setLoading(true);
    try {
      const greetMsg: Message[] = [{ role: "user", content: "Hi, I just opened my store and I'm ready to get started." }];
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId, messages: greetMsg }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages([{ role: "assistant", content: data.content }]);

        // If the greeting includes HTML, show it
        if (data.hasHTML && !data.truncated) {
          const html = extractHTML(data.content);
          if (html) {
            setPreview(html);
            setSaveMsg("✅ Published!");
            setTimeout(() => setSaveMsg(""), 3000);
          }
        }
      }
    } catch {
      setMessages([{
        role: "assistant",
        content: `Hey! 👋 I'm your Mall Assistant. I'll help you build your store page right here — no coding needed. Tell me what you're selling and the vibe you want, and I'll build it for you!`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const sanitizeHTML = (html: string): string => {
    if (!html.includes('<base')) {
      html = html.replace('<head>', '<head><base target="_blank">');
    }
    html = html.replace(/href="\/(?!\/)([^"]*)"/g, 'href="javascript:void(0)"');
    html = html.replace(/href="#([^"]*)"/g, 'href="javascript:void(0)"');
    return html;
  };

  const extractHTML = (content: string): string => {
    let html = "";

    const htmlBlock = content.match(/```html?\s*\n([\s\S]*?)```/);
    if (htmlBlock) { html = htmlBlock[1].trim(); }

    if (!html) {
      const unclosed = content.match(/```html?\s*\n([\s\S]*)/);
      if (unclosed && unclosed[1].includes("<html")) { html = unclosed[1].trim(); }
    }

    if (!html) {
      const docIdx = content.indexOf("<!DOCTYPE");
      const htmlIdx = content.indexOf("<html");
      const startIdx = docIdx >= 0 ? docIdx : htmlIdx;
      if (startIdx >= 0) { html = content.substring(startIdx).trim(); }
    }

    if (html) {
      const closeIdx = html.lastIndexOf("</html>");
      if (closeIdx >= 0) {
        html = html.substring(0, closeIdx + "</html>".length);
      }
    }

    return html ? sanitizeHTML(html) : "";
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId, messages: newMessages }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }

      const data = await res.json();
      const assistantMsg: Message = { role: "assistant", content: data.content };
      const updatedMessages = [...newMessages, assistantMsg];
      setMessages(updatedMessages);

      // If the response includes HTML, update the preview
      if (data.hasHTML) {
        if (data.truncated) {
          // AI response was cut off — warn user, don't overwrite preview
          setMessages([...updatedMessages, {
            role: "assistant",
            content: "⚠️ My response was cut off before I finished the page. Your current page was NOT overwritten. Try asking me again with a simpler request, or ask me to make smaller changes."
          }]);
        } else {
          const html = extractHTML(data.content);
          if (html) {
            setPreview(html);
            setSaveMsg("✅ Published!");
            setTimeout(() => setSaveMsg(""), 3000);
          }
        }
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "Something went wrong. Try again.";
      setMessages([...newMessages, { role: "assistant", content: `❌ ${errMsg}` }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const inputStyle = {
    border: "1px solid var(--border)",
    background: "var(--bg)",
  };

  return (
    <main className="flex flex-col" style={{ height: "calc(100vh - 56px)" }}>
      {/* Save notification bar */}
      {saveMsg && (
        <div
          className="px-4 py-2 text-center text-sm font-semibold"
          style={{ background: "var(--bg-card)", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}
        >
          {saveMsg}
        </div>
      )}

      <div className="flex flex-1" style={{ minHeight: 0 }}>
        {/* Preview panel */}
        <div className="flex-1 flex flex-col" style={{ background: "var(--bg)" }}>
          <div
            className="px-4 py-2 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}
          >
            <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              Live Preview
            </p>
          </div>

          <div className="flex-1">
            {preview ? (
              <iframe
                srcDoc={preview}
                sandbox="allow-scripts allow-forms allow-popups"
                className="w-full h-full border-none"
                title="Store Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-4xl mb-3">🏗️</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                    Your store will appear here
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    Chat with your assistant to build it →
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div
          className="flex flex-col"
          style={{
            width: "380px",
            minWidth: "380px",
            borderLeft: "1px solid var(--border)",
            background: "var(--bg-card)",
          }}
        >
          {/* Chat header */}
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{
              borderBottom: "1px solid var(--border)",
              background: "linear-gradient(135deg, var(--accent), var(--sunset-warm))",
            }}
          >
            <span className="text-lg">✨</span>
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--text-inverse)" }}>
                Mall Assistant
              </p>
              <p className="text-[10px] opacity-80" style={{ color: "var(--text-inverse)" }}>
                I&apos;ll build your store — just tell me what you want
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 && !loading && (
              <div className="text-center py-8">
                <p className="text-2xl mb-2">✨</p>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  Starting up...
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`text-sm rounded-xl px-3 py-2 ${msg.role === "user" ? "ml-8" : "mr-4"}`}
                style={{
                  background: msg.role === "user" ? "var(--accent)" : "var(--bg)",
                  color: msg.role === "user" ? "var(--text-inverse)" : "var(--text)",
                  border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                }}
              >
                {msg.role === "assistant" ? (
                  <div className="text-xs leading-relaxed whitespace-pre-wrap">
                    {msg.content.includes("<!DOCTYPE") || msg.content.includes("```html")
                      ? "✅ Built your store page — check the preview ←"
                      : msg.content}
                  </div>
                ) : (
                  <div className="text-xs leading-relaxed">{msg.content}</div>
                )}
              </div>
            ))}

            {loading && (
              <div
                className="text-xs rounded-xl px-3 py-2 mr-4"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
              >
                <span className="inline-flex gap-1">
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse" style={{ animationDelay: "0.2s" }}>●</span>
                  <span className="animate-pulse" style={{ animationDelay: "0.4s" }}>●</span>
                </span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tell me what to build..."
                rows={2}
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none resize-none"
                style={inputStyle}
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-3 rounded-lg border-none cursor-pointer disabled:opacity-40 self-end"
                style={{ background: "var(--accent)", color: "var(--text-inverse)", height: "36px" }}
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
