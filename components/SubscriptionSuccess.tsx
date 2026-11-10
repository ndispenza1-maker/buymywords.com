"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";

interface PendingStore {
  store_type: string;
  store_name: string;
  store_description: string | null;
  external_url: string | null;
}

/**
 * After Stripe checkout redirect (?subscribed=1):
 * - Reads pending store data from localStorage
 * - If complete (name + URL if existing), creates store immediately
 * - If incomplete, shows a quick form to collect missing info
 * - Shopper or no pending data → clean reload
 */
export default function SubscriptionSuccess() {
  const params = useSearchParams();
  const [pending, setPending] = useState<PendingStore | null>(null);
  const [needsForm, setNeedsForm] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const createStore = useCallback(async (data: PendingStore) => {
    setSaving(true);
    setError("");

    const name = data.store_name?.trim() || "My Store";

    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_name: name,
          store_description: data.store_description || null,
          store_type: data.store_type,
          external_url: data.store_type === "existing" ? data.external_url : null,
        }),
      });

      const respData = await res.json().catch(() => ({}));

      if (res.ok || respData.error === "Store already exists") {
        localStorage.removeItem("mall_pending_store");
        localStorage.removeItem("mall_pending_store_type"); // Clean up legacy key
        setDone(true);
        setTimeout(() => {
          window.history.replaceState({}, "", "/");
          window.location.reload();
        }, 1500);
      } else {
        setError(respData.error || "Something went wrong — try again.");
        setSaving(false);
      }
    } catch {
      setError("Something went wrong — try again.");
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    if (params.get("subscribed") !== "1") return;

    // Try new key first, then legacy key
    let pendingData: PendingStore | null = null;

    const pendingRaw = localStorage.getItem("mall_pending_store");
    if (pendingRaw) {
      try {
        pendingData = JSON.parse(pendingRaw);
      } catch { /* ignore */ }
    }

    // Legacy: old subscribe page saved just the type
    if (!pendingData) {
      const legacyType = localStorage.getItem("mall_pending_store_type");
      if (legacyType) {
        pendingData = {
          store_type: legacyType,
          store_name: "",
          store_description: null,
          external_url: null,
        };
      }
    }

    if (!pendingData?.store_type) {
      // Shopper sub or no pending store — clean reload
      localStorage.removeItem("mall_pending_store");
      localStorage.removeItem("mall_pending_store_type");
      window.history.replaceState({}, "", "/");
      window.location.reload();
      return;
    }

    setPending(pendingData);

    // Check if we have enough data to create immediately
    const hasName = !!pendingData.store_name?.trim();
    const needsUrl = pendingData.store_type === "existing" && !pendingData.external_url?.trim();

    if (hasName && !needsUrl) {
      // Complete data — create immediately
      createStore(pendingData);
    } else {
      // Missing info — show form
      setStoreName(pendingData.store_name || "");
      setExternalUrl(pendingData.external_url || "");
      setNeedsForm(true);
    }
  }, [params, createStore]);

  const handleSubmit = () => {
    if (!storeName.trim()) {
      setError("Give your project a name");
      return;
    }
    if (pending?.store_type === "existing" && !externalUrl.trim()) {
      setError("Paste your project URL");
      return;
    }
    setError("");
    createStore({
      ...pending!,
      store_name: storeName.trim(),
      external_url: pending?.store_type === "existing" ? externalUrl.trim() : null,
    });
  };

  // Not triggered
  if (!saving && !done && !needsForm && !error) return null;

  const inputStyle = {
    border: "1px solid var(--border)",
    background: "var(--bg)",
  };

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center px-4"
      style={{ background: "rgba(45,36,36,0.7)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="rounded-2xl p-6 max-w-md w-full"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {done ? (
          <div className="text-center py-4">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-lg font-bold" style={{ color: "var(--text)" }}>You&apos;re in!</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Setting up your store...
            </p>
          </div>
        ) : needsForm ? (
          <>
            <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>
              {pending?.store_type === "existing" ? "🔗 Connect Your Project" : "🏗️ Almost There"}
            </h2>
            <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
              Payment confirmed! Just a couple details and you&apos;re live.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                  Project Name
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="What's your project called?"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                  style={inputStyle}
                  autoFocus
                />
              </div>

              {pending?.store_type === "existing" && (
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                    Project URL
                  </label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://your-project.com"
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
              )}

              {error && (
                <p className="text-sm text-center" style={{ color: "#E85D27" }}>{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full py-3 rounded-full font-semibold text-sm border-none cursor-pointer disabled:opacity-50"
                style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
              >
                {saving ? "Setting up..." : "Launch My Store"}
              </button>
            </div>
          </>
        ) : saving ? (
          <div className="text-center py-4">
            <p className="text-3xl mb-2">🏗️</p>
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Setting up your store...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-3xl mb-2">😕</p>
            <p className="text-sm font-semibold mb-3" style={{ color: "#E85D27" }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 rounded-lg text-sm font-semibold border-none cursor-pointer"
              style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
            >
              Try Again
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
