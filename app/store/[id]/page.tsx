import { getAuthUser } from "@/lib/auth";
import { getSQL } from "@/lib/db";
import NavBar from "@/components/NavBar";
import { notFound } from "next/navigation";
import StoreBuilder from "@/components/StoreBuilder";

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

      {isOwner ? (
        <StoreBuilder
          storeId={store.id}
          storeName={store.store_name}
          storeDescription={store.store_description}
          storeType={store.store_type}
          externalUrl={store.external_url}
          storeContent={store.store_content}
          llmProvider={store.llm_provider}
          hasApiKey={!!store.llm_api_key}
          chatHistory={store.chat_history || []}
          ownerName={store.display_name}
        />
      ) : (
        <StoreVisitorView
          store={store}
        />
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

  // If there's published HTML content, show it in an iframe
  if (storeContent) {
    return (
      <main className="w-full" style={{ height: "calc(100vh - 56px)" }}>
        <iframe
          srcDoc={storeContent}
          sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
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
