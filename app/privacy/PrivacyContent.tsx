"use client";

export default function PrivacyContent() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12" style={{ color: "var(--text)" }}>
      <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--sunset-warm)" }}>
        Privacy Policy
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        Last updated: November 2, 2026
      </p>

      <div className="space-y-8 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            1. Who We Are
          </h2>
          <p>
            The Mall of Projects (&quot;The Mall,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is operated by{" "}
            <strong style={{ color: "var(--text)" }}>LFH Productions LLC</strong>. This Privacy
            Policy explains how we collect, use, store, and protect your personal information when
            you use our platform at themallofprojects.com.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            2. Information We Collect
          </h2>
          <p className="mb-3">We collect the following types of information:</p>
          <h3 className="font-semibold mb-2" style={{ color: "var(--text)" }}>
            Information You Provide
          </h3>
          <ul className="list-disc pl-6 space-y-2 mb-4">
            <li><strong style={{ color: "var(--text)" }}>Account information:</strong> email address, display name, password (stored as a secure hash — we never store your actual password)</li>
            <li><strong style={{ color: "var(--text)" }}>Profile information:</strong> bio, avatar photo, account type (Shopper or Store Owner)</li>
            <li><strong style={{ color: "var(--text)" }}>Content:</strong> posts, comments, messages, and store content you create on the platform</li>
            <li><strong style={{ color: "var(--text)" }}>Payment information:</strong> processed entirely by Stripe. We never see, store, or have access to your full credit card number. We store only your Stripe customer ID to manage your subscription.</li>
          </ul>
          <h3 className="font-semibold mb-2" style={{ color: "var(--text)" }}>
            Information Collected Automatically
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong style={{ color: "var(--text)" }}>IP address:</strong> used for rate limiting and security (spam/bot prevention)</li>
            <li><strong style={{ color: "var(--text)" }}>Browser information:</strong> User-Agent string, used for bot detection</li>
            <li><strong style={{ color: "var(--text)" }}>Cookies:</strong> we use a single HTTP-only authentication cookie to keep you logged in. We do not use advertising cookies, tracking pixels, or third-party analytics cookies.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            3. How We Use Your Information
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>To create and manage your account</li>
            <li>To display your profile, posts, and store to other users</li>
            <li>To process subscription payments through Stripe</li>
            <li>To send notifications about activity on your account (likes, comments, follows, messages)</li>
            <li>To enforce our Terms of Service and protect against spam, abuse, and unauthorized access</li>
            <li>To improve the platform</li>
          </ul>
          <p className="mt-3">
            <strong style={{ color: "var(--text)" }}>We do not sell your personal information. Ever.</strong>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            4. Who We Share Your Information With
          </h2>
          <p className="mb-3">We share your information only with the following third-party services, strictly to operate the platform:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong style={{ color: "var(--text)" }}>Stripe</strong> — payment processing. Stripe receives your email and payment details to process subscriptions. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>Stripe&apos;s Privacy Policy</a>.</li>
            <li><strong style={{ color: "var(--text)" }}>Cloudinary</strong> — image hosting. Avatar photos you upload are stored on Cloudinary. See <a href="https://cloudinary.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>Cloudinary&apos;s Privacy Policy</a>.</li>
            <li><strong style={{ color: "var(--text)" }}>Neon</strong> — database hosting. Your account data is stored in a Neon-hosted PostgreSQL database. See <a href="https://neon.tech/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>Neon&apos;s Privacy Policy</a>.</li>
            <li><strong style={{ color: "var(--text)" }}>Vercel</strong> — website hosting. Vercel serves the platform and may process server logs. See <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>Vercel&apos;s Privacy Policy</a>.</li>
            <li><strong style={{ color: "var(--text)" }}>Anthropic</strong> — AI assistant (Store Owners with Fresh plans only). If you use the store-building assistant, your chat messages are processed by Anthropic&apos;s Claude API. See <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>Anthropic&apos;s Privacy Policy</a>.</li>
          </ul>
          <p className="mt-3">
            We do not share your data with advertisers, data brokers, or any other third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            5. Cookies
          </h2>
          <p>
            We use a single, essential cookie (<code style={{ color: "var(--accent)" }}>auth_token</code>) to keep you logged in.
            This cookie is HTTP-only (not accessible to JavaScript), secure (HTTPS only in production),
            and expires after 30 days. We do not use tracking cookies, advertising cookies, or any
            third-party cookie services.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            6. Data Retention
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your account data is retained for as long as your account is active.</li>
            <li>If you delete your account, we will delete your personal data within 30 days, except where we are required by law to retain it (e.g., billing records).</li>
            <li>Posts, comments, and messages you&apos;ve sent may remain visible to other users even after account deletion, but will be disassociated from your identity.</li>
            <li>Stripe retains payment records independently per their own retention policy.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            7. Your Rights
          </h2>
          <p className="mb-3">Depending on your jurisdiction, you may have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong style={{ color: "var(--text)" }}>Access</strong> the personal information we hold about you</li>
            <li><strong style={{ color: "var(--text)" }}>Correct</strong> inaccurate information</li>
            <li><strong style={{ color: "var(--text)" }}>Delete</strong> your account and personal data</li>
            <li><strong style={{ color: "var(--text)" }}>Export</strong> your data in a portable format</li>
            <li><strong style={{ color: "var(--text)" }}>Opt out</strong> of any marketing communications (we don&apos;t send marketing emails currently)</li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, contact us through the platform or at the email listed below.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            8. California Residents (CCPA/CPRA)
          </h2>
          <p className="mb-3">
            If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA):
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>The right to know what personal information we collect and how it is used</li>
            <li>The right to request deletion of your personal information</li>
            <li>The right to opt out of the sale of personal information — <strong style={{ color: "var(--text)" }}>we do not sell personal information</strong></li>
            <li>The right to non-discrimination for exercising your privacy rights</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            9. Security
          </h2>
          <p>
            We take reasonable measures to protect your information, including: password hashing (bcrypt),
            HTTP-only secure cookies, rate limiting, bot detection, account age gating, and encrypted
            database connections. However, no system is 100% secure. We cannot guarantee the absolute
            security of your data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            10. Children
          </h2>
          <p>
            The Mall is not intended for users under 13 years of age. We do not knowingly collect
            personal information from children under 13. If we discover that a child under 13 has
            created an account, we will delete it immediately.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            11. Third-Party Stores
          </h2>
          <p>
            Store Owners on The Mall operate independently. When you visit a store or make a purchase
            from a Store Owner, you may be interacting with their own payment processors, websites,
            and services. <strong style={{ color: "var(--text)" }}>Each Store Owner may have their own privacy practices.
            The Mall is not responsible for the privacy practices of individual Store Owners.</strong>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: "var(--text)" }}>
            12. Changes to This Policy
          </h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify users of material
            changes by posting a notice on the platform. Continued use of The Mall after changes
            constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="pt-6 mt-6" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            The Mall of Projects is a DBA of{" "}
            <strong style={{ color: "var(--text)" }}>LFH Productions LLC</strong>.
            <br />
            For privacy questions or data requests, contact us through the platform.
          </p>
        </section>
      </div>
    </main>
  );
}
