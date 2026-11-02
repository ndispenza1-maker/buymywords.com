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
      className="inline-block w-2 h-2 rounded-full shrink-0"
      style={{ background: "var(--sunset-warm)" }}
    />
  );
}
