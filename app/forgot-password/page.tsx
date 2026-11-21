import Link from "next/link";
import ForgotForm from "./ForgotForm";

export const metadata = {
  title: "Reset your password — The Mall of Projects",
};

export default function ForgotPasswordPage() {
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
            Forgot your password?
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            Enter your email and we&rsquo;ll send a reset link. It works once and expires in an hour.
          </p>

          <ForgotForm />
        </div>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
          Remembered it?{" "}
          <Link href="/login" style={{ color: "var(--accent)" }}>
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
