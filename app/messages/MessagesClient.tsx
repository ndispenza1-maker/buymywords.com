"use client";

import { useState, useEffect } from "react";

interface Conversation {
  id: string;
  updated_at: string;
  last_message: string | null;
  other_user: {
    id: string;
    handle: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  handle: string;
  display_name: string;
  created_at: string;
}

export default function MessagesClient({ currentUserId }: { currentUserId: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvo, setActiveConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");

  useEffect(() => {
    fetch("/api/messages")
      .then((r) => r.json())
      .then((d) => setConversations(d.conversations))
      .catch(() => {});

    // Mark messages as read
    fetch("/api/messages/unread", { method: "POST" }).catch(() => {});
  }, []);

  const openConvo = async (id: string) => {
    setActiveConvo(id);
    const res = await fetch(`/api/messages/${id}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages);
    }
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeConvo) return;
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: activeConvo, content: newMsg }),
    });
    if (res.ok) {
      const data = await res.json();
      setMessages((m) => [...m, { ...data.message, handle: "", display_name: "You" }]);
      setNewMsg("");
    }
  };

  return (
    <div
      className="flex rounded-xl overflow-hidden"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        height: "calc(100vh - 120px)",
      }}
    >
      {/* Conversation list */}
      <div
        className="w-72 shrink-0 overflow-y-auto"
        style={{ borderRight: "1px solid var(--border)" }}
      >
        {conversations.length === 0 ? (
          <p className="text-xs text-center py-8" style={{ color: "var(--text-muted)" }}>
            No conversations yet
          </p>
        ) : (
          conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => openConvo(c.id)}
              className="w-full text-left p-3 border-none cursor-pointer flex items-center gap-3"
              style={{
                background: activeConvo === c.id ? "var(--accent-light)" : "transparent",
              }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{
                  background: "var(--sunset-warm)",
                  color: "var(--text-inverse)",
                }}
              >
                {c.other_user?.display_name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">
                  {c.other_user?.display_name || "Unknown"}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                  {c.last_message || "..."}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Active conversation */}
      <div className="flex-1 flex flex-col">
        {!activeConvo ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Select a conversation
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender_id === currentUserId ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className="max-w-xs px-4 py-2 rounded-2xl text-sm"
                    style={{
                      background:
                        m.sender_id === currentUserId ? "var(--accent)" : "var(--bg)",
                      color:
                        m.sender_id === currentUserId ? "var(--text-inverse)" : "var(--text)",
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 flex gap-2" style={{ borderTop: "1px solid var(--border)" }}>
              <input
                type="text"
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 rounded-full text-sm outline-none"
                style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2 rounded-full text-sm font-semibold border-none cursor-pointer"
                style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
