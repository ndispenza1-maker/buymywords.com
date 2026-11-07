"use client";

import { useState } from "react";

export default function SubscribeClient() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  const handleCheckout = async (priceId: string, storeType: "existing" | "fresh") => {
    if (!agreed) {
      setError("You must agree to the Terms of Service and Privacy Policy");
      return;
    }
    setLoading(priceId);
    setError("");

    // Stash the plan type — wizard uses this after payment
    localStorage.setItem("mall_pending_store_type", storeType);

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
        setLoading(null);
      }
    } catch {
      setError("Something went wrong");
      setLoading(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--text)" }}>
          Open Your Store
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          You keep 100% of your sales. This is just rent.
        </p>
      </div>

      {error && (
        <p className="text-sm text-center mb-6" style={{ color: "#E85D27" }}>
          {error}
        </p>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* ── Connect Existing ── */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🔗</span>
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
              Connect Existing
            </h2>
          </div>
          <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
            Already have a website or project? Link it to The Mall and start getting traffic.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => handleCheckout("price_1UX2Mh2ctK45EjG7Cd3NbKEA", "existing")}
              disabled={!!loading}
              className="w-full p-4 rounded-xl text-left border-none cursor-pointer transition-all disabled:opacity-50"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>Monthly</p>
                <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>
                  $19.99<span className="text-xs font-normal">/mo</span>
                </p>
              </div>
            </button>

            <button
              onClick={() => handleCheckout("price_1UX2OC2ctK45EjG7hBCsExY2", "existing")}
              disabled={!!loading}
              className="w-full p-4 rounded-xl text-left border-none cursor-pointer transition-all disabled:opacity-50"
              style={{ background: "var(--bg)", border: "2px solid var(--accent)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                    6 Months
                  </p>
                  <p className="text-[10px] mt-0.5 font-semibold" style={{ color: "var(--accent)" }}>
                    Save 17% — $16.66/mo
                  </p>
                </div>
                <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>
                  $99.99<span className="text-xs font-normal">/6mo</span>
                </p>
              </div>
            </button>

            <button
              onClick={() => handleCheckout("price_1UX2PM2ctK45EjG7AcZfFxLT", "existing")}
              disabled={!!loading}
              className="w-full p-4 rounded-xl text-left border-none cursor-pointer transition-all disabled:opacity-50"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                    Yearly
                  </p>
                  <p className="text-[10px] mt-0.5 font-semibold" style={{ color: "var(--accent)" }}>
                    Best value — $12.50/mo
                  </p>
                </div>
                <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>
                  $149.99<span className="text-xs font-normal">/yr</span>
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* ── Start Fresh ── */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🏗️</span>
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
              Start Fresh
            </h2>
          </div>
          <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
            Don&apos;t have a project yet? No problem. Get a blank store page and an AI assistant that walks you through everything.
          </p>

          <div
            className="rounded-xl p-4 mb-4"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color: "var(--text)" }}>
              ✨ Your Assistant helps you:
            </p>
            <ul className="text-xs space-y-1.5 list-none p-0 m-0" style={{ color: "var(--text-muted)" }}>
              <li>→ Build and design your store page</li>
              <li>→ Set up payments (Stripe, PayPal, etc.)</li>
              <li>→ Connect a mailing list (Beehiiv, Mailchimp)</li>
              <li>→ Write product descriptions and copy</li>
              <li>→ Get your first customers</li>
            </ul>
            <p className="text-[10px] mt-3" style={{ color: "var(--text-muted)" }}>
              No coding or AI experience needed. The assistant guides every step.
            </p>
          </div>

          <button
            onClick={() => handleCheckout("price_1UXScd2ctK45EjG7QbTNoaey", "fresh")}
            disabled={!!loading}
            className="w-full p-4 rounded-xl text-left border-none cursor-pointer transition-all disabled:opacity-50"
            style={{ background: "var(--accent)", border: "none" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--text-inverse)" }}>
                  Store + Assistant
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                  Everything you need to start
                </p>
              </div>
              <p className="text-lg font-bold" style={{ color: "var(--text-inverse)" }}>
                $29.99<span className="text-xs font-normal">/mo</span>
              </p>
            </div>
          </button>
        </div>
      </div>

      <div className="flex justify-center mt-8 mb-4">
        <label className="flex items-start gap-2 cursor-pointer max-w-md">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded cursor-pointer accent-[var(--accent)]"
          />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            I agree to The Mall&apos;s{" "}
            <a href="/terms" target="_blank" style={{ color: "var(--accent)" }}>Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy" target="_blank" style={{ color: "var(--accent)" }}>Privacy Policy</a>.
            Subscriptions auto-renew and are non-refundable.
          </span>
        </label>
      </div>

      <p className="text-center text-xs mb-12" style={{ color: "var(--text-muted)" }}>
        Cancel anytime. Your store stays up as long as you&apos;re subscribed.
      </p>
    </div>
  );
}
