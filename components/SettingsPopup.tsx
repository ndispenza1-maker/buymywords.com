"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface SettingsProps {
  onClose: () => void;
  accountType: string | null;
  subscriptionStatus: string | null;
  subscriptionTier: string | null;
  userId: string;
  avatarUrl: string | null;
  bio: string | null;
  displayName: string;
}

// ── ID Card Editor Tab ──
function IDCardPanel({
  userId,
  avatarUrl: initialAvatar,
  bio: initialBio,
  displayName: initialName,
}: {
  userId: string;
  avatarUrl: string | null;
  bio: string | null;
  displayName: string;
}) {
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio || "");
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [dirtyBio, setDirtyBio] = useState(false);
  const [dirtyName, setDirtyName] = useState(false);
  const [canChangeName, setCanChangeName] = useState(true);
  const [nameChangeDaysLeft, setNameChangeDaysLeft] = useState(0);
  const [loadingNameStatus, setLoadingNameStatus] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load name change eligibility on mount
  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.json())
      .then(data => {
        setCanChangeName(data.canChangeName);
        setNameChangeDaysLeft(data.nameChangeDaysLeft || 0);
      })
      .catch(() => {})
      .finally(() => setLoadingNameStatus(false));
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSaveMsg("❌ File must be an image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSaveMsg("❌ Image must be under 5 MB");
      return;
    }

    setUploading(true);
    setSaveMsg("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/avatar", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setAvatarUrl(data.avatar_url);
        setSaveMsg("✅ Photo updated!");
        setTimeout(() => setSaveMsg(""), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveMsg(`❌ ${data.error || "Upload failed"}`);
      }
    } catch {
      setSaveMsg("❌ Upload failed");
    }
    setUploading(false);
    // Clear file input so same file can be re-selected
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg("");

    const payload: Record<string, string> = {};
    if (dirtyBio) payload.bio = bio.trim();
    if (dirtyName && name.trim() !== initialName) payload.display_name = name.trim();

    if (Object.keys(payload).length === 0) {
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setSaveMsg("✅ Saved!");
        setDirtyBio(false);
        setDirtyName(false);
        // If name was changed, update cooldown state
        if (data.updated?.includes("display_name")) {
          setCanChangeName(false);
          setNameChangeDaysLeft(180);
        }
        setTimeout(() => setSaveMsg(""), 3000);
      } else {
        const data = await res.json().catch(() => ({}));
        setSaveMsg(`❌ ${data.error || "Save failed"}`);
      }
    } catch {
      setSaveMsg("❌ Save failed");
    }
    setSaving(false);
  };

  const isDirty = dirtyBio || (dirtyName && name.trim() !== initialName);

  return (
    <div className="space-y-5">
      {/* ── ID Card Preview ── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--sunset-night, #1a1412)" }}
      >
        {/* Mini mall header */}
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--sunset-warm)" }} />
            <p className="text-[8px] font-bold tracking-[0.2em] uppercase" style={{ color: "var(--sunset-mauve, #c4b5a5)" }}>
              The Mall
            </p>
          </div>
          <p className="text-[8px] tracking-wider" style={{ color: "var(--sunset-dusk, #6b5e55)" }}>
            MEMBER ID
          </p>
        </div>

        {/* Card body */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold shrink-0"
              style={{
                background: avatarUrl
                  ? `url(${avatarUrl}) center/cover`
                  : "linear-gradient(135deg, var(--sunset-warm), var(--sunset-peach))",
                color: "var(--text-inverse, #fff)",
                border: "2px solid var(--sunset-dusk, #6b5e55)",
              }}
            >
              {!avatarUrl && (name.trim() || initialName)[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: "#fff" }}>
                {name.trim() || initialName}
              </p>
              <p className="text-[10px]" style={{ color: "var(--sunset-mauve, #c4b5a5)" }}>
                {bio.trim() || "No about yet"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Photo Upload ── */}
      <div>
        <label className="block text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
          Photo
        </label>
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold shrink-0"
            style={{
              background: avatarUrl
                ? `url(${avatarUrl}) center/cover`
                : "linear-gradient(135deg, var(--sunset-warm), var(--sunset-peach))",
              color: "var(--text-inverse)",
              border: "2px solid var(--border)",
            }}
          >
            {!avatarUrl && (name.trim() || initialName)[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 rounded-lg text-xs font-semibold border-none cursor-pointer disabled:opacity-50"
              style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
            >
              {uploading ? "Uploading..." : avatarUrl ? "Change Photo" : "Upload Photo"}
            </button>
            <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
              JPG, PNG, or GIF · 5 MB max · Auto-crops to face
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
      </div>

      {/* ── Display Name ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            Name
          </label>
          {!loadingNameStatus && !canChangeName && (
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              🔒 Locked · {nameChangeDaysLeft}d left
            </span>
          )}
          {!loadingNameStatus && canChangeName && (
            <span className="text-[10px]" style={{ color: "#4CAF50" }}>
              ✓ Change available
            </span>
          )}
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setDirtyName(true); }}
          disabled={!canChangeName}
          maxLength={50}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none disabled:opacity-50"
          style={{
            border: "1px solid var(--border)",
            background: canChangeName ? "var(--bg)" : "var(--bg-card)",
          }}
        />
        <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
          {canChangeName
            ? "One free change, then 6 months between changes."
            : `Next change available in ${nameChangeDaysLeft} days.`}
        </p>
      </div>

      {/* ── About / Bio ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            About
          </label>
          <span className="text-[10px]" style={{ color: bio.length > 280 ? "#E85D27" : "var(--text-muted)" }}>
            {bio.length}/300
          </span>
        </div>
        <textarea
          value={bio}
          onChange={(e) => { setBio(e.target.value); setDirtyBio(true); }}
          placeholder="Tell people about yourself..."
          rows={3}
          maxLength={300}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
          style={{
            border: "1px solid var(--border)",
            background: "var(--bg)",
            fontFamily: "inherit",
          }}
        />
      </div>

      {/* ── Save + Status ── */}
      {saveMsg && (
        <p className="text-xs text-center" style={{ color: saveMsg.startsWith("✅") ? "#4CAF50" : "#E85D27" }}>
          {saveMsg}
        </p>
      )}

      {isDirty && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      )}
    </div>
  );
}

