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
  llmProvider: string | null;
  hasApiKey: boolean;
  chatHistory: Message[];
  ownerName: string;
}

export default function StoreBuilder({
  storeId,
  storeName,
  storeDescription,
  storeType,
  externalUrl,
  storeContent,
  llmProvider: initialProvider,
  hasApiKey: initialHasKey,
  chatHistory: initialHistory,
}: StoreBuilderProps) {
  const [messages, setMessages] = useState<Message[]>(initialHistory);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string>(storeContent || "");
  const [published, setPublished] = useState(!!storeContent);
  const [showSetup, setShowSetup] = useState(!initialHasKey);
  const [provider, setProvider] = useState(initialProvider || "google");
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(initialHasKey);
  const [setupError, setSetupError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
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

  // On mount, extract preview from last assistant message if no published content yet
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

  // Client-side key format hints (server validates too)
  const getKeyHint = (p: string): string => {
    switch (p) {
      case "openai": return "Starts with sk- — get yours at platform.openai.com";
      case "anthropic": return "Starts with sk-ant- — get yours at console.anthropic.com";
      case "google": return "Get a free key at aistudio.google.com";
      case "grok": return "Starts with xai- — get yours at console.x.ai";
      default: return "";
    }
  };

  const validateKeyLocally = (p: string, key: string): string | null => {
    const k = key.trim();
    if (!k) return "Paste your API key above.";
    if (k.includes("@")) return "That looks like an email, not an API key.";
    if (k.startsWith("http")) return "That looks like a URL, not an API key.";
    if (k.length < 10) return "That's too short — API keys are usually 30+ characters.";
    if (p === "openai" && !k.startsWith("sk-")) return "OpenAI keys start with \"sk-\". Double-check what you pasted.";
    if (p === "anthropic" && !k.startsWith("sk-ant-")) return "Anthropic keys start with \"sk-ant-\". Double-check what you pasted.";
    if (p === "grok" && !k.startsWith("xai-")) return "Grok keys start with \"xai-\". Double-check what you pasted.";
    if (p === "google" && k.startsWith("sk-")) return "That looks like an OpenAI key. Switch the dropdown to OpenAI, or get a Google key from aistudio.google.com.";
    return null;
  };

  const saveApiKey = async () => {
    const trimmedKey = apiKey.trim();

    // Client-side validation first (instant feedback)
    const localErr = validateKeyLocally(provider, trimmedKey);
    if (localErr) {
      setSetupError(localErr);
      return;
    }

    setSetupError("");
    try {
      const res = await fetch("/api/stores/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId, llm_provider: provider, llm_api_key: trimmedKey }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Try again.");
      }
      setHasKey(true);
      setShowSetup(false);
      setApiKey(""); // Clear from memory — it's saved server-side now
    } catch (e: unknown) {
      setSetupError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    }
  };

  const sanitizeHTML = (html: string): string => {
    // Inject <base target="_blank"> so all links open in new tabs, not inside the iframe
    if (!html.includes('<base')) {
      html = html.replace('<head>', '<head><base target="_blank">');
    }
    // Replace any href="/" or href="#..." with safe alternatives
    html = html.replace(/href="\/(?!\/)([^"]*)"/g, 'href="javascript:void(0)"');
    html = html.replace(/href="#([^"]*)"/g, 'href="javascript:void(0)"');
    return html;
  };

  const extractHTML = (content: string): string => {
    let html = "";

    // Try to extract HTML from markdown code blocks (closed fence)
    const htmlBlock = content.match(/```html?\s*\n([\s\S]*?)```/);
    if (htmlBlock) { html = htmlBlock[1].trim(); }

    // Handle unclosed code block — LLMs sometimes don't close the fence
    if (!html) {
      const unclosed = content.match(/```html?\s*\n([\s\S]*)/);
      if (unclosed && unclosed[1].includes("<html")) { html = unclosed[1].trim(); }
    }

    // Find <!DOCTYPE or <html anywhere in the content
    if (!html) {
      const docIdx = content.indexOf("<!DOCTYPE");
      const htmlIdx = content.indexOf("<html");
      const startIdx = docIdx >= 0 ? docIdx : htmlIdx;
      if (startIdx >= 0) { html = content.substring(startIdx).trim(); }
    }

    // Sanitize before returning
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
      const res = await fetch("/api/llm/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId, messages: newMessages }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "LLM call failed");
      }

      const data = await res.json();
      const assistantMsg: Message = { role: "assistant", content: data.content };
      const updatedMessages = [...newMessages, assistantMsg];
      setMessages(updatedMessages);

      // Extract and preview HTML
      const html = extractHTML(data.content);
      if (html) {
        setPreview(html);
        setPublished(true);
        setSaveMsg("✅ Published!");
        setTimeout(() => setSaveMsg(""), 3000);

        // Auto-publish: save content + chat history together
        fetch("/api/stores/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ store_id: storeId, store_content: html, chat_history: updatedMessages }),
        });
      } else {
        // Save chat history only (conversational response, no HTML)
        fetch("/api/stores/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ store_id: storeId, chat_history: updatedMessages }),
        });
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "Something went wrong. Try again.";
      setMessages([...newMessages, { role: "assistant", content: `❌ ${errMsg}` }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handlePublish = async () => {
    if (!preview) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/stores/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId, store_content: preview }),
      });
      if (!res.ok) throw new Error("Failed to publish");
      setPublished(true);
      setSaveMsg("✅ Published! Visitors can see your store now.");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch {
      setSaveMsg("❌ Failed to publish");
    } finally {
      setSaving(false);
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

  // LLM Setup screen
  if (showSetup) {
    return (
      <main className="max-w-md mx-auto px-6 py-16">
        <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>
            Connect Your AI
          </h2>
          <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
            Bring your own LLM to build {storeName}. Your key stays between you and your provider.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none cursor-pointer"
                style={inputStyle}
              >
                <option value="google">Google AI (Gemini Flash) — free tier</option>
                <option value="openai">OpenAI (GPT-6 Luna)</option>
                <option value="anthropic">Anthropic (Claude Haiku)</option>
                <option value="grok">xAI (Grok)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === "openai" ? "sk-..." : provider === "anthropic" ? "sk-ant-..." : provider === "grok" ? "xai-..." : "AI..."}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                {getKeyHint(provider)}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Your key stays between you and your provider. We encrypt it and never share it.
              </p>
            </div>

            {setupError && (
              <p className="text-sm text-center" style={{ color: "#E85D27" }}>{setupError}</p>
            )}

            <button
              onClick={saveApiKey}
              className="w-full py-3 rounded-lg text-sm font-semibold border-none cursor-pointer"
              style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
            >
              Connect & Start Building
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Builder view: preview + chat
  return (
    <main className="flex flex-col" style={{ height: "calc(100vh - 56px)" }}>
      {/* Publish bar — shows when there's unpublished content */}
      {preview && !published && (
        <div
          className="px-4 py-3 flex items-center justify-between"
          style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
        >
          <p className="text-sm font-semibold">
            🚀 Your store is ready to go live!
          </p>
          <button
            onClick={handlePublish}
            disabled={saving}
            className="px-5 py-2 rounded-lg text-sm font-bold border-none cursor-pointer"
            style={{ background: "var(--bg-card)", color: "var(--text)" }}
          >
            {saving ? "Publishing..." : "Publish Now"}
          </button>
        </div>
      )}
      {published && saveMsg && (
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
        {/* Preview header */}
        <div
          className="px-4 py-2 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}
        >
          <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            Live Preview
          </p>
        </div>

        {/* Preview content */}
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
                  Start chatting with your AI to build it
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
          className="px-4 py-3 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text)" }}>
              🏗️ {storeName}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Talk to your AI — build your store
            </p>
          </div>
          <button
            onClick={() => setShowSetup(true)}
            className="text-xs px-2 py-1 rounded border-none cursor-pointer"
            style={{ background: "var(--bg)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            ⚙️
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">🏗️</p>
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                Start building
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Tell your AI what you want. Try: &quot;Build me a landing page for {storeName}&quot;
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
                    ? "✅ Generated your store page — check the preview ←"
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
              Building...
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
              placeholder="Tell your AI what to build..."
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
