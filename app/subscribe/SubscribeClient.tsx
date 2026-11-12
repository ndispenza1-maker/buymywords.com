"use client";

import { useState } from "react";

export default function SubscribeClient() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);

  const handleCheckout = async (priceId: string) => {
    if (!agreed) {
      setError("You must agree to the Terms of Service and Privacy Policy");
      return;
    }
    setLoading(priceId);
    setError("");

    // Stash store data — SubscriptionSuccess creates the store after payment
    localStorage.setItem("mall_pending_store", JSON.stringify({
      store_type: "",
      store_name: "",
      store_description: null,
      external_url: null,
    }));

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
    <div className="max-w-md mx-auto">
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

      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div className="mb-5">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Every plan includes a store page, the AI assistant, and the choice to connect an existing project or start fresh.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleCheckout("price_1UX2Mh2ctK45EjG7Cd3NbKEA")}
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
            onClick={() => handleCheckout("price_1UX2OC2ctK45EjG7hBCsExY2")}
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
            onClick={() => handleCheckout("price_1UX2PM2ctK45EjG7AcZfFxLT")}
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
