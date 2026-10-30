import Link from "next/link";

export default function LandingPage() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{
        background: "linear-gradient(135deg, #2D2424 0%, #4A2F2F 30%, #6B3A3A 50%, #F4845F 80%, #F7B267 100%)",
      }}
    >
      <div className="text-center max-w-2xl">
        {/* Brand */}
        <div className="mb-8">
          <h1
            className="text-6xl md:text-8xl font-bold mb-1"
            style={{ color: "#F7B267" }}
          >
            The Mall
          </h1>
          <p
            className="text-sm tracking-widest"
            style={{ color: "#C4A1A1" }}
          >
            buymywords.com
          </p>
        </div>

        {/* Tagline */}
        <p
          className="text-xl md:text-2xl mb-4 leading-relaxed"
          style={{ color: "#FDF8F4" }}
        >
          A clean space for real people.
        </p>
        <p
          className="text-base md:text-lg mb-12 leading-relaxed"
          style={{ color: "#C4A1A1" }}
        >
          No bots. No algorithm. No noise.
          <br />
          Just people connecting, building, and selling what they make.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="px-8 py-4 rounded-full text-lg font-semibold no-underline transition-all"
            style={{
              background: "#F4845F",
              color: "#FDF8F4",
            }}
          >
            Join The Mall
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 rounded-full text-lg font-semibold no-underline transition-all"
            style={{
              background: "rgba(255,255,255,0.1)",
              color: "#FDF8F4",
              border: "1px solid rgba(244,132,95,0.4)",
            }}
          >
            Log in
          </Link>
        </div>
      </div>

      {/* Footer */}
      <p
        className="absolute bottom-6 text-xs"
        style={{ color: "#8B6F6F" }}
      >
        Humans only. &copy; {new Date().getFullYear()}
      </p>
    </main>
  );
}
