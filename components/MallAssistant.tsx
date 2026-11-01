"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type Message = { role: "user" | "assistant"; content: string };

interface MallAssistantProps {
  storeId: string;
  storeName: string;
}

export default function MallAssistant({ storeId, storeName }: MallAssistantProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);
  const didDrag = useRef(false);

  // Set initial position (bottom-right with some padding)
  useEffect(() => {
    setPosition({
      x: window.innerWidth - 400,
      y: window.innerHeight - 560,
    });
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, minimized]);

  // Auto-greet on first open
  useEffect(() => {
    if (open && !greeted) {
      setGreeted(true);
      fetchGreeting();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fetchGreeting = async () => {
    setLoading(true);
    try {
      const greetMsg: Message[] = [{ role: "user", content: "Hi, I just opened my store and I need help getting started." }];
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
      setMessages([{
        role: "assistant",
        content: `Hey! 👋 I'm your Mall Assistant. I'm here to help you set up "${storeName}" — no experience needed. Let's start by getting you connected to a free AI that'll help build your store page. Have you used any AI tools before, or is this brand new for you?`,
      }]);
    } finally {
      setLoading(false);
    }
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
      setMessages([...newMessages, { role: "assistant", content: data.content }]);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : "Something went wrong";
      setMessages([...newMessages, { role: "assistant", content: `Sorry, I hit an issue: ${errMsg}. Try again?` }]);
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

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (widgetRef.current) {
      setIsDragging(true);
      didDrag.current = false;
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
      e.preventDefault();
    }
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      didDrag.current = true;
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 380, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.current.y)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  // Floating bubble when closed
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed z-[300] flex items-center gap-2 px-4 py-3 rounded-full border-none cursor-pointer transition-all"
        style={{
          bottom: "24px",
          right: "24px",
          background: "var(--accent)",
          color: "var(--text-inverse)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <span className="text-lg">✨</span>
        <span className="text-sm font-semibold">Mall Assistant</span>
      </button>
    );
  }

  // Minimized state — small bar
  if (minimized) {
    return (
      <div
        ref={widgetRef}
        className="fixed z-[300] rounded-xl overflow-hidden cursor-move select-none"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: "240px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        }}
      >
        <div
          className="px-3 py-2 flex items-center justify-between"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">✨</span>
            <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>Assistant</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized(false)}
              className="w-6 h-6 rounded flex items-center justify-center border-none cursor-pointer text-xs"
              style={{ background: "transparent", color: "var(--text-muted)" }}
            >
              ↗
            </button>
            <button
              onClick={() => { setOpen(false); setMinimized(false); }}
              className="w-6 h-6 rounded flex items-center justify-center border-none cursor-pointer text-xs"
              style={{ background: "transparent", color: "var(--text-muted)" }}
            >
              ×
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full chat widget
  return (
    <div
      ref={widgetRef}
      className="fixed z-[300] rounded-2xl overflow-hidden flex flex-col"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: "360px",
        height: "480px",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        userSelect: isDragging ? "none" : "auto",
      }}
    >
      {/* Header — draggable */}
      <div
        className="px-4 py-3 flex items-center justify-between cursor-move"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "linear-gradient(135deg, var(--accent), var(--sunset-warm))",
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--text-inverse)" }}>
              Mall Assistant
            </p>
            <p className="text-[10px] opacity-80" style={{ color: "var(--text-inverse)" }}>
              Here to help — drag me around
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer text-sm"
            style={{ background: "rgba(255,255,255,0.2)", color: "var(--text-inverse)" }}
            title="Minimize"
          >
            −
          </button>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer text-sm"
            style={{ background: "rgba(255,255,255,0.2)", color: "var(--text-inverse)" }}
            title="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ background: "var(--bg)" }}>
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

      {/* Input */}
      <div className="px-3 py-2" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            rows={1}
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none resize-none"
            style={{
              border: "1px solid var(--border)",
              background: "var(--bg)",
            }}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-3 rounded-lg border-none cursor-pointer disabled:opacity-40"
            style={{
              background: "var(--accent)",
              color: "var(--text-inverse)",
              height: "36px",
            }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
