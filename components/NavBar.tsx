"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar({
  user,
}: {
  user: { id: string; display_name: string; avatar_url: string | null } | null;
}) {
  const pathname = usePathname();

  return (
    <nav
      style={{
        background: "var(--bg-nav)",
        borderBottom: "1px solid rgba(244,132,95,0.3)",
      }}
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 md:px-8"
    >
      {/* Brand */}
      <Link href="/feed" className="flex flex-col leading-none no-underline">
        <span className="text-xl font-bold" style={{ color: "var(--sunset-peach)" }}>
          The Mall
        </span>
        <span className="text-[10px] tracking-wider" style={{ color: "var(--sunset-mauve)" }}>
          buymywords.com
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
              href="/feed"
              className="text-sm no-underline"
              style={{
                color: pathname === "/feed" ? "var(--sunset-peach)" : "var(--text-inverse)",
              }}
            >
              Home
            </Link>
            <Link
              href="/messages"
              className="text-sm no-underline"
              style={{
                color: pathname === "/messages" ? "var(--sunset-peach)" : "var(--text-inverse)",
              }}
            >
              Messages
            </Link>
            <Link
              href="/notifications"
              className="text-sm no-underline"
              style={{
                color: pathname === "/notifications" ? "var(--sunset-peach)" : "var(--text-inverse)",
              }}
            >
              Notifications
            </Link>
            <Link
              href={`/profile/${user.id}`}
              className="flex items-center gap-2 no-underline"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: user.avatar_url
                    ? `url(${user.avatar_url}) center/cover`
                    : "var(--sunset-warm)",
                  color: "var(--text-inverse)",
                }}
              >
                {!user.avatar_url && user.display_name[0]?.toUpperCase()}
              </div>
            </Link>
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
