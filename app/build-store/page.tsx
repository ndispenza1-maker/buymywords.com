import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";

export default async function BuildStorePage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  if (!user.profile_complete) redirect("/build-profile");
  if (user.account_type !== "store_owner") redirect("/");

  return (
    <>
      <NavBar user={user} />
      <div className="pt-20 min-h-screen px-4" style={{ background: "var(--bg)" }}>
        <div className="max-w-lg mx-auto">
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <span className="text-5xl mb-4 block">🏪</span>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>
              Build Your Store
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              This is where you&apos;ll connect your payments, set up your storefront,
              and optionally connect an LLM to help build it out.
            </p>
            <p className="text-xs" style={{ color: "var(--sunset-dusk)" }}>
              Coming soon — we&apos;re building this next.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
