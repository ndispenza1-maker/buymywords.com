"use client";

import { useState, useEffect } from "react";

interface Profile {
  id: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  cover_url: string | null;
  follower_count: number;
  following_count: number;
  is_following: boolean;
  is_self: boolean;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  like_count: number;
  comment_count: number;
  liked: boolean;
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function ProfileClient({ userId, currentUserId }: { userId: string; currentUserId: string | null }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState("");
  const [showGate, setShowGate] = useState(false);
  const isGuest = !currentUserId;

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setProfile(data.profile);
        setPosts(data.posts);
      })
      .catch(() => setError("User not found"));
  }, [userId]);

  const toggleFollow = async () => {
    if (!profile) return;
    if (isGuest) { setShowGate(true); return; }
    const res = await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: profile.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setProfile((p) =>
        p ? { ...p, is_following: data.following, follower_count: p.follower_count + (data.following ? 1 : -1) } : p
      );
    }
  };

  if (error) return <div className="max-w-2xl mx-auto px-4 pt-12 text-center"><p style={{ color: "var(--text-muted)" }}>{error}</p></div>;
  if (!profile) return <div className="max-w-2xl mx-auto px-4 pt-12 text-center"><p style={{ color: "var(--text-muted)" }}>Loading...</p></div>;

  const GateModal = showGate ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(45,36,36,0.6)", backdropFilter: "blur(4px)" }}
      onClick={() => setShowGate(false)}
    >
      <div
        className="rounded-2xl p-6 max-w-sm w-full text-center"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>Join The Mall</h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>Create a profile to follow people and engage.</p>
        <div className="space-y-3">
          <a href="/signup" className="block text-center py-3 rounded-full font-semibold no-underline text-sm" style={{ background: "var(--accent)", color: "var(--text-inverse)" }}>Create Profile</a>
          <a href="/login" className="block text-center py-3 rounded-full font-semibold no-underline text-sm" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>Already have one? Log in</a>
        </div>
        <button onClick={() => setShowGate(false)} className="mt-4 text-xs bg-transparent border-none cursor-pointer" style={{ color: "var(--text-muted)" }}>Just browsing</button>
      </div>
    </div>
  ) : null;

  return (
    <div className="max-w-2xl mx-auto">
      {GateModal}
      {/* Cover */}
      <div
        className="h-48 md:h-56"
        style={{
          background: profile.cover_url
            ? `url(${profile.cover_url}) center/cover`
            : "linear-gradient(135deg, var(--sunset-dusk), var(--sunset-warm), var(--sunset-peach))",
        }}
      />

      {/* Profile info */}
      <div className="px-4 pb-4" style={{ background: "var(--bg-card)" }}>
        <div className="flex items-end justify-between -mt-12 mb-4">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold"
            style={{
              background: profile.avatar_url
                ? `url(${profile.avatar_url}) center/cover`
                : "var(--sunset-warm)",
              color: "var(--text-inverse)",
              border: "4px solid var(--bg-card)",
            }}
          >
            {!profile.avatar_url && profile.display_name[0]?.toUpperCase()}
          </div>

          {!profile.is_self && (
            <button
              onClick={toggleFollow}
              className="px-6 py-2 rounded-full text-sm font-semibold border-none cursor-pointer mt-14"
              style={{
                background: profile.is_following ? "var(--bg)" : "var(--accent)",
                color: profile.is_following ? "var(--text)" : "var(--text-inverse)",
                border: profile.is_following ? "1px solid var(--border)" : "none",
              }}
            >
              {profile.is_following ? "Following" : "Follow"}
            </button>
          )}
        </div>

        <h1 className="text-xl font-bold">{profile.display_name}</h1>
        {profile.bio && <p className="text-sm mt-2">{profile.bio}</p>}

        <div className="flex gap-4 mt-3 text-sm">
          <span>
            <strong>{profile.following_count}</strong>{" "}
            <span style={{ color: "var(--text-muted)" }}>following</span>
          </span>
          <span>
            <strong>{profile.follower_count}</strong>{" "}
            <span style={{ color: "var(--text-muted)" }}>followers</span>
          </span>
        </div>
      </div>

      {/* Posts */}
      <div className="px-4 mt-4">
        {posts.length === 0 ? (
          <p className="text-center text-sm py-8" style={{ color: "var(--text-muted)" }}>No posts yet.</p>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="rounded-xl p-4 mb-3"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{timeAgo(post.created_at)}</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
              <div className="flex gap-4 mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
                <span>{post.liked ? "♥" : "♡"} {post.like_count}</span>
                <span>💬 {post.comment_count}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
