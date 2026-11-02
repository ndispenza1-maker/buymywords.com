"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWizard } from "./WizardContext";

interface ProfileData {
  id: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  account_type: string | null;
  store_built: boolean;
  store_external_url: string | null;
  store_type: string | null;
  follower_count: number;
  following_count: number;
  is_following: boolean;
  is_self: boolean;
  created_at: string;
}

function memberSince(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function ProfileCard({
  userId,
  currentUserId,
  profileComplete,
  onClose,
}: {
  userId: string;
  currentUserId: string | null;
  profileComplete: boolean;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [messageSending, setMessageSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { openWizard } = useWizard();
  const router = useRouter();

  const handleMessage = async () => {
    if (!profile || !currentUserId || messageSending) return;
    setMessageSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to_user_id: profile.id, content: "👋" }),
      });
      if (res.ok) {
        onClose();
        router.push("/messages");
      }
    } catch {}
    setMessageSending(false);
  };

  // Load profile on mount
  useState(() => {
    fetch(`/api/users/${userId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setProfile(data.profile);
        setLoading(false);
      })
      .catch(() => {
        setError("User not found");
        setLoading(false);
      });
  });

  const handleFollow = async () => {
    if (!profile || !currentUserId || !profileComplete) return;
    const res = await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: profile.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setProfile((p) =>
        p
          ? {
              ...p,
              is_following: data.following,
              follower_count: p.follower_count + (data.following ? 1 : -1),
            }
          : p
      );
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload/avatar", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      setProfile((p) => (p ? { ...p, avatar_url: data.avatar_url } : p));
    }
    setUploading(false);
  };

  const typeLabel = (type: string | null) => {
    if (type === "store_owner") return "STORE OWNER";
    return "SHOPPER";
  };

  const typeIcon = (type: string | null) => {
    if (type === "store_owner") return "🏪";
    return "🛍️";
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(45,36,36,0.5)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm overflow-hidden"
        style={{ borderRadius: "20px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div
            className="p-12 text-center"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading...</p>
          </div>
        ) : error ? (
          <div
            className="p-12 text-center"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{error}</p>
          </div>
        ) : profile ? (
          <div style={{ background: "var(--sunset-night)" }}>
            {/* ── Top strip: THE MALL branding ── */}
            <div
              className="px-5 pt-4 pb-2 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: "var(--sunset-warm)" }}
                />
                <p
                  className="text-[10px] font-bold tracking-[0.2em] uppercase"
                  style={{ color: "var(--sunset-mauve)" }}
                >
                  The Mall
                </p>
              </div>
              <p
                className="text-[10px] tracking-wider"
                style={{ color: "var(--sunset-dusk)" }}
              >
                MEMBER ID
              </p>
            </div>

            {/* ── Main card body ── */}
            <div className="px-5 pb-4">
              {/* Avatar + Name row */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative shrink-0">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold"
                    style={{
                      background: profile.avatar_url
                        ? `url(${profile.avatar_url}) center/cover`
                        : "linear-gradient(135deg, var(--sunset-warm), var(--sunset-peach))",
                      color: "var(--text-inverse)",
                      border: "2px solid var(--sunset-dusk)",
                    }}
                  >
                    {!profile.avatar_url && profile.display_name[0]?.toUpperCase()}
                  </div>
                  {/* Upload button — only on own card */}
                  {profile.is_self && profileComplete && (
                    <>
                      <button
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center border-none cursor-pointer text-[10px]"
                        style={{
                          background: "var(--sunset-warm)",
                          color: "var(--text-inverse)",
                          border: "2px solid var(--sunset-night)",
                        }}
                        title="Change photo"
                      >
                        {uploading ? "…" : "📷"}
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h2
                    className="text-lg font-bold truncate"
                    style={{ color: "#FFFFFF" }}
                  >
                    {profile.display_name}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs">{typeIcon(profile.account_type)}</span>
                    <span
                      className="text-[10px] font-semibold tracking-wider"
                      style={{ color: "var(--sunset-warm)" }}
                    >
                      {typeLabel(profile.account_type)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p
                  className="text-xs leading-relaxed mb-4"
                  style={{ color: "var(--sunset-mauve)" }}
                >
                  {profile.bio}
                </p>
              )}

              {/* ── Stats strip ── */}
              <div
                className="flex items-center rounded-xl px-4 py-3 mb-4"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="flex-1 text-center">
                  <p className="text-base font-bold" style={{ color: "#FFFFFF" }}>
                    {profile.following_count}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--sunset-dusk)" }}>
                    Following
                  </p>
                </div>
                <div
                  className="w-px h-8"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                />
                <div className="flex-1 text-center">
                  <p className="text-base font-bold" style={{ color: "#FFFFFF" }}>
                    {profile.follower_count}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--sunset-dusk)" }}>
                    Followers
                  </p>
                </div>
                <div
                  className="w-px h-8"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                />
                <div className="flex-1 text-center">
                  <p className="text-xs font-semibold" style={{ color: "#FFFFFF" }}>
                    {profile.created_at ? memberSince(profile.created_at) : "—"}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--sunset-dusk)" }}>
                    Member
                  </p>
                </div>
              </div>

              {/* ── Store link ── */}
              {profile.account_type === "store_owner" && profile.store_built && (
                <a
                  href={profile.store_external_url || `/store/${profile.id}`}
                  target={profile.store_external_url ? "_blank" : undefined}
                  rel={profile.store_external_url ? "noopener noreferrer" : undefined}
                  className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4 no-underline transition-all"
                  style={{
                    background: "rgba(244,132,95,0.1)",
                    border: "1px solid rgba(244,132,95,0.2)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(244,132,95,0.15)";
                    e.currentTarget.style.borderColor = "rgba(244,132,95,0.35)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(244,132,95,0.1)";
                    e.currentTarget.style.borderColor = "rgba(244,132,95,0.2)";
                  }}
                >
                  <span className="text-sm">🏪</span>
                  <span
                    className="text-xs font-semibold flex-1"
                    style={{ color: "var(--sunset-warm)" }}
                  >
                    Visit Store
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "var(--sunset-dusk)" }}
                  >
                    →
                  </span>
                </a>
              )}

              {/* ── Get Started (own card, store owner, no store yet) ── */}
              {profile.is_self && profile.account_type === "store_owner" && !profile.store_built && (
                <button
                  onClick={() => { onClose(); openWizard(); }}
                  className="w-full flex items-center gap-2 rounded-xl px-4 py-3 mb-4 border-none cursor-pointer transition-all"
                  style={{
                    background: "rgba(244,132,95,0.1)",
                    border: "1px solid rgba(244,132,95,0.2)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(244,132,95,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(244,132,95,0.1)";
                  }}
                >
                  <span className="text-sm">🚀</span>
                  <span
                    className="text-xs font-semibold flex-1 text-left"
                    style={{ color: "var(--sunset-warm)" }}
                  >
                    Get Started — Build Your Store
                  </span>
                  <span className="text-xs" style={{ color: "var(--sunset-dusk)" }}>→</span>
                </button>
              )}

              {/* ── Action buttons ── */}
              {profile.is_self ? (
                !profileComplete && (
                  <a
                    href="/build-profile"
                    className="block text-center py-2.5 rounded-xl text-sm font-semibold no-underline"
                    style={{ background: "var(--sunset-warm)", color: "var(--text-inverse)" }}
                  >
                    🔨 Build Profile
                  </a>
                )
              ) : currentUserId && profileComplete ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleFollow}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer transition-all"
                    style={{
                      background: profile.is_following
                        ? "rgba(255,255,255,0.08)"
                        : "var(--sunset-warm)",
                      color: profile.is_following ? "var(--sunset-mauve)" : "var(--text-inverse)",
                      border: profile.is_following ? "1px solid rgba(255,255,255,0.1)" : "none",
                    }}
                  >
                    {profile.is_following ? "Following" : "Follow"}
                  </button>
                  <button
                    onClick={handleMessage}
                    disabled={messageSending}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer disabled:opacity-50"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      color: "var(--sunset-mauve)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    {messageSending ? "..." : "Message"}
                  </button>
                </div>
              ) : null}
            </div>

            {/* ── Bottom strip ── */}
            <div
              className="px-5 py-2.5 flex items-center justify-between"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p
                className="text-[9px] tracking-wider"
                style={{ color: "var(--sunset-dusk)" }}
              >
                themallofprojects.com
              </p>
              <button
                onClick={onClose}
                className="text-[10px] bg-transparent border-none cursor-pointer"
                style={{ color: "var(--sunset-dusk)" }}
              >
                close ×
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
