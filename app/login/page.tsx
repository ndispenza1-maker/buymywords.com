"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    router.push("/feed");
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "var(--bg)" }}
    >
      <div className="w-full max-w-md">
        <Link href="/" className="no-underline">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold" style={{ color: "var(--sunset-warm)" }}>
              The Mall
            </h1>
            <p className="text-[10px] tracking-widest" style={{ color: "var(--text-muted)" }}>
              themallofprojects.com
            </p>
          </div>
        </Link>

        <form
          onSubmit={handleSubmit}
          className="p-8 rounded-xl space-y-4"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <h2 className="text-xl font-bold text-center mb-2">Welcome back</h2>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none"
              style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              className="w-full px-4 py-3 rounded-lg text-sm outline-none"
              style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
            />
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: "#E85D27" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
            style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
          Don&rsquo;t have an account?{" "}
          <Link href="/signup" style={{ color: "var(--accent)" }}>
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
