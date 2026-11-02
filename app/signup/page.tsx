"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", display_name: "" });
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, website: honeypot }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    router.push("/feed");
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

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
          <h2 className="text-xl font-bold text-center mb-2">Create your account</h2>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              Name
            </label>
            <input
              type="text"
              value={form.display_name}
              onChange={set("display_name")}
              required
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none"
              style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
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
              onChange={set("password")}
              required
              minLength={6}
              placeholder="Min 6 characters"
              className="w-full px-4 py-3 rounded-lg text-sm outline-none"
              style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
            />
          </div>

          {/* Honeypot — invisible to humans */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0 }}
          />

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
            {loading ? "Creating..." : "Join The Mall"}
          </button>

          <p className="text-center text-xs mt-3" style={{ color: "var(--text-muted)" }}>
            By signing up, you agree to our{" "}
            <Link href="/terms" style={{ color: "var(--accent)" }}>
              Terms of Service
            </Link>
          </p>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--accent)" }}>
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
