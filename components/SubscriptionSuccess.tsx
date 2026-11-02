"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Runs on page load after Stripe checkout redirect (?subscribed=1).
 * Reads pending store data from localStorage, creates the store, then reloads.
 */
export default function SubscriptionSuccess() {
  const params = useSearchParams();
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (params.get("subscribed") !== "1") return;

    const pending = localStorage.getItem("mall_pending_store");
    if (!pending) {
      // Shopper subscription (no store to create) — just reload clean
      window.history.replaceState({}, "", "/");
      window.location.reload();
      return;
    }

    // Store owner — create the store now that payment went through
    setStatus("Setting up your store...");

    const storeData = JSON.parse(pending);

    fetch("/api/stores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        store_name: storeData.store_name,
        store_description: storeData.store_description,
        store_type: storeData.store_type,
        external_url: storeData.external_url,
        llm_provider: null,
        llm_api_key: null,
        assistant_enabled: storeData.assistant_enabled || false,
      }),
    })
      .then((res) => {
        if (res.ok) {
          localStorage.removeItem("mall_pending_store");
          setStatus("You're in! 🎉");
          // Clean URL and reload
          setTimeout(() => {
            window.history.replaceState({}, "", "/");
            window.location.reload();
          }, 1500);
        } else {
          return res.json().then((d) => {
            // Store might already exist (double-redirect) — still success
            if (d.error === "Store already exists") {
              localStorage.removeItem("mall_pending_store");
              window.history.replaceState({}, "", "/");
              window.location.reload();
            } else {
              setStatus("Something went wrong — try refreshing.");
            }
          });
        }
      })
      .catch(() => {
        setStatus("Something went wrong — try refreshing.");
      });
  }, [params]);

  if (!status) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: "rgba(45,36,36,0.7)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="rounded-2xl p-8 max-w-sm w-full text-center"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <p className="text-lg font-bold" style={{ color: "var(--text)" }}>
          {status}
        </p>
      </div>
    </div>
  );
}
