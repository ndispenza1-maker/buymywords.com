"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ChallengeState {
  canPlay: boolean;
  freeAvailable: boolean;
  paidCredits: number;
  nextFreeAt: string | null;
  msUntilFree: number;
  reason: string;
}

interface Counters {
  attempts: number;
  conceded: number;
  throwers: number;
}

interface ThreadItem {
  role: "user" | "letty";
  text: string;
}

interface Answer {
  id: string;
  idea: string;
  reply: string;
  result: "held" | "conceded";
  turns: number;
}

const PRICE = "$1.99";
const MAX_TURNS = 3;
const lettyAvatar = "/letty-avatar.svg";

function getVisitorId(): string | null {
  try {
    let vid = localStorage.getItem("mall_visitor_id");
    if (!vid) {
      vid = crypto.randomUUID();
      localStorage.setItem("mall_visitor_id", vid);
    }
    return vid;
  } catch {
    return null;
  }
}

export default function LettyChallenge({
  variant = "rail",
  signedIn = false,
}: {
  variant?: "rail" | "card";
  signedIn?: boolean;
}) {
  const [state, setState] = useState<ChallengeState | null>(null);
  const [counters, setCounters] = useState<Counters | null>(null);
  const [open, setOpen] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [idea, setIdea] = useState("");
  const [replyText, setReplyText] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [thread, setThread] = useState<ThreadItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posted, setPosted] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  const refresh = useCallback(async () => {
    const vid = getVisitorId();
    const res = await fetch(`/api/challenge?vid=${encodeURIComponent(vid || "")}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setState(data.state);
    setCounters(data.counters);
  }, []);

  // Handle the return trip from Stripe.
  useEffect(() => {
    const url = new URL(window.location.href);
    const sessionId = url.searchParams.get("session_id");
    const paid = url.searchParams.get("letty_paid");
    const canceled = url.searchParams.get("letty_cancel");

    if (paid && sessionId) {
      fetch(`/api/challenge/verify?session_id=${encodeURIComponent(sessionId)}`, { cache: "no-store" })
        .then((r) => r.json())
        .then(() => {
          refresh();
          setOpen(true);
        })
        .catch(() => {})
        .finally(() => {
          url.searchParams.delete("letty_paid");
          url.searchParams.delete("session_id");
          window.history.replaceState({}, "", url.toString());
        });
    } else if (canceled) {
      url.searchParams.delete("letty_cancel");
      window.history.replaceState({}, "", url.toString());
      refresh();
    } else {
      refresh();
    }
  }, [refresh]);

  // Countdown ticker only while the 24h window is running.
  useEffect(() => {
    if (!state?.nextFreeAt || state.msUntilFree <= 0) return;
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [state?.nextFreeAt, state?.msUntilFree]);

  const msLeft = state ? Math.max(0, new Date(state.nextFreeAt || 0).getTime() - Date.now()) : 0;
  const turns = answer?.turns ?? 0;
  const sessionOver = turns >= MAX_TURNS;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open || thread.length > 0) return;
    setTimeout(() => textareaRef.current?.focus(), 80);
  }, [open, thread.length]);

  async function send(text: string) {
    const res = await fetch("/api/challenge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idea: text,
        visitor_id: getVisitorId(),
        challenge_id: answer?.id || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something broke in the shop.");
      if (data.state) setState(data.state);
      return false;
    }
    setAnswer(data.challenge);
    setThread(data.challenge.thread ?? []);
    setState(data.state);
    setCounters(data.counters);
    return true;
  }

  async function throwIt() {
    if (busy || idea.trim().length < 3) return;
    setBusy(true);
    setError(null);
    try {
      if (await send(idea.trim())) setIdea("");
    } catch {
      setError("Something broke in the shop. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function reply() {
    if (busy || replyText.trim().length < 2) return;
    setBusy(true);
    setError(null);
    try {
      if (await send(replyText.trim())) setReplyText("");
    } catch {
      setError("Something broke in the shop. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function postToMall() {
    if (!answer || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/challenge/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge_id: answer.id, visitor_id: getVisitorId() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't post that.");
        return;
      }
      setPosted(data.postId);
      if (data.counters) setCounters(data.counters);
      setTimeout(() => closeAll(), 1400);
    } catch {
      setError("Couldn't post that.");
    } finally {
      setBusy(false);
    }
  }

  async function buyTry() {
    if (!signedIn) {
      window.location.href = "/login?next=/";
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/challenge/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || "Checkout unavailable.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Checkout unavailable.");
    } finally {
      setBusy(false);
    }
  }

  function closeAll() {
    setOpen(false);
    setAnswer(null);
    setThread([]);
    setIdea("");
    setReplyText("");
    setPosted(null);
    setError(null);
    setShowRules(false);
    refresh();
  }

  const boxClass = variant === "rail" ? "rounded-xl p-4" : "rounded-2xl p-4 sm:p-5";

  return (
    <>
      <div className={boxClass} style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <p
            className="text-[10px] font-bold tracking-[0.15em] uppercase"
            style={{ color: "var(--sunset-warm, #E89B6B)" }}
          >
            Letty&apos;s Challenge
          </p>
          <button
            type="button"
            onClick={() => setShowRules((v) => !v)}
            aria-label="Rules and security"
            aria-expanded={showRules}
            className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold leading-none transition-colors"
            style={{
              border: "1px solid var(--border-strong)",
              color: "var(--text-muted)",
              background: showRules ? "var(--accent-light)" : "transparent",
            }}
          >
            i
          </button>
        </div>

        <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-muted)" }}>
          Find something that can&apos;t break down into Love, Fear, or Hunger. Letty says you can&apos;t.
          Step in the ring.
        </p>

        {showRules && <RulesBlock />}

        {counters && counters.attempts > 0 && (
          <p className="text-[11px] mb-3 tabular-nums" style={{ color: "var(--text-muted)" }}>
            <strong style={{ color: "var(--text)" }}>{counters.attempts.toLocaleString()}</strong> thrown ·{" "}
            <strong style={{ color: "var(--text)" }}>{counters.conceded.toLocaleString()}</strong> survived
          </p>
        )}

        {state?.reason === "cooldown" && state.paidCredits <= 0 ? (
          <div className="space-y-2">
            <p className="text-[11px] tabular-nums" style={{ color: "var(--text-muted)" }}>
              Next free challenge in <strong style={{ color: "var(--text)" }}>{countdown(msLeft)}</strong>
            </p>
            <button
              type="button"
              onClick={buyTry}
              disabled={busy}
              className="w-full text-sm py-2 rounded-full font-semibold transition-opacity disabled:opacity-50"
              style={{ background: "var(--accent-light)", color: "var(--accent)" }}
            >
              Buy another try · {PRICE}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-full text-sm py-2 rounded-full font-semibold transition-opacity hover:opacity-90"
            style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
          >
            Challenge
          </button>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          style={{ background: "rgba(20,14,14,0.72)", backdropFilter: "blur(3px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeAll();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Letty's Challenge"
            className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)" }}
          >
            {/* ID-card header */}
            <div
              className="px-5 py-4 flex items-center gap-3"
              style={{
                background: "linear-gradient(120deg, var(--sunset-warm, #F4845F) 0%, var(--sunset-rose, #E8998D) 100%)",
                color: "#2D2424",
              }}
            >
              <div
                className="relative w-14 h-14 rounded-xl shrink-0 overflow-hidden"
                style={{ background: "rgba(255,255,255,0.85)", color: "#2D2424" }}
              >
                <span className="absolute inset-0 flex items-center justify-center text-xl font-black">L</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lettyAvatar}
                  alt="Letty"
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold tracking-[0.22em] uppercase opacity-80">The Ring · The Mall</p>
                <p className="text-2xl font-black tracking-[0.18em] leading-tight">LETTY</p>
                <p className="text-[10px] font-semibold tracking-[0.1em] uppercase opacity-80">
                  LFH Mechanic · Restoration Garage
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[9px] font-mono tracking-wider opacity-70">ID</p>
                <p className="text-[10px] font-mono font-bold">0001</p>
                <button
                  type="button"
                  onClick={closeAll}
                  aria-label="Close"
                  className="mt-2 text-xs font-bold px-2 py-0.5 rounded"
                  style={{ background: "rgba(45,36,36,0.14)" }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {error && (
                <div
                  className="px-3 py-2 rounded text-xs"
                  style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                >
                  {error}
                </div>
              )}

              {!answer && (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Name it. One session, up to three replies. Make them count.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowRules((v) => !v)}
                      className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold leading-none"
                      style={{ border: "1px solid var(--border-strong)", color: "var(--text-muted)" }}
                      aria-label="Rules and security"
                    >
                      i
                    </button>
                  </div>

                  {showRules && <RulesBlock />}

                  {!state ? (
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      Warming up the shop…
                    </p>
                  ) : state.canPlay ? (
                    <>
                      <textarea
                        ref={textareaRef}
                        value={idea}
                        onChange={(e) => setIdea(e.target.value.slice(0, 1000))}
                        rows={4}
                        placeholder="Something you think can't reduce to Love, Fear, or Hunger."
                        className="w-full resize-none rounded-lg px-3 py-2.5 text-sm outline-none"
                        style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            throwIt();
                          }
                        }}
                      />
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] tabular-nums" style={{ color: "var(--text-muted)" }}>
                          {idea.length}/1000
                          {state.paidCredits > 0
                            ? ` · ${state.paidCredits} paid ${state.paidCredits === 1 ? "try" : "tries"} left`
                            : " · free throw"}
                        </p>
                        <button
                          type="button"
                          onClick={throwIt}
                          disabled={busy || idea.trim().length < 3}
                          className="px-5 py-2 rounded-full text-sm font-bold transition-opacity disabled:opacity-40"
                          style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
                        >
                          {busy ? "Sizing you up…" : "Throw"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm" style={{ color: "var(--text)" }}>
                        {state.reason === "off_the_clock"
                          ? "Letty's off the clock this month. She'll be back."
                          : state.reason === "ip_limit"
                            ? "That device has hit today's limit."
                            : "You've used today's free challenge."}
                      </p>
                      {state.reason === "cooldown" && (
                        <p className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                          Next free challenge in{" "}
                          <strong style={{ color: "var(--text)" }}>{countdown(msLeft)}</strong>
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={buyTry}
                        disabled={busy}
                        className="px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-50"
                        style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                      >
                        {signedIn ? `Buy another try · ${PRICE}` : "Log in to buy another try"}
                      </button>
                    </div>
                  )}
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    One free session per device every 24 hours. {PRICE} per extra session. Up to {MAX_TURNS} replies.
                  </p>
                </>
              )}

              {answer && (
                <>
                  {posted ? (
                    <div className="rounded-lg px-4 py-6 text-center space-y-1" style={{ background: "var(--accent-light)" }}>
                      <p className="text-sm font-bold" style={{ color: "var(--accent)" }}>
                        On The Mall.
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        She posted it under her own name.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {thread.map((t, i) =>
                          t.role === "user" ? (
                            <div
                              key={i}
                              className="rounded-lg p-3"
                              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                            >
                              <p
                                className="text-[9px] font-bold tracking-[0.15em] uppercase mb-1"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {i === 0 ? "Your challenge" : "You"}
                              </p>
                              <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text)" }}>
                                {t.text}
                              </p>
                            </div>
                          ) : (
                            <div
                              key={i}
                              className="rounded-lg p-3"
                              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
                            >
                              <div className="flex items-center justify-between mb-1 gap-2">
                                <p
                                  className="text-[9px] font-bold tracking-[0.15em] uppercase"
                                  style={{ color: "var(--accent)" }}
                                >
                                  🔧 Letty
                                </p>
                                {i === thread.length - 1 && (
                                  <span
                                    className="text-[9px] font-bold tracking-[0.12em] uppercase px-1.5 py-0.5 rounded"
                                    style={{
                                      background:
                                        answer.result === "conceded"
                                          ? "var(--sunset-gold, #F5D76E)"
                                          : "var(--accent-light)",
                                      color: answer.result === "conceded" ? "#2D2424" : "var(--accent)",
                                    }}
                                  >
                                    {answer.result === "conceded" ? "Conceded" : "Held"}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--text)" }}>
                                {t.text}
                              </p>
                            </div>
                          )
                        )}
                      </div>

                      {answer.result === "conceded" && (
                        <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                          She met her edge. Post it — concessions get reviewed by hand, and the first five verified
                          cracks go on the wall.
                        </p>
                      )}

                      {sessionOver ? (
                        <p className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>
                          Three replies. Session closed — post it or throw it out.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <textarea
                            ref={replyRef}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value.slice(0, 1000))}
                            rows={2}
                            placeholder={`Reply ${turns + 1} of ${MAX_TURNS} — press her on it.`}
                            className="w-full resize-none rounded-lg px-3 py-2 text-sm outline-none"
                            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                reply();
                              }
                            }}
                          />
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={reply}
                              disabled={busy || replyText.trim().length < 2}
                              className="px-4 py-1.5 rounded-full text-xs font-bold disabled:opacity-40"
                              style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
                            >
                              {busy ? "…" : "Send"}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          onClick={postToMall}
                          disabled={busy}
                          className="px-4 py-2 rounded-full text-sm font-bold disabled:opacity-50"
                          style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
                        >
                          {busy ? "Posting…" : "Post to the Mall"}
                        </button>
                        <button
                          type="button"
                          onClick={buyTry}
                          disabled={busy}
                          className="px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-50"
                          style={{ background: "var(--accent-light)", color: "var(--accent)" }}
                        >
                          {signedIn ? `New session · ${PRICE}` : "New session · log in"}
                        </button>
                        <button
                          type="button"
                          onClick={closeAll}
                          className="px-4 py-2 rounded-full text-sm font-semibold"
                          style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
                        >
                          Discard
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function countdown(ms: number): string {
  if (ms <= 0) return "now";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

function RulesBlock() {
  const items = [
    "One free session per device every 24 hours. The clock starts when your last session is spent.",
    `Out of tries? ${PRICE} buys a new session. That's what keeps her free for everyone else.`,
    "A session is up to three of her replies. Then it's post or discard — no open-ended arguing.",
    "One throw at a time. Devices, accounts, and IPs are capped — no loops, no scripts.",
    "Letty doesn't give medical, legal, or financial advice. She argues about the framework.",
    "Anything you post lands on the Mall's public feed, under her name, with your words. Leave out personal details.",
    "If you're in crisis, call or text 988. She's a mechanic, not a hotline.",
  ];
  return (
    <div className="rounded-lg p-3 space-y-1.5 mb-3" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      <p className="text-[9px] font-bold tracking-[0.15em] uppercase" style={{ color: "var(--text-muted)" }}>
        House rules
      </p>
      <ul className="space-y-1">
        {items.map((t) => (
          <li key={t} className="text-[11px] leading-relaxed flex gap-1.5" style={{ color: "var(--text-muted)" }}>
            <span style={{ color: "var(--accent)" }}>·</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
      <a href="/challenge-rules" className="text-[11px] font-semibold no-underline" style={{ color: "var(--accent)" }}>
        Full rules →
      </a>
    </div>
  );
}
