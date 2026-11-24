import NavBar from "@/components/NavBar";
import { getAuthUser } from "@/lib/auth";

export const metadata = {
  title: "Letty's Challenge — Rules | The Mall of Projects",
  description:
    "The rules, the security, and the prize for Letty's Challenge at The Mall of Projects.",
};

const PRICE = "$1.99";

export default async function ChallengeRulesPage() {
  const user = await getAuthUser();

  return (
    <>
      <NavBar user={user} />
      <main className="pt-24 pb-16 min-h-screen" style={{ background: "var(--bg)" }}>
        <div className="max-w-2xl mx-auto px-5">
          <p
            className="text-[10px] font-bold tracking-[0.22em] uppercase mb-2"
            style={{ color: "var(--sunset-warm, #E89B6B)" }}
          >
            The Ring
          </p>
          <h1 className="text-3xl font-black mb-3" style={{ color: "var(--text)" }}>
            Letty&apos;s Challenge
          </h1>
          <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--text-muted)" }}>
            Letty is the LFH mechanic. Her job is simple and she does not lose easy: take whatever you throw at
            her and show that it reduces to Love, Fear, or Hunger. If it truly does not, she says so. That&apos;s a
            concession, and it is rare.
          </p>

          <Section title="How it works">
            <ul className="space-y-2">
              <Item>Name something you believe cannot break down into Love, Fear, or Hunger.</Item>
              <Item>Throw it. She answers in the ring — sharp, short, and she shows her work.</Item>
              <Item>Post it to the Mall&apos;s shared feed under her name, or discard it. Discarded challenges never leave your screen.</Item>
              <Item>One free throw per device every 24 hours. The clock starts when your last throw is spent.</Item>
            </ul>
          </Section>

          <Section title={`Tries and pricing`}>
            <ul className="space-y-2">
              <Item>First throw every 24 hours is free.</Item>
              <Item>{PRICE} buys exactly one more try. Buy as many as you want. A bought try works even while the 24-hour window is running.</Item>
              <Item>Nothing is charged for opening the box. Only a real throw spends an attempt.</Item>
              <Item>Payments run through Stripe. Buying a try requires a Mall account.</Item>
            </ul>
          </Section>

          <Section title="Security">
            <ul className="space-y-2">
              <Item>Attempts are tied to your device and, when signed in, to your account.</Item>
              <Item>An address gets a small number of free throws per day even if cookies are cleared.</Item>
              <Item>Automated clients are blocked. Repeated throw attempts are rate limited.</Item>
              <Item>Every attempt is logged with its timestamp and verdict. That log is what the public counter reads.</Item>
            </ul>
          </Section>

          <Section title="What happens when you win">
            <p className="text-sm leading-relaxed mb-2" style={{ color: "var(--text-muted)" }}>
              A concession is not automatic. Posted concessions are reviewed by a human, because the whole point
              is that a person found a real edge — not that a script ground out a lucky roll.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              The Builder may, at his sole discretion, grant a lifetime Founders Code and, to each of the first
              five verified challengers, an award of up to two percent of The Mall of Projects, under a separate
              written agreement. Nothing on this page is an offer to sell securities, and no award exists until
              that agreement is signed. Verified cracks go on the wall either way.
            </p>
          </Section>

          <Section title="The fine print">
            <ul className="space-y-2">
              <Item>Letty does not give medical, legal, or financial advice. She argues about the framework.</Item>
              <Item>Anything you post is public and permanent, under her name, using your words. Do not include personal details about yourself or anyone else.</Item>
              <Item>Do not use the box to harass, threaten, or expose another person.</Item>
              <Item>If you are in crisis, call or text 988. Letty is a mechanic, not a hotline.</Item>
              <Item>The Builder may adjust limits, pricing, or availability at any time.</Item>
            </ul>
          </Section>

          <div className="mt-10">
            <a
              href="/"
              className="inline-block px-5 py-2.5 rounded-full text-sm font-bold no-underline"
              style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
            >
              Back to The Mall
            </a>
          </div>
        </div>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-bold tracking-[0.12em] uppercase mb-3" style={{ color: "var(--text)" }}>
        {title}
      </h2>
      <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        {children}
      </div>
    </section>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="text-sm leading-relaxed flex gap-2" style={{ color: "var(--text-muted)" }}>
      <span style={{ color: "var(--accent)" }}>·</span>
      <span>{children}</span>
    </li>
  );
}
