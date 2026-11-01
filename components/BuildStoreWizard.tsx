"use client";

import { useState } from "react";
import { useWizard } from "./WizardContext";

type StoreType = "existing" | "fresh" | null;
type Step = "choose" | "setup" | "review";

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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needAssistant, setNeedAssistant] = useState(false);

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
    setStep("review");
  };

  const handleLaunch = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_name: storeName.trim(),
          store_description: storeDescription.trim() || null,
          store_type: storeType,
          external_url: storeType === "existing" ? externalUrl.trim() : null,
          llm_provider: null,
          llm_api_key: null,
          assistant_enabled: storeType === "fresh" ? needAssistant : false,
        }),
      });
      if (!res.ok) {
        let msg = "Something went wrong";
        try { const data = await res.json(); msg = data.error || msg; } catch {}
        throw new Error(msg);
      }
      // Success — reload to reflect store_built = true
      window.location.reload();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
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
              {step === "review" && "Review & Launch"}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {step === "choose" && "How do you want to get started?"}
              {step === "setup" && "Tell us about your store"}
              {step === "review" && "Everything look good?"}
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
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                }}
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
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                }}
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

          {/* Step 3: Review */}
          {step === "review" && (
            <div className="space-y-4">
              <div
                className="p-4 rounded-xl space-y-3"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
              >
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Project Name</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{storeName}</p>
                </div>
                {storeDescription && (
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Description</p>
                    <p className="text-sm" style={{ color: "var(--text)" }}>{storeDescription}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Type</p>
                  <p className="text-sm" style={{ color: "var(--text)" }}>
                    {storeType === "existing" ? "🔗 Connected Project" : "🏗️ Fresh Build"}
                  </p>
                </div>
                {needAssistant && storeType === "fresh" && (
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Assistant</p>
                    <p className="text-sm" style={{ color: "var(--accent)" }}>✨ Guided Assistant enabled</p>
                  </div>
                )}
                {storeType === "existing" && (
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Project URL</p>
                    <p className="text-sm" style={{ color: "var(--accent)" }}>{externalUrl}</p>
                  </div>
                )}

              </div>

              {error && (
                <p className="text-sm text-center" style={{ color: "#E85D27" }}>
                  {error}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setStep("setup"); setError(""); }}
                  disabled={loading}
                  className="flex-1 py-3 rounded-lg text-sm font-semibold border-none cursor-pointer"
                  style={{ background: "var(--bg)", color: "var(--text)", border: "1px solid var(--border)" }}
                >
                  Back
                </button>
                <button
                  onClick={handleLaunch}
                  disabled={loading}
                  className="flex-1 py-3 rounded-lg text-sm font-semibold border-none cursor-pointer disabled:opacity-50"
                  style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
                >
                  {loading ? "Launching..." : "🚀 Launch My Project"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
