"use client";

import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };

interface AssistantWindowProps {
  storeId: string;
  storeName: string;
}

export default function AssistantWindow({ storeId, storeName }: AssistantWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [greeted, setGreeted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Load history or greet on mount
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
    } catch { /* fall through to greeting */ }
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

  return (
    <div
      className="flex flex-col"
      style={{
        height: "100vh",
        width: "100vw",
        background: "var(--bg-card)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between shrink-0"
        style={{
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
              {storeName}
            </p>
          </div>
        </div>
      </div>

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
      <div className="px-3 py-2 shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            rows={2}
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
            className="px-3 rounded-lg border-none cursor-pointer disabled:opacity-40 self-end"
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
