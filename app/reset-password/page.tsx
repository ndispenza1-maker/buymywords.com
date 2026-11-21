import Link from "next/link";
import ResetForm from "./ResetForm";

export const metadata = {
  title: "Choose a new password — The Mall of Projects",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md">
        <Link href="/" className="no-underline block text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: "var(--sunset-warm)" }}>
            the mall
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
            of projects
          </p>
        </Link>

        <div className="rounded-2xl p-8" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>
            Choose a new password
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            At least 8 characters. You&rsquo;ll be signed in once it&rsquo;s set.
          </p>

          <ResetForm token={token || ""} />
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
          Link expired?{" "}
          <Link href="/forgot-password" style={{ color: "var(--accent)" }}>
            Request a new one
          </Link>
        </p>
      </div>
    </main>
  );
}
