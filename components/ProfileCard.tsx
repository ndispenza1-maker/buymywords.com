"use client";

import { useState, useRef } from "react";
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
  const fileRef = useRef<HTMLInputElement>(null);
  const { openWizard } = useWizard();

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

  const avatarBg = (url: string | null, name: string, isSelf: boolean) => {
    if (url) return { backgroundImage: `url(${url})`, backgroundSize: "cover", backgroundPosition: "center" };
    return { background: isSelf && !profileComplete ? "#999" : "var(--sunset-warm)" };
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(45,36,36,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl w-full max-w-sm overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{error}</p>
          </div>
        ) : profile ? (
          <>
            {/* Cover gradient */}
            <div
              className="h-24"
              style={{
                background:
                  "linear-gradient(135deg, var(--sunset-dusk), var(--sunset-warm), var(--sunset-peach))",
              }}
            />

            {/* Avatar */}
            <div className="px-5 -mt-10">
              <div className="relative inline-block">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold"
                  style={{
                    ...avatarBg(profile.avatar_url, profile.display_name, profile.is_self),
                    color: "var(--text-inverse)",
                    border: "4px solid var(--bg-card)",
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
                      className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer text-xs"
                      style={{
                        background: "var(--accent)",
                        color: "var(--text-inverse)",
                        border: "2px solid var(--bg-card)",
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
            </div>

            {/* Info */}
            <div className="px-5 pt-3 pb-5">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
                  {profile.display_name}
                </h2>
                {profile.account_type && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      background:
                        profile.account_type === "store_owner"
                          ? "var(--accent-light)"
                          : "var(--bg)",
                      color:
                        profile.account_type === "store_owner"
                          ? "var(--accent)"
                          : "var(--text-muted)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {profile.account_type === "store_owner" ? "🏪 Store" : "🛍️ Shopper"}
                  </span>
                )}
              </div>

              {profile.bio && (
                <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-muted)" }}>
                  {profile.bio}
                </p>
              )}

              <div className="flex gap-4 text-sm mb-4">
                <span>
                  <strong>{profile.following_count}</strong>{" "}
                  <span style={{ color: "var(--text-muted)" }}>following</span>
                </span>
                <span>
                  <strong>{profile.follower_count}</strong>{" "}
                  <span style={{ color: "var(--text-muted)" }}>followers</span>
                </span>
                {profile.is_self && profile.account_type === "store_owner" && !profile.store_built && (
                  <button
                    onClick={() => { onClose(); openWizard(); }}
                    className="border-none bg-transparent cursor-pointer p-0"
                    style={{ color: "var(--accent)", font: "inherit", fontSize: "inherit" }}
                  >
                    Get Started
                  </button>
                )}
                {profile.account_type === "store_owner" && profile.store_built && (
                  <a
                    href={profile.store_external_url || `/store/${profile.id}`}
                    target={profile.store_external_url ? "_blank" : undefined}
                    rel={profile.store_external_url ? "noopener noreferrer" : undefined}
                    className="no-underline"
                    style={{ color: "var(--accent)", font: "inherit", fontSize: "inherit" }}
                  >
                    Visit Project
                  </a>
                )}
              </div>

              {/* Action buttons */}
              {profile.is_self ? (
                <div className="space-y-2">
                  {!profileComplete && (
                    <a
                      href="/build-profile"
                      className="block text-center py-2 rounded-full text-sm font-semibold no-underline"
                      style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
                    >
                      🔨 Build Profile
                    </a>
                  )}
                </div>
              ) : currentUserId && profileComplete ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleFollow}
                    className="flex-1 py-2 rounded-full text-sm font-semibold border-none cursor-pointer"
                    style={{
                      background: profile.is_following ? "var(--bg)" : "var(--accent)",
                      color: profile.is_following ? "var(--text)" : "var(--text-inverse)",
                      border: profile.is_following ? "1px solid var(--border)" : "none",
                    }}
                  >
                    {profile.is_following ? "Following" : "Follow"}
                  </button>
                  <button
                    className="px-4 py-2 rounded-full text-sm font-semibold border-none cursor-pointer"
                    style={{
                      background: "var(--bg)",
                      color: "var(--text)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    Message
                  </button>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
