"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

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

function PostCard({ post, onLike }: { post: Post; onLike: (id: string) => void }) {
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
        <Link href={`/profile/${post.user_id}`}>
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
        </Link>
        <div>
          <Link href={`/profile/${post.user_id}`} className="no-underline">
            <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>
              {post.display_name}
            </span>
          </Link>
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
          onClick={() => onLike(post.id)}
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
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 rounded-lg text-xs outline-none"
              style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
            />
            <button
              onClick={submitComment}
              className="px-3 py-2 rounded-lg text-xs font-semibold border-none cursor-pointer"
              style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FeedClient({ currentUserId }: { currentUserId: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);

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
      {/* Composer */}
      <div
        className="rounded-xl p-4 mb-4"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="What's on your mind?"
          rows={3}
          className="w-full resize-none text-sm outline-none p-2 rounded-lg"
          style={{
            border: "1px solid var(--border)",
            background: "var(--bg)",
            fontFamily: "inherit",
          }}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={createPost}
            disabled={!newPost.trim() || posting}
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
            Nothing here yet. Be the first to post.
          </p>
        </div>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} onLike={toggleLike} />)
      )}
    </div>
  );
}
