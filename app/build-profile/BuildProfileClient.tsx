"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BuildProfileClient({
  userId,
  displayName,
}: {
  userId: string;
  displayName: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"choose" | "shopper-details" | "shopper-sub">("choose");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [subLoading, setSubLoading] = useState(false);

  const handleStoreOwner = async () => {
    // Set account_type but DON'T complete profile yet — that happens after payment
    setSaving(true);
    setError("");
    const res = await fetch("/api/profile/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_type: "store_owner", bio: "", pending: true }),
    });
    if (res.ok) {
      router.push("/subscribe");
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      setSaving(false);
    }
  };

  const handleShopperSave = async () => {
    setSaving(true);
    setError("");
    const res = await fetch("/api/profile/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_type: "shopper", bio: bio.trim() }),
    });
    if (res.ok) {
      setStep("shopper-sub");
      setSaving(false);
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      setSaving(false);
    }
  };

  const handleShopperUpgrade = async () => {
    setSubLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price_id: "price_1UXSk22ctK45EjG7uQa1FKw0" }),
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      }
    } catch {}
    setSubLoading(false);
  };

  const handleShopperSkip = () => {
    router.push("/");
    router.refresh();
  };

  return (
    <div className="max-w-md mx-auto">
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {/* Step 1: Choose type */}
        {step === "choose" && (
          <>
            <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: "var(--text)" }}>
              Build Your Profile
            </h1>
            <p className="text-sm text-center mb-8" style={{ color: "var(--text-muted)" }}>
              How do you want to use The Mall?
            </p>

            {error && (
              <p className="text-sm text-center mb-4" style={{ color: "#E85D27" }}>{error}</p>
            )}

            <div className="space-y-4">
              <button
                onClick={handleStoreOwner}
                disabled={saving}
                className="w-full text-left p-5 rounded-xl border-none cursor-pointer transition-all disabled:opacity-50"
                style={{ background: "var(--accent-light)", border: "2px solid var(--accent)" }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🏪</span>
                  <h3 className="text-lg font-bold" style={{ color: "var(--text)" }}>
                    Store Owner
                  </h3>
                </div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  You sell something. Open a store in The Mall.
                </p>
              </button>

              <button
                onClick={() => setStep("shopper-details")}
                disabled={saving}
                className="w-full text-left p-5 rounded-xl border-none cursor-pointer transition-all"
                style={{ background: "var(--bg)", border: "2px solid var(--border)" }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🛍️</span>
                  <h3 className="text-lg font-bold" style={{ color: "var(--text)" }}>
                    Shopper
                  </h3>
                </div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Browse, connect, and buy from real people.
                </p>
              </button>
            </div>
          </>
        )}

        {/* Step 2a: Shopper details */}
        {step === "shopper-details" && (
          <>
            <button
              onClick={() => setStep("choose")}
              className="text-sm bg-transparent border-none cursor-pointer mb-4"
              style={{ color: "var(--accent)" }}
            >
              ← Back
            </button>

            <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>
              🛍️ Shopper
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              Tell people a little about yourself.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                Display Name
              </label>
              <div
                className="px-3 py-2 rounded-lg text-sm"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
              >
                {displayName}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="What brings you to The Mall?"
                rows={3}
                className="w-full resize-none text-sm outline-none px-3 py-2 rounded-lg"
                style={{ border: "1px solid var(--border)", background: "var(--bg)", fontFamily: "inherit" }}
                maxLength={300}
              />
              <p className="text-xs mt-1 text-right" style={{ color: "var(--text-muted)" }}>
                {bio.length}/300
              </p>
            </div>

            {error && (
              <p className="text-sm mb-4 text-center" style={{ color: "#E85D27" }}>{error}</p>
            )}

            <button
              onClick={handleShopperSave}
              disabled={saving}
              className="w-full py-3 rounded-full font-semibold text-sm border-none cursor-pointer disabled:opacity-40"
              style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
            >
              {saving ? "Saving..." : "Finish Profile"}
            </button>
          </>
        )}

        {/* Step 2b: Shopper subscription offer */}
        {step === "shopper-sub" && (
          <>
            <div className="text-center">
              <p className="text-3xl mb-3">✅</p>
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>
                You&apos;re in!
              </h2>
              <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                Want to chat, comment, message, and follow the builders?
              </p>

              <div
                className="rounded-xl p-4 mb-4 text-left"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-sm" style={{ color: "var(--text)" }}>
                    🔓 Mall+
                  </p>
                  <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>
                    $9.99<span className="text-xs font-normal">/mo</span>
                  </p>
                </div>
                <ul className="text-xs space-y-1 list-none p-0 m-0" style={{ color: "var(--text-muted)" }}>
                  <li>→ Comment on posts</li>
                  <li>→ Send messages to builders</li>
                  <li>→ Follow your favorite stores</li>
                  <li>→ Join the shared space</li>
                </ul>
              </div>

              <label className="flex items-start gap-2 cursor-pointer mb-4 text-left">
                <input
                  type="checkbox"
                  id="shopper-agree"
                  className="w-4 h-4 mt-0.5 rounded cursor-pointer accent-[var(--accent)]"
                />
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  I agree to the{" "}
                  <a href="/terms" target="_blank" style={{ color: "var(--accent)" }}>Terms</a>
                  {" "}&amp;{" "}
                  <a href="/privacy" target="_blank" style={{ color: "var(--accent)" }}>Privacy Policy</a>.
                  Auto-renews at $9.99/mo.
                </span>
              </label>

              <button
                onClick={() => {
                  const cb = document.getElementById("shopper-agree") as HTMLInputElement;
                  if (!cb?.checked) { setError("You must agree to the Terms and Privacy Policy"); return; }
                  handleShopperUpgrade();
                }}
                disabled={subLoading}
                className="w-full py-3 rounded-full font-semibold text-sm border-none cursor-pointer disabled:opacity-50 mb-3"
                style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
              >
                {subLoading ? "Redirecting..." : "Upgrade to Mall+"}
              </button>

              {error && (
                <p className="text-xs text-center mb-2" style={{ color: "#E85D27" }}>{error}</p>
              )}

              <button
                onClick={handleShopperSkip}
                className="text-xs bg-transparent border-none cursor-pointer"
                style={{ color: "var(--text-muted)" }}
              >
                No thanks, just browsing
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
