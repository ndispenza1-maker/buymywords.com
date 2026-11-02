"use client";

import { useState } from "react";
import { useWizard } from "./WizardContext";

type StoreType = "existing" | "fresh" | null;
type Step = "choose" | "setup" | "pricing";

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex items-center justify-center ml-1.5 cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShow(!show); }}
    >
      <span
        className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
        style={{ border: "1px solid var(--text-muted)", color: "var(--text-muted)" }}
      >
        i
      </span>
      {show && (
        <span
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs leading-relaxed whitespace-normal w-56 text-center z-50"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)", boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

export default function BuildStoreWizard() {
  const { isOpen, closeWizard } = useWizard();
  const [step, setStep] = useState<Step>("choose");
  const [storeType, setStoreType] = useState<StoreType>(null);
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [needAssistant, setNeedAssistant] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const reset = () => {
    setStep("choose");
    setStoreType(null);
    setStoreName("");
    setStoreDescription("");
    setExternalUrl("");
    setNeedAssistant(false);
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

    // Stash store data — we'll create the store AFTER payment succeeds
    const storeData = {
      store_name: storeName.trim(),
      store_description: storeDescription.trim() || null,
      store_type: storeType,
      external_url: storeType === "existing" ? externalUrl.trim() : null,
      assistant_enabled: storeType === "fresh" ? needAssistant : false,
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

  const modalStyle = {
    background: "rgba(45,36,36,0.6)",
    backdropFilter: "blur(4px)",
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
      style={modalStyle}
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
          {/* Step 1: Choose */}
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
                      Get a blank store page — build it your way
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Step 2: Setup */}
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

              {storeType === "fresh" && (
                <label
                  className="flex items-center gap-2 cursor-pointer px-1 py-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={needAssistant}
                    onChange={(e) => setNeedAssistant(e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer accent-[var(--accent)]"
                  />
                  <span className="text-sm" style={{ color: "var(--text)" }}>
                    Need Assistant?
                  </span>
                  <InfoTooltip text="New to AI? A virtual assistant will guide you through every step — setting up your AI, building your store, connecting payments, mailing lists, and more. No experience needed." />
                </label>
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

          {/* Step 3: Pricing — pay first, store created after */}
          {step === "pricing" && (
            <div className="space-y-3">
              {/* Review summary */}
              <div
                className="p-3 rounded-xl space-y-1 mb-2"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
              >
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {storeType === "existing" ? "🔗" : "🏗️"} <span className="font-semibold" style={{ color: "var(--text)" }}>{storeName}</span>
                  {needAssistant && storeType === "fresh" && <span style={{ color: "var(--accent)" }}> · ✨ Assistant</span>}
                </p>
              </div>

              {error && (
                <p className="text-sm text-center" style={{ color: "#E85D27" }}>
                  {error}
                </p>
              )}

              {storeType === "fresh" && needAssistant ? (
                /* Fresh + Assistant: $39.99/mo only */
                <button
                  onClick={() => handleCheckout("price_1UXScd2ctK45EjG7QbTNoaey")}
                  disabled={loading}
                  className="w-full p-4 rounded-xl text-left border-none cursor-pointer transition-all disabled:opacity-50"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>Store + Assistant</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>AI assistant included</p>
                    </div>
                    <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>$39.99<span className="text-xs font-normal">/mo</span></p>
                  </div>
                </button>
              ) : (
                /* Link Existing / Fresh without assistant: 3 tiers */
                <>
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
                    style={{ background: "var(--bg)", border: "1px solid var(--accent)" }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>6 Months <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>Save 17%</span></p>
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
                        <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>Yearly <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>Save 17%</span></p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Lock in the best rate</p>
                      </div>
                      <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>$199.99<span className="text-xs font-normal">/yr</span></p>
                    </div>
                  </button>
                </>
              )}

              <button
                onClick={() => { setStep("setup"); setError(""); }}
                disabled={loading}
                className="w-full py-2 text-xs bg-transparent border-none cursor-pointer"
                style={{ color: "var(--text-muted)" }}
              >
                ← Back to setup
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
