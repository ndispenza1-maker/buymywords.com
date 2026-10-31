"use client";

import { useState, useEffect, useCallback } from "react";
import ProfileCard from "@/components/ProfileCard";

interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  display_name: string;
  avatar_url: string | null;
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

/* ── Auth gate modal ── */
function AuthGate({ onClose, hasAccount }: { onClose: () => void; hasAccount: boolean }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(45,36,36,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-6 max-w-sm w-full text-center"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {hasAccount ? (
          /* Logged in but profile not built */
          <>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>
              Build Your Profile
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              You need a profile to like, comment, post, and connect with people.
            </p>
            <a
              href="/build-profile"
              className="block text-center py-3 rounded-full font-semibold no-underline text-sm"
              style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
            >
              🔨 Build Profile
            </a>
          </>
        ) : (
          /* Not logged in at all */
          <>
            <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>
              Join The Mall
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              Create an account to like, comment, post, and connect with people.
            </p>
            <div className="space-y-3">
              <a
                href="/signup"
                className="block text-center py-3 rounded-full font-semibold no-underline text-sm"
                style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
              >
                Sign Up
              </a>
              <a
                href="/login"
                className="block text-center py-3 rounded-full font-semibold no-underline text-sm"
                style={{ background: "var(--accent-light)", color: "var(--accent)" }}
              >
                Already have one? Log in
              </a>
            </div>
          </>
        )}
        <button
          onClick={onClose}
          className="mt-4 text-xs bg-transparent border-none cursor-pointer"
          style={{ color: "var(--text-muted)" }}
        >
          Just browsing
        </button>
      </div>
    </div>
  );
}

/* ── Post card ── */
function PostCard({
  post,
  onLike,
  onGate,
  onProfile,
  isGuest,
}: {
  post: Post;
  onLike: (id: string) => void;
  onGate: () => void;
  onProfile: (userId: string) => void;
  isGuest: boolean;
}) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<
    { id: string; content: string; display_name: string; avatar_url: string | null; created_at: string }[]
  >([]);
  const [newComment, setNewComment] = useState("");

  const loadComments = async () => {
    const res = await fetch(`/api/posts/${post.id}/comments`);
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments);
    }
  };

  const submitComment = async () => {
    if (isGuest) { onGate(); return; }
    if (!newComment.trim()) return;
    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment }),
    });
    if (res.ok) {
      const data = await res.json();
      setComments((c) => [...c, data.comment]);
      setNewComment("");
    }
  };

  return (
    <div
      className="rounded-xl p-4 mb-3"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
    >
      {/* Author */}
      <div className="flex items-center gap-3 mb-3">
        <button onClick={() => onProfile(post.user_id)} className="bg-transparent border-none cursor-pointer p-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
            style={{
              background: post.avatar_url
                ? `url(${post.avatar_url}) center/cover`
                : "var(--sunset-warm)",
              color: "var(--text-inverse)",
            }}
          >
            {!post.avatar_url && post.display_name[0]?.toUpperCase()}
          </div>
        </button>
        <div>
          <button onClick={() => onProfile(post.user_id)} className="bg-transparent border-none cursor-pointer p-0">
            <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>
              {post.display_name}
            </span>
          </button>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {timeAgo(post.created_at)}
          </p>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap">{post.content}</p>

      {post.image_url && (
        <img
          src={post.image_url}
          alt=""
          className="rounded-lg w-full mb-3"
          style={{ maxHeight: 400, objectFit: "cover" }}
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 text-xs" style={{ color: "var(--text-muted)" }}>
        <button
          onClick={() => (isGuest ? onGate() : onLike(post.id))}
          className="flex items-center gap-1 hover:opacity-80 bg-transparent border-none cursor-pointer"
          style={{ color: post.liked ? "var(--sunset-warm)" : "var(--text-muted)" }}
        >
          {post.liked ? "♥" : "♡"} {post.like_count}
        </button>
        <button
          onClick={() => {
            setShowComments(!showComments);
            if (!showComments && comments.length === 0) loadComments();
          }}
          className="flex items-center gap-1 hover:opacity-80 bg-transparent border-none cursor-pointer"
          style={{ color: "var(--text-muted)" }}
        >
          💬 {post.comment_count}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2 mb-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                style={{
                  background: c.avatar_url
                    ? `url(${c.avatar_url}) center/cover`
                    : "var(--sunset-rose)",
                  color: "var(--text-inverse)",
                }}
              >
                {!c.avatar_url && c.display_name[0]?.toUpperCase()}
              </div>
              <div>
                <span className="text-xs font-semibold">{c.display_name}</span>{" "}
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  · {timeAgo(c.created_at)}
                </span>
                <p className="text-xs mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
              placeholder={isGuest ? "Create a profile to comment..." : "Write a comment..."}
              className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
              style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
              onFocus={() => { if (isGuest) onGate(); }}
            />
            {!isGuest && (
              <button
                onClick={submitComment}
                className="px-3 py-2 rounded-lg text-xs font-semibold border-none cursor-pointer"
                style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
              >
                Post
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Feed ── */
export default function FeedClient({
  currentUserId,
  profileComplete,
}: {
  currentUserId: string | null;
  profileComplete: boolean;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [profileCardUserId, setProfileCardUserId] = useState<string | null>(null);

  // Can't engage if not logged in OR logged in but profile not built
  const canEngage = !!currentUserId && profileComplete;
  const hasAccount = !!currentUserId;
  const isGuest = !canEngage;

  const loadPosts = useCallback(async () => {
    const res = await fetch("/api/posts");
    if (res.ok) {
      const data = await res.json();
      setPosts(data.posts);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const createPost = async () => {
    if (isGuest) { setShowGate(true); return; }
    if (!newPost.trim() || posting) return;
    setPosting(true);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newPost }),
    });
    if (res.ok) {
      const data = await res.json();
      setPosts((p) => [data.post, ...p]);
      setNewPost("");
    }
    setPosting(false);
  };

  const toggleLike = async (postId: string) => {
    const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setPosts((p) =>
        p.map((post) =>
          post.id === postId
            ? { ...post, liked: data.liked, like_count: post.like_count + (data.liked ? 1 : -1) }
            : post
        )
      );
    }
  };

  return (
    <div>
      {showGate && <AuthGate onClose={() => setShowGate(false)} hasAccount={hasAccount} />}

      {profileCardUserId && (
        <ProfileCard
          userId={profileCardUserId}
          currentUserId={currentUserId}
          profileComplete={profileComplete}
          onClose={() => setProfileCardUserId(null)}
        />
      )}

      {/* Composer */}
      <div
        className="rounded-xl p-4 mb-4"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder={isGuest ? "Create a profile to post..." : "What's on your mind?"}
          rows={3}
          className="w-full resize-none text-sm outline-none p-2 rounded-lg"
          style={{
            border: "1px solid var(--border)",
            background: "var(--bg)",
            fontFamily: "inherit",
          }}
          onFocus={() => { if (isGuest) setShowGate(true); }}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={createPost}
            disabled={!isGuest && (!newPost.trim() || posting)}
            className="px-6 py-2 rounded-full text-sm font-semibold border-none cursor-pointer disabled:opacity-40"
            style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
          >
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Nothing here yet. {isGuest ? "Check back soon." : "Be the first to post."}
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={toggleLike}
            onGate={() => setShowGate(true)}
            onProfile={(id) => setProfileCardUserId(id)}
            isGuest={isGuest}
          />
        ))
      )}
    </div>
  );
}
