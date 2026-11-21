"use client";

import { useState, useRef, useEffect, useCallback } from "react";

function toHttpsUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

/* ── Types ────────────────────────────────────────────── */

type ImageAttachment = {
  file: File;
  preview: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  images?: string[];
};

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

/* ── Component ────────────────────────────────────────── */

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
  const [pendingImages, setPendingImages] = useState<ImageAttachment[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // For connected projects, show a different view
  if (storeType === "existing" && toHttpsUrl(externalUrl)) {
    const safeExternalUrl = toHttpsUrl(externalUrl)!;
    return (
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>{storeName}</h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Connected project</p>
          <a
            href={safeExternalUrl}
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

  /* ── Scroll & greeting ──────────────────────────────── */

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (panelOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setHasUnread(false);
    }
  }, [panelOpen]);

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
        if (!panelOpen) setHasUnread(true);
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
      if (!panelOpen) setHasUnread(true);
    } finally {
      setLoading(false);
    }
  };

  /* ── HTML helpers ───────────────────────────────────── */

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
      if (closeIdx >= 0) { html = html.substring(0, closeIdx + "</html>".length); }
    }
    return html ? sanitizeHTML(html) : "";
  };

  /* ── Image helpers ──────────────────────────────────── */

  const addImages = useCallback(
    (files: File[]) => {
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length === 0) return;
      const slots = 4 - pendingImages.length;
      const toAdd = imageFiles.slice(0, Math.max(0, slots));
      const newAttachments: ImageAttachment[] = toAdd.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setPendingImages((prev) => [...prev, ...newAttachments]);
    },
    [pendingImages.length]
  );

  const removeImage = (idx: number) => {
    setPendingImages((prev) => {
      const removed = prev[idx];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      pendingImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadImage = async (file: File): Promise<string | null> => {
    const form = new FormData();
    form.append("file", file);
    form.append("store_id", storeId);
    try {
      const res = await fetch("/api/upload/store-image", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("Image upload failed:", data.error);
        return null;
      }
      const data = await res.json();
      return data.url as string;
    } catch (err) {
      console.error("Image upload error:", err);
      return null;
    }
  };

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        addImages(files);
      }
    },
    [addImages]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files: File[] = [];
      if (e.dataTransfer.files) {
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          files.push(e.dataTransfer.files[i]);
        }
      }
      addImages(files);
    },
    [addImages]
  );

  /* ── Send message ───────────────────────────────────── */

  const sendMessage = async () => {
    const text = input.trim();
    if ((!text && pendingImages.length === 0) || loading) return;

    setLoading(true);

    const uploadedUrls: string[] = [];
    for (const img of pendingImages) {
      const url = await uploadImage(img.file);
      if (url) uploadedUrls.push(url);
    }
    pendingImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setPendingImages([]);

    const userMsg: Message = {
      role: "user",
      content: text || (uploadedUrls.length > 0 ? "Here's an image for my store page." : ""),
      ...(uploadedUrls.length > 0 && { images: uploadedUrls }),
    };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");

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

      if (data.hasHTML) {
        if (data.truncated) {
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

  /* ── Render ─────────────────────────────────────────── */

  return (
    <main className="flex flex-col relative" style={{ height: "calc(100vh - 56px)" }}>
      {/* Save notification bar */}
      {saveMsg && (
        <div
          className="px-4 py-2 text-center text-sm font-semibold"
          style={{ background: "var(--bg-card)", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}
        >
          {saveMsg}
        </div>
      )}

      {/* Full-width preview */}
      <div className="flex-1 flex flex-col" style={{ background: "var(--bg)" }}>
        <div
          className="px-4 py-2 flex items-center justify-between shrink-0"
          style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}
        >
          <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            Live Preview — {storeName}
          </p>
        </div>

        <div className="flex-1">
          {preview ? (
            <iframe
              srcDoc={preview}
              sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
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
                  Click the ✨ button to open your assistant →
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Floating assistant toggle button ── */}
      {!panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 90,
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            background: "linear-gradient(135deg, var(--accent), var(--sunset-warm))",
            color: "var(--text-inverse)",
            fontSize: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow = "0 6px 28px rgba(0,0,0,0.35)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.25)";
          }}
          title="Open Mall Assistant"
        >
          ✨
          {/* Unread dot */}
          {hasUnread && (
            <span
              style={{
                position: "absolute",
                top: 2,
                right: 2,
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#e53e3e",
                border: "2px solid var(--bg-card)",
              }}
            />
          )}
        </button>
      )}

      {/* ── Slide-in assistant panel ── */}
      {/* Backdrop */}
      {panelOpen && (
        <div
          onClick={() => setPanelOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 95,
            background: "rgba(0,0,0,0.3)",
            transition: "opacity 0.3s",
          }}
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(420px, 90vw)",
          zIndex: 100,
          background: "var(--bg-card)",
          borderLeft: "1px solid var(--border)",
          boxShadow: panelOpen ? "-8px 0 30px rgba(0,0,0,0.2)" : "none",
          transform: panelOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {dragOver && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 50,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                background: "var(--bg-card)",
                borderRadius: 16,
                padding: "24px 36px",
                border: "3px dashed var(--accent)",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 28, margin: 0 }}>🖼️</p>
              <p style={{ color: "var(--text)", fontWeight: 600, marginTop: 6, fontSize: 13 }}>
                Drop image here
              </p>
            </div>
          </div>
        )}

        {/* Chat header */}
        <div
          className="px-4 py-3 flex items-center justify-between shrink-0"
          style={{
            borderBottom: "1px solid var(--border)",
            background: "linear-gradient(135deg, var(--accent), var(--sunset-warm))",
          }}
        >
          <div className="flex items-center gap-2">
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
          <button
            onClick={() => setPanelOpen(false)}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              color: "var(--text-inverse)",
            }}
            title="Close assistant"
          >
            ✕
          </button>
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
              {/* Attached images */}
              {msg.images && msg.images.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {msg.images.map((url, j) => (
                    <img
                      key={j}
                      src={url}
                      alt="Attached"
                      style={{
                        maxWidth: 120,
                        maxHeight: 90,
                        borderRadius: 6,
                        objectFit: "cover",
                        border: "2px solid rgba(255,255,255,0.3)",
                      }}
                    />
                  ))}
                </div>
              )}
              {msg.role === "assistant" ? (
                <div className="text-xs leading-relaxed whitespace-pre-wrap">
                  {msg.content.includes("<!DOCTYPE") || msg.content.includes("```html")
                    ? "✅ Built your store page — check the preview!"
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

        {/* Pending image previews */}
        {pendingImages.length > 0 && (
          <div
            className="flex gap-2 px-3 py-2 overflow-x-auto shrink-0"
            style={{ borderTop: "1px solid var(--border)", background: "var(--bg)" }}
          >
            {pendingImages.map((img, i) => (
              <div key={i} className="relative shrink-0">
                <img
                  src={img.preview}
                  alt="Pending upload"
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 6,
                    objectFit: "cover",
                    border: "2px solid var(--border)",
                  }}
                />
                <button
                  onClick={() => removeImage(i)}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#e53e3e",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 11,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                  }}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  addImages(Array.from(e.target.files));
                  e.target.value = "";
                }
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="shrink-0 rounded-lg cursor-pointer disabled:opacity-40"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                color: "var(--text-muted)",
              }}
              title="Attach image (or paste / drag-drop)"
            >
              📎
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={
                pendingImages.length > 0
                  ? "Tell me where to put the image..."
                  : "Tell me what to build..."
              }
              rows={2}
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none resize-none"
              style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || (!input.trim() && pendingImages.length === 0)}
              className="px-3 rounded-lg border-none cursor-pointer disabled:opacity-40 self-end"
              style={{ background: "var(--accent)", color: "var(--text-inverse)", height: "36px" }}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
