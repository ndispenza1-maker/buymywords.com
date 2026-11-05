"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "", display_name: "" });
  const [foundersCode, setFoundersCode] = useState("");
  const [showFounders, setShowFounders] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState(() => {
    const googleError = searchParams.get("error");
    if (googleError === "google_cancelled") return "Google sign-in was cancelled";
    if (googleError === "google_email_unverified") return "Your Google email is not verified";
    if (googleError) return "Google sign-in failed. Please try again.";
    return "";
  });
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError("You must agree to the Terms of Service and Privacy Policy");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, website: honeypot, founders_code: foundersCode || undefined }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    // Founders code users go straight to profile build
    if (data.founders?.ok) {
      router.push("/build-profile");
    } else {
      router.push("/feed");
    }
  };

  const handleGoogleSignup = () => {
    if (!agreed) {
      setError("You must agree to the Terms of Service and Privacy Policy");
      return;
    }
    // Pass founders code as query param (more reliable than cookie across OAuth redirect)
    const params = new URLSearchParams();
    if (foundersCode.trim()) {
      params.set("founders_code", foundersCode.trim());
    }
    const qs = params.toString();
    window.location.href = `/api/auth/google${qs ? `?${qs}` : ""}`;
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

        <div
          className="p-8 rounded-xl space-y-4"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <h2 className="text-xl font-bold text-center mb-2">Create your account</h2>

          {/* Terms & Privacy consent — above all sign-up methods */}
          <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded cursor-pointer accent-[var(--accent)]"
              />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                I agree to The Mall&apos;s{" "}
                <Link href="/terms" target="_blank" style={{ color: "var(--accent)" }}>Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" target="_blank" style={{ color: "var(--accent)" }}>Privacy Policy</Link>
              </span>
            </label>

          {error && (
              <p className="text-sm text-center" style={{ color: "#E85D27" }}>
                {error}
              </p>
            )}

          {/* Google Sign-Up Button */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full py-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-3"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Founders Code */}
            <div>
              <button
                type="button"
                onClick={() => setShowFounders(!showFounders)}
                className="text-xs font-medium flex items-center gap-1 transition-colors"
                style={{ color: "var(--accent)" }}
              >
                {showFounders ? "▾" : "▸"} Have a Founders Code?
              </button>
              {showFounders && (
                <input
                  type="text"
                  value={foundersCode}
                  onChange={(e) => setFoundersCode(e.target.value.toUpperCase())}
                  placeholder="MALL-XXXX-XXXX"
                  maxLength={14}
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none mt-2 tracking-widest font-mono"
                  style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
                />
              )}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
              style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
            >
              {loading ? "Creating..." : "Join The Mall"}
            </button>
          </form>
        </div>

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

export default function SignupPage() {
  return (
    <Suspense>
      <SignupContent />
    </Suspense>
  );
}
