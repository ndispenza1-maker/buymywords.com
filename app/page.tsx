import { getAuthUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import FeedClient from "./feed/FeedClient";

export default async function HomePage() {
  const user = await getAuthUser();

  return (
    <>
      <NavBar user={user} />
      <div className="pt-16 min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="max-w-6xl mx-auto px-4 flex gap-6">
          {/* Left sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div
              className="sticky top-20 rounded-xl p-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              {user ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        background: user.avatar_url
                          ? `url(${user.avatar_url}) center/cover`
                          : "var(--sunset-warm)",
                        color: "var(--text-inverse)",
                      }}
                    >
                      {!user.avatar_url && user.display_name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{user.display_name}</p>
                    </div>
                  </div>
                  <nav className="space-y-2">
                    <a
                      href={`/profile/${user.id}`}
                      className="block text-sm py-1 no-underline"
                      style={{ color: "var(--text)" }}
                    >
                      👤 My Profile
                    </a>
                    <a
                      href="/messages"
                      className="block text-sm py-1 no-underline"
                      style={{ color: "var(--text)" }}
                    >
                      ✉️ Messages
                    </a>
                    <a
                      href="/notifications"
                      className="block text-sm py-1 no-underline"
                      style={{ color: "var(--text)" }}
                    >
                      🔔 Notifications
                    </a>
                    <a
                      href="/settings"
                      className="block text-sm py-1 no-underline"
                      style={{ color: "var(--text)" }}
                    >
                      ⚙️ Settings
                    </a>
                  </nav>
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--text)" }}>
                    Welcome to The Mall
                  </h3>
                  <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--text-muted)" }}>
                    Browse what people are posting. Create a profile to join the conversation.
                  </p>
                  <div className="space-y-2">
                    <a
                      href="/signup"
                      className="block text-center text-sm py-2 rounded-full font-semibold no-underline"
                      style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
                    >
                      Create Profile
                    </a>
                    <a
                      href="/login"
                      className="block text-center text-sm py-2 rounded-full font-semibold no-underline"
                      style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                    >
                      Log in
                    </a>
                  </div>
                </>
              )}
            </div>
          </aside>

          {/* Center feed */}
          <main className="flex-1 max-w-xl">
            <FeedClient currentUserId={user?.id || null} />
          </main>

          {/* Right sidebar */}
          <aside className="hidden xl:block w-72 shrink-0">
            <div
              className="sticky top-20 rounded-xl p-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--text-muted)" }}>
                The Mall
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                No bots. No algorithm. No noise. Just a chronological feed of what real people are posting right now.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
