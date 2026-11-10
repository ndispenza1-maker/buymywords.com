"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import ProfileCard from "./ProfileCard";
import SettingsPopup from "./SettingsPopup";

interface NavUser {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio?: string | null;
  profile_complete: boolean;
  account_type?: string | null;
  subscription_status?: string | null;
  subscription_tier?: string | null;
}

export default function NavBar({ user }: { user: NavUser | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <nav
      style={{
        background: "var(--bg-nav)",
        borderBottom: "1px solid rgba(244,132,95,0.3)",
      }}
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 md:px-8"
    >
      {/* Brand */}
      <Link href="/" className="flex flex-col leading-none no-underline">
        <span className="text-xl font-bold" style={{ color: "var(--sunset-peach)" }}>
          The Mall
        </span>
        <span className="text-[10px] tracking-wider" style={{ color: "var(--sunset-mauve)" }}>
          themallofprojects.com
        </span>
      </Link>

      {/* Search */}
      <div className="hidden md:block flex-1 max-w-md mx-8">
        <input
          type="text"
          placeholder="Search The Mall..."
          className="w-full px-4 py-2 rounded-full text-sm border-none outline-none"
          style={{
            background: "rgba(255,255,255,0.1)",
            color: "var(--text-inverse)",
          }}
        />
      </div>

      {/* Right nav */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link
              href="/"
              className="text-sm no-underline"
              style={{
                color: pathname === "/" ? "var(--sunset-peach)" : "var(--text-inverse)",
              }}
            >
              Home
            </Link>
            {/* Avatar + dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background:
                      user.avatar_url
                        ? `url(${user.avatar_url}) center/cover`
                        : user.profile_complete
                          ? "var(--sunset-warm)"
                          : "#999",
                    color: "var(--text-inverse)",
                  }}
                >
                  {!user.avatar_url && user.display_name[0]?.toUpperCase()}
                </div>
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-11 w-48 rounded-xl py-2 shadow-lg"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="px-4 py-2 border-b" style={{ borderColor: "var(--border)" }}>
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                      {user.display_name}
                    </p>
                  </div>

                  {!user.profile_complete ? (
                    <Link
                      href="/build-profile"
                      className="block px-4 py-2 text-sm no-underline font-semibold"
                      style={{ color: "var(--accent)" }}
                      onClick={() => setMenuOpen(false)}
                    >
                      🔨 Build Profile
                    </Link>
                  ) : (
                    <>
                      <button
                        onClick={() => { setMenuOpen(false); setShowProfileCard(true); }}
                        className="block w-full text-left px-4 py-2 text-sm bg-transparent border-none cursor-pointer"
                        style={{ color: "var(--text)" }}
                      >
                        👤 My Profile
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); setShowSettings(true); }}
                        className="block w-full text-left px-4 py-2 text-sm bg-transparent border-none cursor-pointer"
                        style={{ color: "var(--text)" }}
                      >
                        ⚙️ Settings
                      </button>
                    </>
                  )}

                  <button
                    onClick={async () => {
                      await fetch("/api/auth/logout", { method: "POST" });
                      window.location.href = "/";
                    }}
                    className="block w-full text-left px-4 py-2 text-sm bg-transparent border-none cursor-pointer"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
            {showProfileCard && (
              <ProfileCard
                userId={user.id}
                currentUserId={user.id}
                profileComplete={user.profile_complete}
                onClose={() => setShowProfileCard(false)}
              />
            )}
            {showSettings && (
              <SettingsPopup
                onClose={() => setShowSettings(false)}
                accountType={user.account_type || null}
                subscriptionStatus={user.subscription_status || null}
                subscriptionTier={user.subscription_tier || null}
                userId={user.id}
                avatarUrl={user.avatar_url || null}
                bio={user.bio || null}
                displayName={user.display_name}
              />
            )}
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-sm no-underline"
              style={{ color: "var(--text-inverse)" }}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="text-sm px-4 py-2 rounded-full font-semibold no-underline"
              style={{
                background: "var(--accent)",
                color: "var(--text-inverse)",
              }}
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