// ── Subscription Panel (unchanged) ──
function SubscriptionPanel({ accountType, subscriptionStatus, subscriptionTier }: {
  accountType: string | null;
  subscriptionStatus: string | null;
  subscriptionTier: string | null;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const isActive = subscriptionStatus === "active";
  const isOwner = accountType === "store_owner";

  const currentLabel = (() => {
    if (!isActive && !isOwner) return "Free";
    if (subscriptionTier === "shopper") return "Mall+ · $9.99/mo";
    if (subscriptionTier === "owner_basic") return "Store Owner";
    if (subscriptionTier === "owner_assistant") return "Store Owner · $29.99/mo";
    if (subscriptionTier === "founders") return "Founders Access";
    if (isOwner) return "Store Owner (unpaid)";
    return "Free";
  })();

  const handleCheckout = async (priceId: string) => {
    setLoading(priceId);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price_id: priceId }),
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      }
    } catch {}
    setLoading(null);
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/subscription", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      }
    } catch {}
    setPortalLoading(false);
  };

  return (
    <div>
      {/* Current plan */}
      <div
        className="flex items-center justify-between p-3 rounded-xl mb-4"
        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
      >
        <div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Current Plan</p>
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{currentLabel}</p>
        </div>
        {isActive && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(76,175,80,0.15)", color: "#4CAF50" }}>
            Active
          </span>
        )}
      </div>

      {/* Manage existing */}
      {isActive && subscriptionTier !== "founders" && (
        <button
          onClick={handlePortal}
          disabled={portalLoading}
          className="w-full py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer mb-4 disabled:opacity-50"
          style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
        >
          {portalLoading ? "Loading..." : "Manage Billing / Cancel"}
        </button>
      )}

      {/* Available plans */}
      <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-muted)" }}>
        {isActive ? "Switch Plan" : "Available Plans"}
      </p>

      <div className="space-y-2">
        {accountType === "shopper" && (
          <>
            {subscriptionTier !== "shopper" && (
              <button
                onClick={() => handleCheckout("price_1UXSk22ctK45EjG7uQa1FKw0")}
                disabled={!!loading}
                className="w-full p-3 rounded-xl text-left border-none cursor-pointer transition-all disabled:opacity-50"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>🔓 Mall+</p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Chat, comment, message, follow</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: "var(--accent)" }}>$9.99/mo</p>
                </div>
              </button>
            )}

            <p className="text-[10px] font-semibold mt-4 mb-2" style={{ color: "var(--text-muted)" }}>
              Ready to build?
            </p>
            <button
              onClick={() => handleCheckout("price_1UX2Mh2ctK45EjG7Cd3NbKEA")}
              disabled={!!loading}
              className="w-full p-3 rounded-xl text-left border-none cursor-pointer disabled:opacity-50"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>🔗 Connect Existing</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Link your project to The Mall</p>
                </div>
                <p className="text-sm font-bold" style={{ color: "var(--accent)" }}>$19.99/mo</p>
              </div>
            </button>
            <button
              onClick={() => handleCheckout("price_1UXScd2ctK45EjG7QbTNoaey")}
              disabled={!!loading}
              className="w-full p-3 rounded-xl text-left border-none cursor-pointer disabled:opacity-50"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>🏗️ Start Fresh</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Blank store + AI assistant</p>
                </div>
                <p className="text-sm font-bold" style={{ color: "var(--accent)" }}>$29.99/mo</p>
              </div>
            </button>
          </>
        )}

        {isOwner && (
          <>
            <button
              onClick={() => handleCheckout("price_1UX2Mh2ctK45EjG7Cd3NbKEA")}
              disabled={!!loading}
              className="w-full p-3 rounded-xl text-left border-none cursor-pointer disabled:opacity-50"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Monthly</p>
                <p className="text-sm font-bold" style={{ color: "var(--accent)" }}>$19.99/mo</p>
              </div>
            </button>
            <button
              onClick={() => handleCheckout("price_1UX2OC2ctK45EjG7hBCsExY2")}
              disabled={!!loading}
              className="w-full p-3 rounded-xl text-left border-none cursor-pointer disabled:opacity-50"
              style={{ background: "var(--bg)", border: "2px solid var(--accent)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>6 Months</p>
                  <p className="text-[10px]" style={{ color: "var(--accent)" }}>Save 17%</p>
                </div>
                <p className="text-sm font-bold" style={{ color: "var(--accent)" }}>$99.99</p>
              </div>
            </button>
            <button
              onClick={() => handleCheckout("price_1UX2PM2ctK45EjG7AcZfFxLT")}
              disabled={!!loading}
              className="w-full p-3 rounded-xl text-left border-none cursor-pointer disabled:opacity-50"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Yearly</p>
                  <p className="text-[10px]" style={{ color: "var(--accent)" }}>Best value · $12.50/mo</p>
                </div>
                <p className="text-sm font-bold" style={{ color: "var(--accent)" }}>$149.99</p>
              </div>
            </button>
            <button
              onClick={() => handleCheckout("price_1UXScd2ctK45EjG7QbTNoaey")}
              disabled={!!loading}
              className="w-full p-3 rounded-xl text-left border-none cursor-pointer disabled:opacity-50"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Fresh + Assistant</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>AI builds your store</p>
                </div>
                <p className="text-sm font-bold" style={{ color: "var(--accent)" }}>$29.99/mo</p>
              </div>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Settings Popup ──
export default function SettingsPopup({
  onClose,
  accountType,
  subscriptionStatus,
  subscriptionTier,
  userId,
  avatarUrl,
  bio,
  displayName,
}: SettingsProps) {
  const [tab, setTab] = useState<"idcard" | "general" | "subscription">("idcard");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("mall_theme");
    if (saved === "dark") {
      setDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("mall_theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("mall_theme", "light");
    }
  };

  const tabs: { key: typeof tab; label: string }[] = [
    { key: "idcard", label: "ID Card" },
    { key: "general", label: "General" },
    { key: "subscription", label: "Plan" },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(45,36,36,0.5)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)", maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer text-lg"
            style={{ background: "var(--bg)", color: "var(--text-muted)" }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-5 pt-3 gap-1" style={{ borderBottom: "1px solid var(--border)" }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-3 py-2 text-xs font-semibold border-none cursor-pointer rounded-t-lg"
              style={{
                background: tab === t.key ? "var(--bg)" : "transparent",
                color: tab === t.key ? "var(--text)" : "var(--text-muted)",
                borderBottom: tab === t.key ? "2px solid var(--accent)" : "2px solid transparent",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body — scrollable */}
        <div className="px-5 py-4 overflow-y-auto" style={{ maxHeight: "60vh" }}>
          {tab === "idcard" && (
            <IDCardPanel
              userId={userId}
              avatarUrl={avatarUrl}
              bio={bio}
              displayName={displayName}
            />
          )}

          {tab === "general" && (
            <div className="space-y-4">
              {/* Dark Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Dark Mode</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Easier on the eyes at night</p>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className="w-12 h-7 rounded-full border-none cursor-pointer relative transition-all"
                  style={{ background: darkMode ? "var(--accent)" : "var(--border)" }}
                >
                  <div
                    className="w-5 h-5 rounded-full absolute top-1 transition-all"
                    style={{
                      background: "white",
                      left: darkMode ? "26px" : "4px",
                    }}
                  />
                </button>
              </div>

              {/* Links */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                <a href="/terms" target="_blank" className="block text-sm py-2 no-underline" style={{ color: "var(--text)" }}>
                  📄 Terms of Service
                </a>
                <a href="/privacy" target="_blank" className="block text-sm py-2 no-underline" style={{ color: "var(--text)" }}>
                  🔒 Privacy Policy
                </a>
              </div>
            </div>
          )}

          {tab === "subscription" && (
            <SubscriptionPanel
              accountType={accountType}
              subscriptionStatus={subscriptionStatus}
              subscriptionTier={subscriptionTier}
            />
          )}
        </div>
      </div>
    </div>
  );
}
