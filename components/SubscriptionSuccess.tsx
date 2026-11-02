"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

/**
 * After Stripe checkout redirect (?subscribed=1):
 * - Store owner: show mini wizard to collect store details, then create store
 * - Shopper: just reload clean
 */
export default function SubscriptionSuccess() {
  const params = useSearchParams();
  const router = useRouter();
  const [storeType, setStoreType] = useState<"existing" | "fresh" | null>(null);
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (params.get("subscribed") !== "1") return;

    const pendingType = localStorage.getItem("mall_pending_store_type");
    if (!pendingType) {
      // Shopper sub or no pending store — clean reload
      window.history.replaceState({}, "", "/");
      window.location.reload();
      return;
    }

    setStoreType(pendingType as "existing" | "fresh");
  }, [params]);

  const handleCreate = async () => {
    if (storeType === "existing" && !storeName.trim()) {
      setError("Give your project a name");
      return;
    }
    if (storeType === "existing" && !externalUrl.trim()) {
      setError("Paste your project URL");
      return;
    }
    if (storeType === "fresh" && !storeName.trim()) {
      // For fresh, auto-name if empty
      setStoreName("My Store");
    }

    setSaving(true);
    setError("");

    const name = storeName.trim() || "My Store";

    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_name: name,
          store_description: storeDescription.trim() || null,
          store_type: storeType,
          external_url: storeType === "existing" ? externalUrl.trim() : null,
          llm_provider: null,
          llm_api_key: null,
          assistant_enabled: storeType === "fresh",
        }),
      });

      if (res.ok || (await res.json().catch(() => null))?.error === "Store already exists") {
        localStorage.removeItem("mall_pending_store_type");
        setDone(true);
        setTimeout(() => {
          window.history.replaceState({}, "", "/");
          window.location.reload();
        }, 1500);
      } else {
        setError("Something went wrong — try again.");
        setSaving(false);
      }
    } catch {
      setError("Something went wrong — try again.");
      setSaving(false);
    }
  };

  if (!storeType) return null;

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
          </div>
        ) : storeType === "existing" ? (
          /* Link Existing — name + URL */
          <>
            <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>
              🔗 Connect Your Project
            </h2>
            <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
              Payment confirmed. Last step — link your project.
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
                  style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                  Project URL
                </label>
                <input
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://your-store.com"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                  style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
                />
              </div>

              {error && (
                <p className="text-sm text-center" style={{ color: "#E85D27" }}>{error}</p>
              )}

              <button
                onClick={handleCreate}
                disabled={saving}
                className="w-full py-3 rounded-full font-semibold text-sm border-none cursor-pointer disabled:opacity-50"
                style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
              >
                {saving ? "Setting up..." : "Open My Store"}
              </button>
            </div>
          </>
        ) : (
          /* Fresh — just a description */
          <>
            <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>
              🏗️ Almost There
            </h2>
            <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
              Payment confirmed. Give your store a quick description and you&apos;re live.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                  What are you building?
                </label>
                <textarea
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  placeholder="Tell people what your store is about..."
                  rows={3}
                  className="w-full resize-none text-sm outline-none px-4 py-3 rounded-lg"
                  style={{ border: "1px solid var(--border)", background: "var(--bg)", fontFamily: "inherit" }}
                />
              </div>

              {error && (
                <p className="text-sm text-center" style={{ color: "#E85D27" }}>{error}</p>
              )}

              <button
                onClick={() => { if (!storeName) setStoreName("My Store"); handleCreate(); }}
                disabled={saving}
                className="w-full py-3 rounded-full font-semibold text-sm border-none cursor-pointer disabled:opacity-50"
                style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
              >
                {saving ? "Setting up..." : "Launch My Store"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
