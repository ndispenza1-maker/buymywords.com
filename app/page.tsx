import { getAuthUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import FeedClient from "./feed/FeedClient";
import ProfileLink from "@/components/ProfileLink";
import UnreadDot from "@/components/UnreadDot";
import MemberList from "@/components/MemberList";

function LeftSidebar({ user }: { user: Awaited<ReturnType<typeof getAuthUser>> }) {
  if (!user) {
    // Not logged in
    return (
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
            Sign Up
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
    );
  }

  if (!user.profile_complete) {
    // Logged in but profile not built
    return (
      <>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ background: "#999", color: "var(--text-inverse)" }}
          >
            {user.display_name[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-sm">{user.display_name}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Profile not set up</p>
          </div>
        </div>
        <a
          href="/build-profile"
          className="block text-center text-sm py-2 rounded-full font-semibold no-underline"
          style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
        >
          🔨 Build Profile
        </a>
      </>
    );
  }

  // Logged in + profile built
  return (
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
        <ProfileLink
          userId={user.id}
          currentUserId={user.id}
          profileComplete={user.profile_complete}
          className="block text-sm py-1"
          style={{ color: "var(--text)" }}
        >
          👤 My Profile
        </ProfileLink>
        <a href="/messages" className="inline-flex items-center gap-1 text-sm py-1 no-underline" style={{ color: "var(--text)" }}>
          ✉️ Messages
          <UnreadDot />
        </a>

      </nav>
    </>
  );
}

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
              <LeftSidebar user={user} />
            </div>
          </aside>

          {/* Center feed */}
          <main className="flex-1 max-w-xl">
            <FeedClient
              currentUserId={user?.id || null}
              profileComplete={user?.profile_complete ?? false}
            />
          </main>

          {/* Right sidebar */}
          <aside className="hidden xl:block w-72 shrink-0">
            <div
              className="sticky top-20 rounded-xl p-4 mb-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--text-muted)" }}>
                The Mall Shared Space
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                No bots. No algorithm. No noise. Just Real people using their words to sell their products, views and ideas.
              </p>
            </div>
            <div
              className="sticky top-48 rounded-xl p-4"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <MemberList />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
