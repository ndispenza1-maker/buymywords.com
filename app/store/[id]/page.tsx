import { getAuthUser } from "@/lib/auth";
import { getSQL } from "@/lib/db";
import NavBar from "@/components/NavBar";
import { notFound } from "next/navigation";

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getAuthUser();
  const sql = getSQL();

  // Get store + owner info
  const stores = await sql`
    SELECT s.*, u.display_name, u.avatar_url, u.bio
    FROM stores s
    JOIN users u ON u.id = s.user_id
    WHERE s.user_id = ${id}
  `;

  if (!stores[0]) {
    notFound();
  }

  const store = stores[0];
  const isOwner = user?.id === store.user_id;

  return (
    <>
      <NavBar user={user ? {
        id: user.id,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        profile_complete: user.profile_complete,
      } : null} />

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Store header */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          {/* Cover gradient */}
          <div
            className="h-32"
            style={{
              background: "linear-gradient(135deg, var(--sunset-dusk), var(--sunset-warm), var(--sunset-peach))",
            }}
          />

          <div className="px-6 py-5 -mt-8">
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold mb-3"
              style={{
                background: store.avatar_url
                  ? `url(${store.avatar_url}) center/cover`
                  : "var(--sunset-warm)",
                color: "var(--text-inverse)",
                border: "4px solid var(--bg-card)",
              }}
            >
              {!store.avatar_url && (store.store_name[0]?.toUpperCase() || "🏪")}
            </div>

            <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
              {store.store_name}
            </h1>

            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              by {store.display_name}
            </p>

            {store.store_description && (
              <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {store.store_description}
              </p>
            )}

            {/* External link for connected projects */}
            {store.store_type === "existing" && store.external_url && (
              <a
                href={store.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-sm font-semibold no-underline"
                style={{
                  background: "var(--accent)",
                  color: "var(--text-inverse)",
                }}
              >
                🔗 Visit Project
              </a>
            )}

            {/* LLM-built store placeholder */}
            {store.store_type === "llm" && (
              <div
                className="mt-6 p-6 rounded-xl text-center"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
              >
                <p className="text-2xl mb-2">🤖</p>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  AI-Powered Store
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {isOwner
                    ? "Your LLM is connected. Start building your store by adding products and content."
                    : "This store is being built with AI. Check back soon."}
                </p>
              </div>
            )}

            {/* Owner controls */}
            {isOwner && (
              <div
                className="mt-6 p-4 rounded-xl"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-muted)" }}>
                  🔧 Store Owner
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  This is your store. More tools coming soon.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
