"use client";

import { useState } from "react";
import { useWizard } from "./WizardContext";

type StoreType = "existing" | "fresh" | null;
type Step = "choose" | "setup" | "pricing";

export default function BuildStoreWizard() {
  const { isOpen, closeWizard } = useWizard();
  const [step, setStep] = useState<Step>("choose");
  const [storeType, setStoreType] = useState<StoreType>(null);
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const reset = () => {
    setStep("choose");
    setStoreType(null);
    setStoreName("");
    setStoreDescription("");
    setExternalUrl("");
    setError("");
  };

  const handleClose = () => {
    reset();
    closeWizard();
  };

  const handleChoose = (type: StoreType) => {
    setStoreType(type);
    setStep("setup");
  };

  const handleSetupNext = () => {
    if (!storeName.trim()) {
      setError("Give your project a name");
      return;
    }
    if (storeType === "existing" && !externalUrl.trim()) {
      setError("Paste your project URL");
      return;
    }
    setError("");
    setStep("pricing");
  };

  // Save store data to localStorage, then redirect to Stripe
  const handleCheckout = async (priceId: string) => {
    setLoading(true);
    setError("");

    // Stash store data — store created AFTER payment succeeds
    const storeData = {
      store_name: storeName.trim(),
      store_description: storeDescription.trim() || null,
      store_type: storeType,
      external_url: storeType === "existing" ? externalUrl.trim() : null,
    };
    localStorage.setItem("mall_pending_store", JSON.stringify(storeData));

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price_id: priceId }),
      });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Something went wrong");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  const cardStyle = {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
  };

  const inputStyle = {
    border: "1px solid var(--border)",
    background: "var(--bg)",
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{ background: "rgba(45,36,36,0.6)", backdropFilter: "blur(4px)" }}
      onClick={handleClose}
    >
      <div
        className="rounded-2xl w-full max-w-md overflow-hidden"
        style={cardStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
              {step === "choose" && "Build Your Project"}
              {step === "setup" && (storeType === "existing" ? "Connect Your Project" : "Start Fresh")}
              {step === "pricing" && "Choose Your Plan"}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {step === "choose" && "How do you want to get started?"}
              {step === "setup" && "Tell us about your store"}
              {step === "pricing" && "You keep 100% of your sales. This is just rent."}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer text-lg"
            style={{ background: "var(--bg)", color: "var(--text-muted)" }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* Step 1: Choose type */}
          {step === "choose" && (
            <div className="space-y-3">
              <button
                onClick={() => handleChoose("existing")}
                className="w-full p-4 rounded-xl text-left border-none cursor-pointer transition-all"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔗</span>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                      Connect Existing Project
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      I already have a website or project
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleChoose("fresh")}
                className="w-full p-4 rounded-xl text-left border-none cursor-pointer transition-all"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏗️</span>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                      Start Fresh
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Blank store page + AI assistant to help you build
                    </p>
                  </div>
                </div>
              </button>

              <p className="text-[10px] text-center pt-1" style={{ color: "var(--text-muted)" }}>
                Both options include a store page and the AI assistant · From $19.99/mo
              </p>
            </div>
          )}

          {/* Step 2: Setup details */}
          {step === "setup" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                  Project Name
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="What's your project called?"
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                  style={inputStyle}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                  Description <span className="font-normal">(optional)</span>
                </label>
                <textarea
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  placeholder="What does your project do?"
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none"
                  style={inputStyle}
                />
              </div>

              {storeType === "existing" && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                    Your Project URL
                  </label>
                  <input
                    type="url"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    placeholder="https://your-store.com"
                    className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                    style={inputStyle}
                  />
                </div>
              )}

              {error && (
                <p className="text-sm text-center" style={{ color: "#E85D27" }}>
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setStep("choose"); setError(""); }}
                  className="flex-1 py-3 rounded-lg text-sm font-semibold border-none cursor-pointer"
                  style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
                >
                  Back
                </button>
                <button
                  onClick={handleSetupNext}
                  className="flex-1 py-3 rounded-lg text-sm font-semibold border-none cursor-pointer"
                  style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Pricing — same for both paths */}
          {step === "pricing" && (
            <div className="space-y-3">
              {/* Summary */}
              <div
                className="p-3 rounded-xl"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
              >
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {storeType === "existing" ? "🔗" : "🏗️"}{" "}
                  <span className="font-semibold" style={{ color: "var(--text)" }}>{storeName}</span>
                  <span style={{ color: "var(--accent)" }}> · ✨ Assistant included</span>
                </p>
              </div>

              {error && (
                <p className="text-sm text-center" style={{ color: "#E85D27" }}>
                  {error}
                </p>
              )}

              <button
                onClick={() => handleCheckout("price_1UX2Mh2ctK45EjG7Cd3NbKEA")}
                disabled={loading}
                className="w-full p-4 rounded-xl text-left border-none cursor-pointer transition-all disabled:opacity-50"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>Monthly</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Flexible, cancel anytime</p>
                  </div>
                  <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>$19.99<span className="text-xs font-normal">/mo</span></p>
                </div>
              </button>
              <button
                onClick={() => handleCheckout("price_1UX2OC2ctK45EjG7hBCsExY2")}
                disabled={loading}
                className="w-full p-4 rounded-xl text-left border-none cursor-pointer transition-all disabled:opacity-50"
                style={{ background: "var(--bg)", border: "2px solid var(--accent)" }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                      6 Months{" "}
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                        Save 17%
                      </span>
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Best for committed builders</p>
                  </div>
                  <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>$99.99<span className="text-xs font-normal">/6mo</span></p>
                </div>
              </button>
              <button
                onClick={() => handleCheckout("price_1UX2PM2ctK45EjG7AcZfFxLT")}
                disabled={loading}
                className="w-full p-4 rounded-xl text-left border-none cursor-pointer transition-all disabled:opacity-50"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                      Yearly{" "}
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
                        Best value
                      </span>
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Lock in $12.50/mo</p>
                  </div>
                  <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>$149.99<span className="text-xs font-normal">/yr</span></p>
                </div>
              </button>

              <button
                onClick={() => { setStep("setup"); setError(""); }}
                disabled={loading}
                className="w-full py-2 text-xs bg-transparent border-none cursor-pointer"
                style={{ color: "var(--text-muted)" }}
              >
                ← Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
