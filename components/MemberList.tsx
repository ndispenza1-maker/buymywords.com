"use client";

import { useState, useEffect } from "react";

interface Member {
  id: string;
  display_name: string;
  account_type: string | null;
  avatar_url: string | null;
}

export default function MemberList() {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((d) => setMembers(d.members || []))
      .catch(() => {});
  }, []);

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm" style={{ color: "var(--text-muted)" }}>
          Members
        </h3>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
          {members.length}
        </span>
      </div>
      <div className="space-y-2.5">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{
                background: m.avatar_url
                  ? `url(${m.avatar_url}) center/cover`
                  : "var(--sunset-warm)",
                color: "var(--text-inverse)",
              }}
            >
              {!m.avatar_url && m.display_name[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: "var(--text)" }}>
                {m.display_name}
              </p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {m.account_type === "store_owner" ? "Store Owner" : "Shopper"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
