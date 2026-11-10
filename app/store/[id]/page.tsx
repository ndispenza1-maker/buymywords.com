import { getAuthUser } from "@/lib/auth";
import { getSQL } from "@/lib/db";
import NavBar from "@/components/NavBar";
import { notFound } from "next/navigation";
import StoreBuilder from "@/components/StoreBuilder";

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Validate UUID format to avoid Postgres errors on bad input
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    notFound();
  }

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
      {isOwner ? (
        <>
          <NavBar user={user ? {
            id: user.id,
            display_name: user.display_name,
            avatar_url: user.avatar_url,
            bio: user.bio,
            profile_complete: user.profile_complete,
          } : null} />
          <StoreBuilder
            storeId={store.id}
            storeName={store.store_name}
            storeDescription={store.store_description}
            storeType={store.store_type}
            externalUrl={store.external_url}
            storeContent={store.store_content}
            chatHistory={store.assistant_chat_history || []}
            ownerName={store.display_name}
          />
        </>
      ) : (
        <StoreVisitorView store={store} />
      )}
    </>
  );
}

function StoreVisitorView({ store }: { store: Record<string, unknown> }) {
  const storeName = store.store_name as string;
  const storeDescription = store.store_description as string | null;
  const storeType = store.store_type as string;
  const externalUrl = store.external_url as string | null;
  const storeContent = store.store_content as string | null;
  const displayName = store.display_name as string;
  const avatarUrl = store.avatar_url as string | null;

  // If there's published HTML content, show it full-screen with a subtle "Back to Mall" button
  if (storeContent) {
    return (
      <main className="w-full relative" style={{ height: "100vh" }}>
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            padding: "0.75rem 1.25rem",
            display: "flex",
            justifyContent: "flex-end",
            pointerEvents: "none",
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: `.back-to-mall{pointer-events:auto;padding:0.45rem 1rem;border-radius:8px;font-size:0.8rem;font-weight:600;color:rgba(255,255,255,0.75);background:rgba(0,0,0,0.25);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.1);text-decoration:none;transition:background 0.2s,color 0.2s}.back-to-mall:hover{background:rgba(0,0,0,0.45);color:rgba(255,255,255,0.95)}` }} />
          <a href="/" className="back-to-mall">
            ← Back to Mall
          </a>
        </div>
        <iframe
          srcDoc={storeContent}
          sandbox="allow-scripts allow-forms allow-popups"
          className="w-full h-full border-none"
          title={storeName}
        />
      </main>
    );
  }

  // Fallback: basic store info
  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div
          className="h-32"
          style={{
            background: "linear-gradient(135deg, var(--sunset-dusk), var(--sunset-warm), var(--sunset-peach))",
          }}
        />
        <div className="px-6 py-5 -mt-8">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold mb-3"
            style={{
              background: avatarUrl
                ? `url(${avatarUrl}) center/cover`
                : "var(--sunset-warm)",
              color: "var(--text-inverse)",
              border: "4px solid var(--bg-card)",
            }}
          >
            {!avatarUrl && (storeName[0]?.toUpperCase() || "🏪")}
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            {storeName}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            by {displayName}
          </p>
          {storeDescription && (
            <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {storeDescription}
            </p>
          )}
          {storeType === "existing" && externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-sm font-semibold no-underline"
              style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
            >
              🔗 Visit Project
            </a>
          )}
          {storeType === "fresh" && (
            <div
              className="mt-6 p-6 rounded-xl text-center"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            >
              <p className="text-2xl mb-2">🏗️</p>
              <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                Coming Soon
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                This store is being built. Check back soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
