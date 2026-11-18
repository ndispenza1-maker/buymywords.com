"use client";

import { useState, useRef, useEffect, useCallback } from "react";

/* ── Types ────────────────────────────────────────────── */

type ImageAttachment = {
  file: File;
  preview: string; // object URL for thumbnail
  uploading?: boolean;
};

type MessageContent =
  | string
  | { type: "text"; text: string }
  | { type: "image_url"; url: string };

type Message = {
  role: "user" | "assistant";
  content: string;
  /** URLs of images the user attached to this message */
  images?: string[];
};

interface AssistantWindowProps {
  storeId: string;
  storeName: string;
}

/* ── Component ────────────────────────────────────────── */

export default function AssistantWindow({ storeId, storeName }: AssistantWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const [pendingImages, setPendingImages] = useState<ImageAttachment[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Scroll & focus ─────────────────────────────────── */

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* ── Greeting / history ─────────────────────────────── */

  useEffect(() => {
    if (!greeted) {
      setGreeted(true);
      loadOrGreet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadOrGreet = async () => {
    setLoading(true);
    try {
      const histRes = await fetch(`/api/assistant/history?store_id=${storeId}`);
      if (histRes.ok) {
        const histData = await histRes.json();
        if (histData.messages && histData.messages.length > 0) {
          setMessages(histData.messages);
          setLoading(false);
          return;
        }
      }
    } catch {
      /* fall through to greeting */
    }
    fetchGreeting();
  };

  const fetchGreeting = async () => {
    setLoading(true);
    try {
      const greetMsg: Message[] = [
        { role: "user", content: "Hi, I just opened my store and I need help getting started." },
      ];
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId, messages: greetMsg }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages([{ role: "assistant", content: data.content }]);
      }
    } catch {
      setMessages([
        {
          role: "assistant",
          content: `Hey! 👋 I'm your Mall Assistant. I'm here to help you set up "${storeName}" — no experience needed. What do you need help with?`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /* ── Image helpers ──────────────────────────────────── */

  const addImages = useCallback(
    (files: File[]) => {
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length === 0) return;
      // Max 4 pending at a time
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

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
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

  /* ── Paste handler ──────────────────────────────────── */

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

  /* ── Drag & drop ────────────────────────────────────── */

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

    // Upload all pending images first
    setLoading(true);
    const uploadedUrls: string[] = [];
    for (const img of pendingImages) {
      const url = await uploadImage(img.file);
      if (url) uploadedUrls.push(url);
    }
    // Clean up previews
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
      setMessages([...newMessages, { role: "assistant", content: data.content }]);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "Something went wrong";
      setMessages([
        ...newMessages,
        { role: "assistant", content: `Sorry, I hit an issue: ${errMsg}. Try again?` },
      ]);
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
    <div
      className="flex flex-col"
      style={{ height: "100vh", width: "100vw", background: "var(--bg-card)" }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between shrink-0"
        style={{ background: "linear-gradient(135deg, var(--accent), var(--sunset-warm))" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-inverse)" }}>
              Mall Assistant
            </p>
            <p className="text-[10px] opacity-80" style={{ color: "var(--text-inverse)" }}>
              {storeName}
            </p>
          </div>
        </div>
        <button
          onClick={() => window.close()}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full border-none cursor-pointer text-xs font-semibold"
          style={{ background: "rgba(255,255,255,0.2)", color: "var(--text-inverse)" }}
          title="Close and return to store"
        >
          ← Back to Store
        </button>
      </div>

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
              padding: "32px 48px",
              border: "3px dashed var(--accent)",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 32, margin: 0 }}>🖼️</p>
            <p style={{ color: "var(--text)", fontWeight: 600, marginTop: 8 }}>
              Drop image here
            </p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
        style={{ background: "var(--bg)" }}
      >
        {messages.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">✨</p>
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
              background: msg.role === "user" ? "var(--accent)" : "var(--bg-card)",
              color: msg.role === "user" ? "var(--text-inverse)" : "var(--text)",
              border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
            }}
          >
            {/* Show attached images */}
            {msg.images && msg.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {msg.images.map((url, j) => (
                  <img
                    key={j}
                    src={url}
                    alt="Attached"
                    style={{
                      maxWidth: 160,
                      maxHeight: 120,
                      borderRadius: 8,
                      objectFit: "cover",
                      border: msg.role === "user"
                        ? "2px solid rgba(255,255,255,0.3)"
                        : "2px solid var(--border)",
                    }}
                  />
                ))}
              </div>
            )}
            <div className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</div>
          </div>
        ))}

        {loading && (
          <div
            className="text-xs rounded-xl px-3 py-2 mr-4"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
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
          style={{ borderTop: "1px solid var(--border)", background: "var(--bg-card)" }}
        >
          {pendingImages.map((img, i) => (
            <div key={i} className="relative shrink-0">
              <img
                src={img.preview}
                alt="Pending upload"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 8,
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
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#e53e3e",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
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
      <div className="px-3 py-2 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex gap-2 items-end">
          {/* Hidden file input */}
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
          {/* Image upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="shrink-0 rounded-lg border-none cursor-pointer disabled:opacity-40"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
            title="Attach image"
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
                : "Ask me anything..."
            }
            rows={2}
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none resize-none"
            style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || (!input.trim() && pendingImages.length === 0)}
            className="px-3 rounded-lg border-none cursor-pointer disabled:opacity-40"
            style={{
              background: "var(--accent)",
              color: "var(--text-inverse)",
              height: 36,
            }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
