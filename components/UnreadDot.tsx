"use client";

import { useState, useEffect } from "react";

export default function UnreadDot() {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    fetch("/api/messages/unread")
      .then((r) => r.json())
      .then((d) => setHasUnread(d.hasUnread))
      .catch(() => {});

    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetch("/api/messages/unread")
        .then((r) => r.json())
        .then((d) => setHasUnread(d.hasUnread))
        .catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!hasUnread) return null;

  return (
    <span
      className="absolute -top-0.5 -right-1.5 w-2.5 h-2.5 rounded-full"
      style={{
        background: "var(--sunset-warm)",
        border: "2px solid var(--bg-card)",
      }}
    />
  );
}
