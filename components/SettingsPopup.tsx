"use client";

import { useState, useEffect } from "react";

interface SettingsProps {
  onClose: () => void;
  accountType: string | null;
  subscriptionStatus: string | null;
  subscriptionTier: string | null;
}

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
      {isActive && (
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
        {/* Shopper options */}
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

        {/* Store Owner plans */}
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
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>AI assistant included</p>
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

export default function SettingsPopup({ onClose, accountType, subscriptionStatus, subscriptionTier }: SettingsProps) {
  const [tab, setTab] = useState<"general" | "subscription">("general");
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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(45,36,36,0.5)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
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
          <button
            onClick={() => setTab("general")}
            className="px-3 py-2 text-xs font-semibold border-none cursor-pointer rounded-t-lg"
            style={{
              background: tab === "general" ? "var(--bg)" : "transparent",
              color: tab === "general" ? "var(--text)" : "var(--text-muted)",
              borderBottom: tab === "general" ? "2px solid var(--accent)" : "2px solid transparent",
            }}
          >
            General
          </button>
          <button
            onClick={() => setTab("subscription")}
            className="px-3 py-2 text-xs font-semibold border-none cursor-pointer rounded-t-lg"
            style={{
              background: tab === "subscription" ? "var(--bg)" : "transparent",
              color: tab === "subscription" ? "var(--text)" : "var(--text-muted)",
              borderBottom: tab === "subscription" ? "2px solid var(--accent)" : "2px solid transparent",
            }}
          >
            Subscription
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
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
