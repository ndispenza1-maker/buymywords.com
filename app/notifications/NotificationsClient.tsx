"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  actor_handle: string;
  actor_name: string;
  actor_avatar: string | null;
  post_id: string | null;
  read: boolean;
  created_at: string;
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

function notifText(n: Notification) {
  switch (n.type) {
    case "like": return "liked your post";
    case "comment": return "commented on your post";
    case "follow": return "followed you";
    case "message": return "sent you a message";
    default: return "interacted with you";
  }
}

export default function NotificationsClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setNotifications(d.notifications))
      .catch(() => {});
  }, []);

  if (notifications.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
        No notifications yet.
      </p>
    );
  }

  return (
    <div>
      {notifications.map((n) => (
        <div
          key={n.id}
          className="flex items-center gap-3 p-3 rounded-lg mb-1"
          style={{
            background: n.read ? "transparent" : "var(--accent-light)",
          }}
        >
          <Link href={`/${n.actor_handle}`}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                background: n.actor_avatar
                  ? `url(${n.actor_avatar}) center/cover`
                  : "var(--sunset-warm)",
                color: "var(--text-inverse)",
              }}
            >
              {!n.actor_avatar && n.actor_name?.[0]?.toUpperCase()}
            </div>
          </Link>
          <div className="flex-1 text-sm">
            <Link href={`/${n.actor_handle}`} className="font-semibold no-underline" style={{ color: "var(--text)" }}>
              {n.actor_name}
            </Link>{" "}
            {notifText(n)}
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {timeAgo(n.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
