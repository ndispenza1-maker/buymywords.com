"use client";

import { useState, useEffect } from "react";

interface LeaderboardStore {
  store_id: string;
  store_name: string;
  store_type: string;
  external_url: string | null;
  user_id: string;
  owner_name: string;
  owner_avatar: string | null;
  follower_count: number;
}

interface SpotlightStore extends LeaderboardStore {
  note: string | null;
  month: string;
}

export default function StoreLeaderboard() {
  const [stores, setStores] = useState<LeaderboardStore[]>([]);
  const [spotlight, setSpotlight] = useState<SpotlightStore | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/stores/leaderboard")
      .then((r) => r.json())
      .then((data) => {
        setStores(data.leaderboard || []);
        setSpotlight(data.spotlight || null);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return (
      <div className="space-y-4">
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  const storeUrl = (s: LeaderboardStore) =>
    s.store_type === "existing" && s.external_url ? s.external_url : `/store/${s.user_id}`;

  const storeTarget = (s: LeaderboardStore) =>
    s.store_type === "existing" && s.external_url ? "_blank" : undefined;

  const monthLabel = (month: string) => {
    const [y, m] = month.split("-");
    const date = new Date(Number(y), Number(m) - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <div className="space-y-4">
      {/* ── Spotlight Store ── */}
      {spotlight && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid rgba(244,132,95,0.3)" }}
        >
          {/* Spotlight header */}
          <div
            className="px-4 py-2.5 flex items-center gap-2"
            style={{
              background: "linear-gradient(135deg, var(--sunset-dusk), var(--sunset-warm))",
            }}
          >
            <span className="text-sm">⭐</span>
            <div>
              <p className="text-[10px] font-bold tracking-wider uppercase" style={{ color: "var(--text-inverse)" }}>
                Spotlight Store
              </p>
              <p className="text-[8px]" style={{ color: "rgba(255,255,255,0.7)" }}>
                {monthLabel(spotlight.month)}
              </p>
            </div>
          </div>

          {/* Spotlight body */}
          <div className="px-4 py-3" style={{ background: "var(--bg-card)" }}>
            <a
              href={storeUrl(spotlight)}
              target={storeTarget(spotlight)}
              rel={storeTarget(spotlight) ? "noopener noreferrer" : undefined}
              className="flex items-center gap-3 no-underline"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                style={{
                  background: spotlight.owner_avatar
                    ? `url(${spotlight.owner_avatar}) center/cover`
                    : "linear-gradient(135deg, var(--sunset-warm), var(--sunset-peach))",
                  color: "var(--text-inverse)",
                  border: "2px solid var(--sunset-warm)",
                }}
              >
                {!spotlight.owner_avatar && spotlight.store_name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>
                  {spotlight.store_name}
                </p>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  by {spotlight.owner_name} · {spotlight.follower_count} followers
                </p>
              </div>
            </a>
            {spotlight.note && (
              <p
                className="text-[10px] mt-2 leading-relaxed"
                style={{ color: "var(--text-muted)" }}
              >
                &ldquo;{spotlight.note}&rdquo;
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Store Leaderboard ── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div
          className="px-4 py-2.5 flex items-center gap-2"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span className="text-sm">🏆</span>
          <p className="text-xs font-bold" style={{ color: "var(--text)" }}>
            Store Leaderboard
          </p>
        </div>

        {/* List */}
        {stores.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-2xl mb-1">🏪</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              No stores yet. Be the first!
            </p>
          </div>
        ) : (
          <div>
            {stores.map((store, i) => (
              <a
                key={store.store_id}
                href={storeUrl(store)}
                target={storeTarget(store)}
                rel={storeTarget(store) ? "noopener noreferrer" : undefined}
                className="flex items-center gap-3 px-4 py-2.5 no-underline transition-all"
                style={{
                  borderBottom: i < stores.length - 1 ? "1px solid var(--border)" : "none",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                {/* Rank */}
                <span
                  className="text-xs font-bold w-5 text-center shrink-0"
                  style={{
                    color: i === 0 ? "#FFD700" : i === 1 ? "#C0C0C0" : i === 2 ? "#CD7F32" : "var(--text-muted)",
                  }}
                >
                  {i + 1}
                </span>

                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    background: store.owner_avatar
                      ? `url(${store.owner_avatar}) center/cover`
                      : "linear-gradient(135deg, var(--sunset-warm), var(--sunset-peach))",
                    color: "var(--text-inverse)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {!store.owner_avatar && store.store_name[0]?.toUpperCase()}
                </div>

                {/* Name + owner */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>
                    {store.store_name}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
                    {store.owner_name}
                  </p>
                </div>

                {/* Followers */}
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold" style={{ color: "var(--text)" }}>
                    {store.follower_count}
                  </p>
                  <p className="text-[8px]" style={{ color: "var(--text-muted)" }}>
                    follows
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
