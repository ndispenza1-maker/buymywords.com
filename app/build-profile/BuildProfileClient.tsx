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
  const [step, setStep] = useState<"choose" | "details">("choose");
  const [accountType, setAccountType] = useState<"shopper" | "store_owner" | null>(null);
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleTypeSelect = (type: "shopper" | "store_owner") => {
    setAccountType(type);
    setStep("details");
  };

  const handleSave = async () => {
    if (!accountType) return;
    setSaving(true);
    setError("");

    const res = await fetch("/api/profile/build", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account_type: accountType, bio: bio.trim() }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {step === "choose" ? (
          <>
            <h1 className="text-2xl font-bold mb-2 text-center" style={{ color: "var(--text)" }}>
              Build Your Profile
            </h1>
            <p className="text-sm text-center mb-8" style={{ color: "var(--text-muted)" }}>
              How do you want to use The Mall?
            </p>

            <div className="space-y-4">
              {/* Store Owner */}
              <button
                onClick={() => handleTypeSelect("store_owner")}
                className="w-full text-left p-5 rounded-xl border-none cursor-pointer transition-all"
                style={{
                  background: "var(--accent-light)",
                  border: "2px solid var(--accent)",
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🏪</span>
                  <h3 className="text-lg font-bold" style={{ color: "var(--text)" }}>
                    Store Owner
                  </h3>
                </div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  You sell something. Your profile becomes your storefront.
                </p>
              </button>

              {/* Shopper */}
              <button
                onClick={() => handleTypeSelect("shopper")}
                className="w-full text-left p-5 rounded-xl border-none cursor-pointer transition-all"
                style={{
                  background: "var(--bg)",
                  border: "2px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🛍️</span>
                  <h3 className="text-lg font-bold" style={{ color: "var(--text)" }}>
                    Shopper
                  </h3>
                </div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  You&apos;re here to browse, connect, and buy from real people.
                </p>
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => setStep("choose")}
              className="text-sm bg-transparent border-none cursor-pointer mb-4"
              style={{ color: "var(--accent)" }}
            >
              ← Back
            </button>

            <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>
              {accountType === "store_owner" ? "🏪 Store Owner" : "🛍️ Shopper"}
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              Tell people a little about yourself.
            </p>

            {/* Name (display only) */}
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

            {/* Bio */}
            <div className="mb-6">
              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={
                  accountType === "store_owner"
                    ? "What do you sell? What's your story?"
                    : "What brings you to The Mall?"
                }
                rows={3}
                className="w-full resize-none text-sm outline-none px-3 py-2 rounded-lg"
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  fontFamily: "inherit",
                }}
                maxLength={300}
              />
              <p className="text-xs mt-1 text-right" style={{ color: "var(--text-muted)" }}>
                {bio.length}/300
              </p>
            </div>

            {error && (
              <p className="text-sm mb-4 text-center" style={{ color: "#c0392b" }}>
                {error}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 rounded-full font-semibold text-sm border-none cursor-pointer disabled:opacity-40"
              style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
            >
              {saving ? "Saving..." : "Finish Profile"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
